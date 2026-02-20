import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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
      res.status(500).json({ error: "Failed to fetch tailor" });
    }
  });

  app.get("/api/tailors/:id/portfolio", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioItemsByTailor(req.params.id);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.get("/api/tailors/:id/products", async (req, res) => {
    try {
      const products = await storage.getProductsByTailor(req.params.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/tailors/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByTailor(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Public routes - Portfolio
  app.get("/api/portfolio", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioItems();
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Public routes - Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
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
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/user/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const prefs = await storage.upsertUserPreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
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
      res.status(500).json({ error: "Failed to update tailor profile" });
    }
  });

  // Protected routes - Conversations
  app.get("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
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
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/messages/:conversationId", requireAuth, async (req: any, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
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
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Protected routes - Measurements
  app.get("/api/measurements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const measurements = await storage.getMeasurements(userId);
      res.json(measurements || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  });

  app.post("/api/measurements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const measurements = await storage.upsertMeasurements({
        ...req.body,
        userId,
      });
      res.status(201).json(measurements);
    } catch (error) {
      res.status(500).json({ error: "Failed to save measurements" });
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
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
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
      const artisan = await storage.createAdminArtisan(req.body);
      res.status(201).json(artisan);
    } catch (error) {
      console.error("Error creating admin artisan:", error);
      res.status(500).json({ error: "Failed to create artisan" });
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

  return httpServer;
}
