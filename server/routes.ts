import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  (req as any).authUserId = (req.user as any).id;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = req.user as any;
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Accès réservé aux administrateurs" });
  }
  (req as any).authUserId = user.id;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== Temporary download route =====
  app.get("/download/dist-bundle", (req, res) => {
    const filePath = path.resolve(process.cwd(), "dist/index.cjs");
    res.download(filePath, "index.cjs");
  });

  // ===== Professional Plan Routes =====

  app.get("/api/professionnel/plan", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(404).json({ message: "Profil artisan introuvable" });
      }
      res.json({
        tailorId: tailor.id,
        subscriptionPlan: tailor.subscriptionPlan || "Starter",
      });
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/professionnel/upgrade", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(404).json({ message: "Profil artisan introuvable" });
      }
      if (tailor.subscriptionPlan === "Pro") {
        return res.json({ success: true, message: "Déjà abonné au plan Pro", subscriptionPlan: "Pro" });
      }
      const updated = await storage.updateTailor(tailor.id, { subscriptionPlan: "Pro" });
      res.json({
        success: true,
        message: "Abonnement Pro activé avec succès",
        subscriptionPlan: updated?.subscriptionPlan || "Pro",
      });
    } catch (error) {
      console.error("Error upgrading plan:", error);
      res.status(500).json({ message: "Erreur lors de la mise à niveau" });
    }
  });

  // Public routes - Tailors
  app.get("/api/tailors", async (req, res) => {
    try {
      const tailors = await storage.getTailors();
      res.json(tailors);
    } catch (error) {
      console.error("Error fetching tailors:", error);
      res.status(500).json({ error: "Failed to fetch tailors" });
    }
  });

  app.get("/api/tailors/:id", async (req, res) => {
    try {
      const tailor = await storage.getTailor(req.params.id);
      if (!tailor) {
        return res.status(404).json({ error: "Tailor not found" });
      }
      res.json(tailor);
    } catch (error) {
      console.error("Failed to fetch tailor:", error);
      res.status(500).json({ error: "Failed to fetch tailor" });
    }
  });

  app.get("/api/tailors/:id/portfolio", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioItemsByTailor(req.params.id);
      res.json(portfolio);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.get("/api/tailors/:id/products", async (req, res) => {
    try {
      const products = await storage.getProductsByTailor(req.params.id);
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/tailors/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByTailor(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Public routes - Portfolio
  app.get("/api/portfolio", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioItems();
      res.json(portfolio);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Public routes - Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Session-based user update (used by profile page)
  app.patch("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      if (userId !== req.params.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { firstName, lastName, email, phone, location, profileImageUrl } = req.body;
      const user = await storage.updateUser(userId, { firstName, lastName, email, phone, location, profileImageUrl });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // User preferences
  app.get("/api/user/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || {});
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/user/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const prefs = await storage.upsertUserPreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // Protected routes - User profile
  app.get("/api/user/me", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/user/me", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { firstName, lastName, phone, location, profileImageUrl } = req.body;
      const user = await storage.updateUser(userId, { firstName, lastName, phone, location, profileImageUrl });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Protected routes - Tailor profile management
  app.get("/api/user/me/tailor", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(404).json({ error: "Tailor profile not found" });
      }
      res.json(tailor);
    } catch (error) {
      console.error("Failed to fetch tailor profile:", error);
      res.status(500).json({ error: "Failed to fetch tailor profile" });
    }
  });

  app.post("/api/user/me/tailor", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      
      const existingTailor = await storage.getTailorByUserId(userId);
      if (existingTailor) {
        return res.status(400).json({ error: "Tailor profile already exists" });
      }
      
      await storage.updateUser(userId, { role: "tailor" });
      
      const tailor = await storage.createTailor({
        userId,
        bio: req.body.bio || "",
        specialties: req.body.specialties || [],
        experience: req.body.experience || 0,
        coverImageUrl: req.body.coverImageUrl || null,
        isVerified: false,
        rating: 0,
        reviewCount: 0,
        portfolioCount: 0,
      });
      
      res.status(201).json(tailor);
    } catch (error) {
      console.error("Error creating tailor profile:", error);
      res.status(500).json({ error: "Failed to create tailor profile" });
    }
  });

  app.patch("/api/user/me/tailor", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(404).json({ error: "Tailor profile not found" });
      }
      
      const { bio, specialties, experience, coverImageUrl } = req.body;
      const updated = await storage.updateTailor(tailor.id, { bio, specialties, experience, coverImageUrl });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update tailor profile:", error);
      res.status(500).json({ error: "Failed to update tailor profile" });
    }
  });

  // Protected routes - Measurements
  app.get("/api/measurements", requireAuth, async (req: any, res) => {
    try {
      const result = await storage.getMeasurements(req.authUserId);
      if (!result) return res.json(null);
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch measurements:", error);
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  });

  app.post("/api/measurements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      console.log("[measurements] POST userId:", userId, "body:", JSON.stringify(req.body));
      const data = { ...req.body, userId };
      const result = await storage.upsertMeasurements(data);
      res.json(result);
    } catch (error: any) {
      console.error("[measurements] FULL ERROR:", error);
      console.error("[measurements] error.message:", error?.message);
      console.error("[measurements] error.code:", error?.code);
      console.error("[measurements] error.sqlMessage:", error?.sqlMessage);
      console.error("[measurements] error.sql:", error?.sql);
      res.status(500).json({ error: "Failed to save measurements", detail: error?.message || String(error) });
    }
  });

  // Protected routes - Conversations
  app.get("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { participantId } = req.body;
      const conversation = await storage.getOrCreateConversation(userId, participantId);
      res.json(conversation);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/support/conversation", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      console.log("[support] userId:", userId);
      const admin = await storage.getAdminUser();
      console.log("[support] admin found:", admin ? admin.id : "NONE");
      if (!admin) {
        return res.status(404).json({ error: "Aucun administrateur trouvé" });
      }
      if (userId === admin.id) {
        return res.status(400).json({ error: "L'admin ne peut pas se contacter lui-même" });
      }
      const conversation = await storage.getOrCreateConversation(userId, admin.id);
      console.log("[support] conversation:", conversation?.id);
      res.json(conversation);
    } catch (error: any) {
      console.error("[support] FULL ERROR:", error);
      console.error("[support] sqlMessage:", error?.sqlMessage);
      console.error("[support] code:", error?.code);
      res.status(500).json({ error: "Failed to create support conversation", detail: error?.sqlMessage || error?.message });
    }
  });

  app.get("/api/messages/:conversationId", requireAuth, async (req: any, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const message = await storage.createMessage({
        ...req.body,
        senderId: userId,
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Protected routes - Projects (for tailors)
  app.get("/api/projects", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(403).json({ error: "Not a tailor" });
      }
      const projects = await storage.getProjectsByTailor(tailor.id);
      res.json(projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/client/projects", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const projects = await storage.getProjectsByClient(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching client projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.patch("/api/projects/:id/step", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(403).json({ error: "Not a tailor" });
      }
      const project = await storage.getProject(req.params.id);
      if (!project || project.tailorId !== tailor.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      const { currentStep, progress, status } = req.body;
      const updated = await storage.updateProject(req.params.id, { currentStep, progress, status });
      res.json(updated);
    } catch (error) {
      console.error("Error updating project step:", error);
      res.status(500).json({ error: "Failed to update project step" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.role === "tailor") {
        const tailor = await storage.getTailorByUserId(userId);
        if (!tailor) {
          return res.status(403).json({ error: "Tailor profile not found" });
        }
        const project = await storage.createProject({
          ...req.body,
          tailorId: tailor.id,
        });
        return res.status(201).json(project);
      }

      if (!req.body.tailorId) {
        return res.status(400).json({ error: "tailorId is required for client projects" });
      }
      const project = await storage.createProject({
        ...req.body,
        clientId: userId,
        status: "pending",
        progress: 0,
        currentStep: "prise_mesures",
      });
      res.status(201).json(project);
    } catch (error) {
      console.error("Failed to create project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Failed to update project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Protected routes - Appointments (for tailors)
  app.get("/api/appointments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(403).json({ error: "Not a tailor" });
      }
      const appointments = await storage.getAppointmentsByTailor(tailor.id);
      res.json(appointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(403).json({ error: "Not a tailor" });
      }
      const appointment = await storage.createAppointment({
        ...req.body,
        tailorId: tailor.id,
      });
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Portfolio management for tailors
  app.post("/api/portfolio", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(403).json({ error: "Not a tailor" });
      }
      const item = await storage.createPortfolioItem({
        ...req.body,
        tailorId: tailor.id,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to add portfolio item:", error);
      res.status(500).json({ error: "Failed to add portfolio item" });
    }
  });

  // Product management for tailors
  app.post("/api/products", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) {
        return res.status(403).json({ error: "Not a tailor" });
      }
      const product = await storage.createProduct({
        ...req.body,
        tailorId: tailor.id,
      });
      res.status(201).json(product);
    } catch (error) {
      console.error("Failed to create product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Reviews
  app.post("/api/reviews", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const review = await storage.createReview({
        ...req.body,
        userId,
      });
      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Admin routes - Dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const artisans = await storage.getAdminArtisans();
      const totalClients = allUsers.filter((u: any) => u.role === "client").length;
      const totalTailors = allUsers.filter((u: any) => u.role === "tailor").length;
      const activeArtisans = artisans.filter((a: any) => a.status === "Actif").length;
      const pendingArtisans = artisans.filter((a: any) => a.status === "En attente").length;
      res.json({
        totalUsers: allUsers.length,
        totalClients,
        totalTailors,
        totalArtisans: artisans.length,
        activeArtisans,
        pendingArtisans,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin routes - Users listing
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/unverified", requireAdmin, async (req, res) => {
    try {
      console.log("[admin] DELETE unverified users");
      const count = await storage.deleteUnverifiedUsers();
      console.log("[admin] Deleted", count, "unverified users");
      res.json({ deleted: count });
    } catch (error: any) {
      console.error("[admin] DELETE unverified FULL ERROR:", error);
      console.error("[admin] error.sqlMessage:", error?.sqlMessage);
      console.error("[admin] error.code:", error?.code);
      res.status(500).json({ error: "Failed to delete unverified users", detail: error?.message || String(error) });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      console.log("[admin] DELETE user:", userId);
      if (userId === (req.user as any)?.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      await storage.deleteUser(userId);
      console.log("[admin] User deleted successfully:", userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("[admin] DELETE user FULL ERROR:", error);
      console.error("[admin] error.message:", error?.message);
      console.error("[admin] error.code:", error?.code);
      console.error("[admin] error.sqlMessage:", error?.sqlMessage);
      res.status(500).json({ error: "Failed to delete user", detail: error?.message || String(error) });
    }
  });

  app.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const { emailVerified } = req.body;
      const updated = await storage.updateUser(req.params.id, { emailVerified });
      if (!updated) return res.status(404).json({ error: "User not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.get("/api/admin/artisans", requireAdmin, async (req, res) => {
    try {
      const artisans = await storage.getAdminArtisans();
      res.json(artisans);
    } catch (error) {
      console.error("Error fetching admin artisans:", error);
      res.status(500).json({ error: "Failed to fetch artisans" });
    }
  });

  app.post("/api/admin/artisans", requireAdmin, async (req, res) => {
    try {
      const { firstName, lastName, email, phone, specialty, city, bio,
              yearsExperience, siret, companyName, subscriptionPlan, ...rest } = req.body;

      console.log("[admin] POST artisan body:", JSON.stringify({ firstName, lastName, email, specialty, city }));

      const {
        legalForm, tvaNumber, iban, birthDate, nationality,
        idType, idNumber, address, paymentStatus
      } = rest;

      const artisan = await storage.createAdminArtisan({
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || null,
        phone: phone || null,
        specialty: specialty || "Couture",
        city: city || "Non renseignée",
        bio: bio || null,
        yearsExperience: parseInt(yearsExperience) || 0,
        siret: siret || null,
        companyName: companyName || null,
        subscriptionPlan: subscriptionPlan || "Starter",
        legalForm: legalForm || null,
        tvaNumber: tvaNumber || null,
        iban: iban || null,
        birthDate: birthDate || null,
        nationality: nationality || null,
        idType: idType || null,
        idNumber: idNumber || null,
        address: address || null,
        paymentStatus: paymentStatus || "En attente",
        joinDate: new Date().toLocaleDateString("fr-FR"),
      });

      if (email) {
        try {
          const existingUser = await storage.getUserByEmail(email);
          if (!existingUser) {
            const bcrypt = await import("bcrypt");
            const tempPassword = await bcrypt.hash("Seamlier2026!", 12);
            const newUser = await storage.createUser({
              email,
              password: tempPassword,
              firstName: firstName || null,
              lastName: lastName || null,
              role: "tailor",
              profileImageUrl: null,
              phone: phone || null,
              location: city || null,
              emailVerified: true,
            });

            await storage.createTailor({
              userId: newUser.id,
              bio: bio || null,
              specialties: specialty ? [specialty] : [],
              experience: parseInt(yearsExperience) || 0,
              coverImageUrl: null,
              isVerified: false,
              rating: 0,
              reviewCount: 0,
              portfolioCount: 0,
              subscriptionPlan: subscriptionPlan || "Starter",
            });
            console.log(`Created user+tailor for admin artisan: ${email}`);
          } else {
            const existingTailor = await storage.getTailorByUserId(existingUser.id);
            if (!existingTailor) {
              await storage.createTailor({
                userId: existingUser.id,
                bio: bio || null,
                specialties: specialty ? [specialty] : [],
                experience: parseInt(yearsExperience) || 0,
                coverImageUrl: null,
                isVerified: false,
                rating: 0,
                reviewCount: 0,
                portfolioCount: 0,
                subscriptionPlan: subscriptionPlan || "Starter",
              });
              console.log(`Created tailor profile for existing user: ${email}`);
            }
          }
        } catch (syncError) {
          console.error("Error syncing admin artisan to tailors:", syncError);
        }
      }

      res.status(201).json(artisan);
    } catch (error: any) {
      console.error("[admin] POST artisan FULL ERROR:", error);
      console.error("[admin] error.sqlMessage:", error?.sqlMessage);
      console.error("[admin] error.code:", error?.code);
      res.status(500).json({ error: "Failed to create artisan", detail: error?.message || String(error) });
    }
  });

  app.put("/api/admin/artisans/:id", requireAdmin, async (req, res) => {
    try {
      const artisan = await storage.updateAdminArtisan(req.params.id, req.body);
      if (!artisan) {
        return res.status(404).json({ error: "Artisan not found" });
      }
      res.json(artisan);
    } catch (error) {
      console.error("Error updating admin artisan:", error);
      res.status(500).json({ error: "Failed to update artisan" });
    }
  });

  app.delete("/api/admin/artisans/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAdminArtisan(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting admin artisan:", error);
      res.status(500).json({ error: "Failed to delete artisan" });
    }
  });

  // Admin routes - Settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        settingsMap[s.key] = s.value;
      }
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body) as [string, string][];
      for (const [key, value] of entries) {
        await storage.upsertAdminSetting(key, value);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving admin settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // Magazine Articles - Admin CRUD
  app.get("/api/admin/articles", requireAdmin, async (req, res) => {
    try {
      const articles = await storage.getMagazineArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.post("/api/admin/articles", requireAdmin, async (req: any, res) => {
    try {
      const { title, category, content, excerpt, imageUrl, status } = req.body;
      const article = await storage.createMagazineArticle({
        title,
        category: category || null,
        content: content || null,
        excerpt: excerpt || null,
        imageUrl: imageUrl || null,
        status: status || "Brouillon",
        authorId: req.authUserId,
      });
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/admin/articles/:id", requireAdmin, async (req, res) => {
    try {
      const article = await storage.updateMagazineArticle(req.params.id, req.body);
      if (!article) return res.status(404).json({ error: "Article not found" });
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/articles/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteMagazineArticle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // Magazine Articles - Public (published only)
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getMagazineArticles(true);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching published articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getMagazineArticle(req.params.id);
      if (!article) return res.status(404).json({ error: "Article not found" });
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Email verification
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).send(renderVerificationPage(false, "Token manquant."));
      }
      const userRaw = await storage.getUserByVerificationToken(token);
      if (!userRaw) {
        return res.status(400).send(renderVerificationPage(false, "Lien invalide ou expiré."));
      }
      if (userRaw.verificationExpires && new Date(userRaw.verificationExpires) < new Date()) {
        return res.status(400).send(renderVerificationPage(false, "Ce lien a expiré. Veuillez vous réinscrire."));
      }
      await storage.updateUser(userRaw.id, {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      } as any);
      return res.send(renderVerificationPage(true, "Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter."));
    } catch (error) {
      console.error("Email verification error:", error);
      return res.status(500).send(renderVerificationPage(false, "Erreur serveur."));
    }
  });

  app.get("/download/seamlier-deploy.zip", (req, res) => {
    const filePath = path.resolve("seamlier-deploy.zip");
    res.download(filePath, "seamlier-deploy.zip", (err) => {
      if (err) {
        res.status(404).send("Fichier non trouvé");
      }
    });
  });

  return httpServer;
}

function renderVerificationPage(success: boolean, message: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vérification Email - SEAMLIER</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#faf9f7;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;border-radius:16px;padding:48px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{width:64px;height:64px;border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:28px}.success{background:#dcfce7;color:#16a34a}.error{background:#fee2e2;color:#dc2626}h1{font-family:'Playfair Display',serif;color:#722F37;font-size:24px;margin-bottom:12px}p{color:#6b7280;line-height:1.6;margin-bottom:24px}a{display:inline-block;background:#722F37;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;transition:background .2s}a:hover{background:#5a252c}</style></head><body><div class="card"><div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div><h1>${success ? 'Email vérifié !' : 'Erreur de vérification'}</h1><p>${message}</p><a href="/connexion">Se connecter</a></div></body></html>`;
}
