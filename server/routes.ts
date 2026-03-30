import { registerStripeRoutes } from "./stripe";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import { tailors, users } from "../shared/schema";
import {
  sendNewMessageEmail,
  sendDeliveryEmail,
  sendReviewRequestEmail,
  sendPaymentConfirmationEmail,
  sendAppointmentConfirmationEmail,
  sendFabricDepositReminderEmail,
  sendDeadlineWarningEmail,
} from "./email";

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
      const t = tailor as any;
      res.json({
        tailorId: tailor.id,
        subscriptionPlan: tailor.subscriptionPlan || "Starter",
        subscriptionCurrentPeriodEnd: t.subscriptionCurrentPeriodEnd || null,
        stripeSubscriptionId: t.stripeSubscriptionId || null,
      });
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/professionnel/upgrade", requireAuth, (_req, res) => {
    res.status(403).json({ error: "Paiement requis — utilisez /api/stripe/subscription/create" });
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

  // Get tailor profile by user ID (public, used for /prendre-rdv page)
  app.get("/api/tailor-by-user/:userId", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT t.*, u.first_name, u.last_name, u.profile_image_url, u.email, u.location
        FROM tailors t
        JOIN users u ON u.id = t.user_id
        WHERE t.user_id = ?
        LIMIT 1
      `, [req.params.userId]) as any[];
      if (!(rows as any[]).length) return res.status(404).json({ error: "Tailor not found" });
      const row = (rows as any[])[0];
      res.json({
        ...row,
        user: {
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
          email: row.email,
          location: row.location,
        },
      });
    } catch (error) {
      console.error("Failed to fetch tailor by userId:", error);
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
      const allReviews = await storage.getReviewsByTailor(req.params.id);
      const reviews = allReviews.filter((r: any) => r.isApproved === 1 || r.is_approved === 1);
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
  app.get("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.authUserId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, verificationToken: __, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching own profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

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
      const logBody = { ...req.body };
      if (logBody.photoUrl) logBody.photoUrl = `[base64 ${logBody.photoUrl.length} chars]`;
      console.log("[measurements] POST userId:", userId, "body:", JSON.stringify(logBody));
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
      let { participantId, tailorId } = req.body;
      if (tailorId && !participantId) {
        const tailor = await db.select({ userId: tailors.userId })
          .from(tailors)
          .where(eq(tailors.id, tailorId));
        if (tailor[0]?.userId) participantId = tailor[0].userId;
      }
      if (!participantId) return res.status(400).json({ error: "participantId requis" });
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

  app.get("/api/conversations/unread-count", requireAuth, async (req: any, res) => {
    try {
      const count = await storage.getUnreadCount(req.authUserId);
      res.json({ count });
    } catch (error) {
      res.json({ count: 0 });
    }
  });

  app.get("/api/messages/:conversationId", requireAuth, async (req: any, res) => {
    try {
      const msgs = await storage.getMessages(req.params.conversationId);
      console.log(`[GET /api/messages/${req.params.conversationId}] returning ${msgs.length} messages, user=${req.authUserId}`);
      res.json(msgs);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.patch("/api/messages/:conversationId/read", requireAuth, async (req: any, res) => {
    try {
      await storage.markMessagesAsRead(req.params.conversationId, req.authUserId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.patch("/api/messages/all/read", requireAuth, async (req: any, res) => {
    try {
      await storage.markAllMessagesAsRead(req.authUserId);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { sentAt, ...bodyWithoutSentAt } = req.body;
      const message = await storage.createMessage({
        ...bodyWithoutSentAt,
        senderId: userId,
      });
      res.status(201).json(message);

      // Trigger email notification in background (non-blocking)
      try {
        const conversationId = req.body.conversationId;
        if (conversationId) {
          const [convRows] = await pool.query(
            `SELECT c.*, 
               su.id as sender_uid, su.first_name as sender_first, su.last_name as sender_last,
               ru.id as recip_uid, ru.email as recip_email, ru.first_name as recip_first, ru.last_name as recip_last,
               ru.last_active_at as recip_active
             FROM conversations c
             JOIN users su ON su.id = ?
             JOIN users ru ON ru.id = CASE WHEN c.client_id = ? THEN c.tailor_user_id ELSE c.client_id END
             WHERE c.id = ?`,
            [userId, userId, conversationId]
          ) as any[];
          if ((convRows as any[]).length > 0) {
            const row = (convRows as any[])[0];
            const senderName = `${row.sender_first || ""} ${row.sender_last || ""}`.trim() || "Un utilisateur";
            const recipEmail = row.recip_email;
            const recipName = `${row.recip_first || ""} ${row.recip_last || ""}`.trim();
            const lastActive = row.recip_active ? new Date(row.recip_active) : null;
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isAway = !lastActive || lastActive < fiveMinsAgo;
            if (recipEmail && isAway) {
              const preview = (req.body.content || "").slice(0, 100);
              sendNewMessageEmail(recipEmail, recipName, senderName, preview).catch(() => {});
            }
            // Update sender's last_active_at
            await pool.query(`UPDATE users SET last_active_at = NOW() WHERE id = ?`, [userId]).catch(() => {});
          }
        }
      } catch (emailErr) {
        console.error("[MSG EMAIL]", emailErr);
      }
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

  app.get("/api/tailor/projects", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const projects = await storage.getProjectsByTailor(tailor.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching tailor projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/tailor/requests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const all = await storage.getProjectsByTailor(tailor.id);
      const pending = all.filter((p: any) => p.status === "pending" || p.status === "new");
      res.json(pending);
    } catch (error) {
      console.error("Error fetching tailor requests:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.get("/api/tailor/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Revenus du mois : somme de amount (en euros, prix de confection) pour les projets complétés ce mois
      const [revenueRows] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM projects
         WHERE tailor_id = ? AND status = 'completed'
         AND updated_at >= ?`,
        [tailor.id, firstOfMonth]
      ) as any[];
      const monthlyRevenue = Array.isArray(revenueRows) && revenueRows[0]
        ? parseFloat(revenueRows[0].total) || 0 : 0;

      // Projets en cours (status = in_progress)
      const [activeRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND status = 'in_progress'",
        [tailor.id]
      ) as any[];
      const activeProjects = Array.isArray(activeRows) && activeRows[0]
        ? parseInt(activeRows[0].cnt) || 0 : 0;

      // Nouvelles demandes (status = pending ou new)
      const [requestRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND status IN ('pending','new')",
        [tailor.id]
      ) as any[];
      const newRequests = Array.isArray(requestRows) && requestRows[0]
        ? parseInt(requestRows[0].cnt) || 0 : 0;

      // Note moyenne : champ rating de la table tailors
      const averageRating = tailor.rating || 0;

      res.json({ monthlyRevenue, activeProjects, newRequests, averageRating });
    } catch (error) {
      console.error("Error fetching tailor stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/tailor/stats-full", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // CA du mois en cours — amount en euros (prix de confection exact)
      const [revenueRows] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM projects
         WHERE tailor_id = ? AND status = 'completed' AND updated_at >= ?`,
        [tailor.id, firstOfMonth]
      ) as any[];
      const monthlyRevenue = parseFloat(revenueRows?.[0]?.total) || 0;

      // Panier moyen — amount en euros
      const [avgRows] = await pool.query(
        `SELECT COALESCE(AVG(amount), 0) as avg_val FROM projects
         WHERE tailor_id = ? AND status = 'completed' AND amount > 0`,
        [tailor.id]
      ) as any[];
      const averageOrderValue = parseFloat(avgRows?.[0]?.avg_val) || 0;

      // Nombre total de clients distincts
      const [clientRows] = await pool.query(
        `SELECT COUNT(DISTINCT client_id) as cnt FROM projects WHERE tailor_id = ?`,
        [tailor.id]
      ) as any[];
      const totalClients = parseInt(clientRows?.[0]?.cnt) || 0;

      // Clients récurrents (plus d'un projet)
      const [recurRows] = await pool.query(
        `SELECT COUNT(*) as cnt FROM (
           SELECT client_id FROM projects WHERE tailor_id = ?
           GROUP BY client_id HAVING COUNT(*) > 1
         ) sub`,
        [tailor.id]
      ) as any[];
      const recurringClients = parseInt(recurRows?.[0]?.cnt) || 0;
      const recurringClientRate = totalClients > 0
        ? Math.round((recurringClients / totalClients) * 100) : 0;

      // CA des 6 derniers mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const [monthlyRows] = await pool.query(
        `SELECT DATE_FORMAT(updated_at, '%Y-%m') as month,
                COALESCE(SUM(amount), 0) as total
         FROM projects
         WHERE tailor_id = ? AND status = 'completed' AND updated_at >= ?
         GROUP BY month ORDER BY month ASC`,
        [tailor.id, sixMonthsAgo]
      ) as any[];

      // Construire tableau complet des 6 derniers mois (même si CA = 0)
      const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      const revenueByMonth: { month: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const found = Array.isArray(monthlyRows)
          ? monthlyRows.find((r: any) => r.month === key)
          : null;
        revenueByMonth.push({
          month: `${monthLabels[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
          total: found ? parseFloat(found.total) : 0,
        });
      }

      // Répartition par type de vêtement
      const [typeRows] = await pool.query(
        `SELECT COALESCE(clothing_type, 'Autre') as type, COUNT(*) as count
         FROM projects WHERE tailor_id = ? AND clothing_type IS NOT NULL
         GROUP BY type ORDER BY count DESC`,
        [tailor.id]
      ) as any[];
      const clothingTypes = Array.isArray(typeRows)
        ? typeRows.map((r: any) => ({ name: r.type, value: parseInt(r.count) }))
        : [];

      res.json({
        monthlyRevenue,
        averageOrderValue,
        totalClients,
        recurringClientRate,
        revenueByMonth,
        clothingTypes,
      });
    } catch (error) {
      console.error("Error fetching tailor full stats:", error);
      res.status(500).json({ error: "Failed to fetch full stats" });
    }
  });

  app.get("/api/tailor/projects/count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [rows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND status IN ('in_progress','completed')",
        [tailor.id]
      ) as any[];
      const cnt = Array.isArray(rows) && rows[0] ? parseInt(rows[0].cnt) || 0 : 0;
      res.json({ count: cnt });
    } catch (error) {
      console.error("Error fetching tailor project count:", error);
      res.status(500).json({ error: "Failed to fetch project count" });
    }
  });

  app.post("/api/projects/:id/client-confirm", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { deadlineRespected } = req.body;
      await pool.query(
        "UPDATE projects SET client_confirmed = 1 WHERE id = ?",
        [id]
      );
      console.log(`[Project] ${id} → clientConfirmed=true, deadlineRespected=${deadlineRespected}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming project:", error);
      res.status(500).json({ error: "Failed to confirm project" });
    }
  });

  // ── CRM : Notes et statut client par artisan ──────────────────────────────
  app.get("/api/tailor/client/:clientId/notes", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const { clientId } = req.params;
      const [rows] = await pool.query(
        "SELECT note, client_status as clientStatus FROM tailor_client_data WHERE tailor_id = ? AND client_id = ?",
        [tailor.id, clientId]
      ) as any[];
      const row = Array.isArray(rows) && rows[0] ? rows[0] : { note: "", clientStatus: "nouveau" };
      res.json(row);
    } catch (error) {
      console.error("Error fetching client notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/tailor/client/:clientId/notes", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const { clientId } = req.params;
      const { note, clientStatus } = req.body;
      const { v4: uuidv4 } = await import("uuid");
      await pool.query(
        `INSERT INTO tailor_client_data (id, tailor_id, client_id, note, client_status)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE note = VALUES(note), client_status = VALUES(client_status), updated_at = NOW()`,
        [uuidv4(), tailor.id, clientId, note ?? "", clientStatus ?? "nouveau"]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving client notes:", error);
      res.status(500).json({ error: "Failed to save notes" });
    }
  });

  app.get("/api/admin/all-requests", requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.id, p.title, p.status, p.created_at as createdAt, p.amount,
               u_c.first_name as clientFirstName, u_c.last_name as clientLastName,
               u_t.first_name as tailorFirstName, u_t.last_name as tailorLastName
        FROM projects p
        LEFT JOIN users u_c ON u_c.id COLLATE utf8mb4_unicode_ci = p.client_id COLLATE utf8mb4_unicode_ci
        LEFT JOIN tailors t ON t.id COLLATE utf8mb4_unicode_ci = p.tailor_id COLLATE utf8mb4_unicode_ci
        LEFT JOIN users u_t ON u_t.id COLLATE utf8mb4_unicode_ci = t.user_id COLLATE utf8mb4_unicode_ci
        WHERE p.status IN ('pending','quoted')
        ORDER BY p.created_at DESC
        LIMIT 200
      `) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.patch("/api/projects/:id/status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const project = await storage.getProject(req.params.id);
      if (!project || project.tailorId !== tailor.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "status is required" });
      const updated = await storage.updateProject(req.params.id, { status });
      res.json(updated);
    } catch (error) {
      console.error("Error updating project status:", error);
      res.status(500).json({ error: "Failed to update status" });
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

      // Send delivery email when artisan marks livraison step
      if (currentStep === "livraison" || status === "completed") {
        try {
          const [clientRows] = await pool.query(
            `SELECT u.email, u.first_name, u.last_name FROM users u WHERE u.id = ?`,
            [project.clientId]
          ) as any[];
          const [tailorRows] = await pool.query(
            `SELECT u.first_name, u.last_name FROM users u WHERE u.id = ?`,
            [tailor.userId]
          ) as any[];
          if ((clientRows as any[]).length > 0) {
            const cl = (clientRows as any[])[0];
            const ta = (tailorRows as any[])[0];
            const clientName = `${cl.first_name || ""} ${cl.last_name || ""}`.trim();
            const tailorName = `${ta?.first_name || ""} ${ta?.last_name || ""}`.trim();
            sendDeliveryEmail(cl.email, clientName, tailorName, project.title || "votre commande").catch(() => {});
            setTimeout(() => {
              sendReviewRequestEmail(cl.email, clientName, tailorName, project.id).catch(() => {});
            }, 24 * 60 * 60 * 1000);
          }
        } catch (emailErr) {
          console.error("[DELIVERY EMAIL]", emailErr);
        }
      }
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
      // Deadline & urgency logic
      let { clientDeadline, amount, requestedPrice } = req.body;
      let isUrgent = false;
      let artisanDeadline: string | null = null;
      if (clientDeadline) {
        const deadlineDate = new Date(clientDeadline);
        const today = new Date();
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline <= 7) {
          isUrgent = true;
          if (requestedPrice) requestedPrice = Math.round(parseFloat(requestedPrice) * 1.2 * 100) / 100;
          if (amount) amount = Math.round(parseFloat(amount) * 1.2 * 100) / 100;
        }
        const artisanDate = new Date(deadlineDate);
        artisanDate.setDate(artisanDate.getDate() - 3);
        artisanDeadline = artisanDate.toISOString().slice(0, 10);
      }
      const project = await storage.createProject({
        ...req.body,
        clientId: userId,
        status: "pending",
        progress: 0,
        currentStep: "prise_mesures",
        clientDeadline: clientDeadline || null,
        artisanDeadline,
        isUrgent,
        ...(requestedPrice !== undefined ? { requestedPrice } : {}),
        ...(amount !== undefined ? { amount } : {}),
      });
      res.status(201).json(project);
    } catch (error) {
      console.error("Failed to create project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const prevProject = await storage.getProject(req.params.id);
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      // Auto-message quand le pro propose un prix (status → "quoted")
      if (req.body.status === "quoted" && prevProject?.status !== "quoted") {
        try {
          const tailor = await storage.getTailor(project.tailorId);
          if (tailor?.userId && project.clientId) {
            const conv = await storage.getOrCreateConversation(tailor.userId, project.clientId);
            const garmentLabel = (project as any).clothingType || project.title || "votre projet";
            const price = project.amount ? `${project.amount}€` : "un montant";
            await storage.createMessage({
              conversationId: conv.id,
              senderId: tailor.userId,
              content: `📋 J'ai établi un devis de ${price} pour ${garmentLabel}. Vous pouvez le valider ou le refuser depuis la rubrique "Mes projets". N'hésitez pas si vous avez des questions !`,
            });
          }
        } catch (msgErr) {
          console.error("Auto-message error on quote:", msgErr);
        }
      }

      // Auto-message quand la confection commence (status → "in_progress")
      if (req.body.status === "in_progress" && prevProject?.status !== "in_progress") {
        try {
          const tailor = await storage.getTailor(project.tailorId);
          if (tailor?.userId && project.clientId) {
            const conv = await storage.getOrCreateConversation(tailor.userId, project.clientId);
            const garmentLabel = (project as any).clothingType || project.title || "votre commande";
            await storage.createMessage({
              conversationId: conv.id,
              senderId: tailor.userId,
              content: `🎉 Votre devis a été validé et la confection de ${garmentLabel} démarre ! Prenez dès maintenant votre premier rendez-vous avec moi 👇\n[RDV:/prendre-rdv?tailor=${tailor.userId}]`,
            });
          }
        } catch (msgErr) {
          console.error("Auto-message error on project start:", msgErr);
        }
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

  // ── CRM : fiche client unifiée ───────────────────────────────────────────
  app.get("/api/tailor/clients/:clientId/summary", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const { clientId } = req.params;

      // Infos client
      const clientUser = await storage.getUser(clientId);
      if (!clientUser) return res.status(404).json({ error: "Client not found" });

      // Projets en commun (tailor + client)
      const allProjects = await storage.getProjectsByTailor(tailor.id);
      const clientProjects = allProjects.filter((p: any) => p.clientId === clientId);

      // RDV en commun
      const allAppointments = await storage.getAppointmentsByTailor(tailor.id);
      const clientAppointments = allAppointments.filter((a: any) => a.clientId === clientId);

      // Mesures du client
      const measurements = await storage.getMeasurements(clientId);

      res.json({
        client: {
          id: clientUser.id,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          email: clientUser.email,
          phone: clientUser.phone,
          location: clientUser.location,
          profileImageUrl: clientUser.profileImageUrl,
          createdAt: clientUser.createdAt,
        },
        projects: clientProjects,
        appointments: clientAppointments,
        measurements: measurements || null,
      });
    } catch (error) {
      console.error("Error fetching client summary:", error);
      res.status(500).json({ error: "Failed to fetch client summary" });
    }
  });

  app.get("/api/tailor/appointments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const appointments = await storage.getAppointmentsByTailor(tailor.id);
      res.json(appointments);
    } catch (error) {
      console.error("Failed to fetch tailor appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/client/appointments", requireAuth, async (req: any, res) => {
    try {
      const clientId = req.authUserId;
      const result = await storage.getAppointmentsByClient(clientId);
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch client appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);

      let tailorId: string;
      let clientId: string;

      if (tailor) {
        tailorId = tailor.id;
        const cid = req.body.clientId;
        if (!cid) return res.status(400).json({ error: "clientId requis pour un pro" });
        clientId = cid;
      } else {
        tailorId = req.body.tailorId;
        if (!tailorId) return res.status(400).json({ error: "tailorId requis" });
        clientId = userId;
      }

      const { scheduledAt, type, duration, notes, location, status, projectId } = req.body;
      const newId = require("crypto").randomUUID();
      await pool.query(
        `INSERT INTO appointments (id, tailor_id, client_id, project_id, type, location, scheduled_at, duration, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          tailorId,
          clientId,
          projectId || null,
          type || "consultation",
          location || null,
          new Date(scheduledAt),
          duration || 60,
          notes || null,
          status || "scheduled",
        ]
      );
      const [rows] = await pool.query(`SELECT * FROM appointments WHERE id = ?`, [newId]) as any[];
      const created = (rows as any[])[0] || { id: newId };
      res.status(201).json(created);

      // Send confirmation emails in background
      try {
        const [clientRows] = await pool.query(
          `SELECT email, first_name, last_name FROM users WHERE id = ?`, [clientId]
        ) as any[];
        const [tailorRows] = await pool.query(
          `SELECT u.email, u.first_name, u.last_name FROM users u JOIN tailors t ON t.user_id = u.id WHERE t.id = ?`, [tailorId]
        ) as any[];
        const cl = (clientRows as any[])[0];
        const ta = (tailorRows as any[])[0];
        if (cl && ta) {
          const clientName = `${cl.first_name || ""} ${cl.last_name || ""}`.trim();
          const tailorName = `${ta.first_name || ""} ${ta.last_name || ""}`.trim();
          sendAppointmentConfirmationEmail(cl.email, clientName, scheduledAt, type || "consultation", tailorName).catch(() => {});
          sendAppointmentConfirmationEmail(ta.email, tailorName, scheduledAt, type || "consultation", clientName).catch(() => {});
        }
      } catch (emailErr) {
        console.error("[APPT EMAIL]", emailErr);
      }
    } catch (error: any) {
      console.error("Failed to create appointment:", error);
      res.status(500).json({ error: error?.message || "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      const callerId = req.authUserId;
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const tailor = await storage.getTailor(appointment.tailorId);
      const dt = new Date(appointment.scheduledAt);
      const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      if (req.body.status === "confirmed") {
        try {
          if (tailor?.userId && appointment.clientId) {
            const conv = await storage.getOrCreateConversation(tailor.userId, appointment.clientId);
            const isClientConfirming = callerId === appointment.clientId;
            if (isClientConfirming) {
              // Client confirme → notifier l'artisan (message envoyé par le client)
              await storage.createMessage({
                conversationId: conv.id,
                senderId: appointment.clientId,
                content: `✅ J'ai confirmé notre rendez-vous du ${dateStr} à ${timeStr}. À bientôt !`,
              });
            } else {
              // Artisan confirme → notifier le client (message envoyé par l'artisan)
              await storage.createMessage({
                conversationId: conv.id,
                senderId: tailor.userId,
                content: `✅ Votre rendez-vous du ${dateStr} à ${timeStr} a été confirmé. À bientôt !`,
              });
            }
          }
        } catch (msgErr) {
          console.error("Auto-message error on appointment confirm:", msgErr);
        }
      }

      if (req.body.status === "cancelled") {
        try {
          if (tailor?.userId && appointment.clientId) {
            const conv = await storage.getOrCreateConversation(tailor.userId, appointment.clientId);
            const isClientCancelling = callerId === appointment.clientId;
            await storage.createMessage({
              conversationId: conv.id,
              senderId: isClientCancelling ? appointment.clientId : tailor.userId,
              content: `❌ Le rendez-vous du ${dateStr} à ${timeStr} a été annulé.`,
            });
          }
        } catch (msgErr) {
          console.error("Auto-message error on appointment cancel:", msgErr);
        }
      }

      res.json(appointment);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // RDV client avec infos artisan
  app.get("/api/client/appointments-with-tailor", requireAuth, async (req: any, res) => {
    try {
      const clientId = req.authUserId;
      const [rows] = await pool.query(
        `SELECT a.*, u.first_name as tailor_first_name, u.last_name as tailor_last_name,
                u.profile_image_url as tailor_image, u.id as tailor_user_id,
                t.id as tailor_profile_id
         FROM appointments a
         JOIN tailors t ON a.tailor_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE a.client_id = ?
         ORDER BY a.scheduled_at ASC`,
        [clientId]
      ) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to fetch client appointments with tailor:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
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
  app.get("/api/tailor/portfolio", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const items = await storage.getPortfolioItemsByTailor(tailor.id);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch tailor portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

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

  app.delete("/api/portfolio/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deletePortfolioItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete portfolio item:", error);
      res.status(500).json({ error: "Failed to delete portfolio item" });
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
  async function recalculateTailorRating(tailorId: string) {
    const [rows] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE tailor_id = ? AND is_approved = 1`,
      [tailorId]
    ) as any[];
    const avg = parseFloat((rows as any[])[0]?.avg_rating) || 0;
    const cnt = parseInt((rows as any[])[0]?.cnt) || 0;
    await pool.query(
      `UPDATE tailors SET rating = ?, review_count = ? WHERE id = ?`,
      [Math.round(avg * 10) / 10, cnt, tailorId]
    );
  }

  app.post("/api/reviews", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { tailorId, projectId, rating, comment } = req.body;
      const newId = require("crypto").randomUUID();
      await pool.query(
        `INSERT INTO reviews (id, tailor_id, user_id, project_id, rating, comment, is_approved)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [newId, tailorId, userId, projectId || null, rating, comment]
      );
      try { await recalculateTailorRating(tailorId); } catch (e) { console.error("Rating recalc error:", e); }
      const [rows] = await pool.query(`SELECT * FROM reviews WHERE id = ?`, [newId]) as any[];
      res.status(201).json((rows as any[])[0] || { id: newId });
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Check if current user already reviewed a specific project
  app.get("/api/reviews/my/:projectId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [rows] = await pool.query(
        `SELECT id FROM reviews WHERE user_id = ? AND project_id = ? LIMIT 1`,
        [userId, req.params.projectId]
      ) as any[];
      res.json({ exists: (rows as any[]).length > 0 });
    } catch (error) {
      res.status(500).json({ exists: false });
    }
  });

  // Admin: list pending reviews awaiting approval
  app.get("/api/admin/pending-reviews", requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.*, u.first_name, u.last_name, u.email,
           CONCAT(tu.first_name, ' ', tu.last_name) as tailor_name
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN tailors t ON t.id = r.tailor_id
         JOIN users tu ON tu.id = t.user_id
         WHERE r.is_approved = 0
         ORDER BY r.created_at DESC`
      ) as any[];
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending reviews" });
    }
  });

  // Admin: approve or reject a review
  app.patch("/api/admin/reviews/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { approved } = req.body; // true or false
      await pool.query(
        `UPDATE reviews SET is_approved = ? WHERE id = ?`,
        [approved ? 1 : -1, req.params.id]
      );
      const [revRows] = await pool.query(`SELECT tailor_id FROM reviews WHERE id = ?`, [req.params.id]) as any[];
      const tailorId = (revRows as any[])[0]?.tailor_id;
      if (tailorId) {
        try { await recalculateTailorRating(tailorId); } catch (e) { console.error("Rating recalc error:", e); }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // Professionnel onboarding status
  app.get("/api/professionnel/onboarding", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const [portfolioRows] = await pool.query(
        `SELECT COUNT(*) as cnt FROM portfolio_items WHERE tailor_id = ?`, [tailor.id]
      ) as any[];
      const portfolioCount = parseInt((portfolioRows as any[])[0]?.cnt) || 0;

      const [apptRows] = await pool.query(
        `SELECT COUNT(*) as cnt FROM appointments WHERE tailor_id = ?`, [tailor.id]
      ) as any[];
      const hasAppointment = parseInt((apptRows as any[])[0]?.cnt) > 0;

      const [userRows] = await pool.query(
        `SELECT onboarding_step FROM user_preferences WHERE user_id = ?`, [userId]
      ) as any[];
      const onboardingStep = parseInt((userRows as any[])[0]?.onboarding_step) || 0;

      const steps = {
        profile: !!(tailor.bio && (tailor.specialties?.length ?? 0) > 0),
        portfolio: portfolioCount > 0,
        availability: hasAppointment || onboardingStep >= 3,
        complete: onboardingStep >= 4,
      };
      const completedCount = Object.values(steps).filter(Boolean).length;
      res.json({ steps, completedCount, onboardingStep, portfolioCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch onboarding status" });
    }
  });

  app.post("/api/professionnel/onboarding/complete", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { step } = req.body;
      await pool.query(
        `INSERT INTO user_preferences (id, user_id, onboarding_step) VALUES (UUID(), ?, ?)
         ON DUPLICATE KEY UPDATE onboarding_step = GREATEST(onboarding_step, ?)`,
        [userId, step, step]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update onboarding" });
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

  app.get("/api/admin/global-stats", requireAdmin, async (req, res) => {
    try {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [revenueRows] = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM projects WHERE status = 'completed'"
      ) as any[];
      const totalRevenue = parseFloat(revenueRows?.[0]?.total) || 0;

      const [monthRevenueRows] = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM projects WHERE status = 'completed' AND created_at >= ?",
        [firstOfMonth]
      ) as any[];
      const monthRevenue = parseFloat(monthRevenueRows?.[0]?.total) || 0;

      const [avgRows] = await pool.query(
        "SELECT COALESCE(AVG(amount), 0) as avg_val FROM projects WHERE status = 'completed' AND amount > 0"
      ) as any[];
      const avgProjectValue = parseFloat(avgRows?.[0]?.avg_val) || 0;

      const [completedRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM projects WHERE status = 'completed'"
      ) as any[];
      const totalProjectsCompleted = parseInt(completedRows?.[0]?.cnt) || 0;

      const [artisanRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM tailors WHERE is_verified = 1"
      ) as any[];
      const activeArtisansCount = parseInt(artisanRows?.[0]?.cnt) || 0;

      const [clientRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM users WHERE role = 'client'"
      ) as any[];
      const activeClientsCount = parseInt(clientRows?.[0]?.cnt) || 0;

      const [starterRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM tailors WHERE subscription_plan = 'Starter' OR subscription_plan IS NULL"
      ) as any[];
      const starterCount = parseInt(starterRows?.[0]?.cnt) || 0;

      const [proRows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM tailors WHERE subscription_plan = 'Pro'"
      ) as any[];
      const proCount = parseInt(proRows?.[0]?.cnt) || 0;

      res.json({
        totalRevenue,
        monthRevenue,
        avgProjectValue,
        totalProjectsCompleted,
        activeArtisansCount,
        activeClientsCount,
        starterCount,
        proCount,
        // legacy aliases
        avgOrderValue: avgProjectValue,
        activeArtisans: activeArtisansCount,
        totalClients: activeClientsCount,
      });
    } catch (error) {
      console.error("Error fetching global stats:", error);
      res.status(500).json({ error: "Failed to fetch global stats" });
    }
  });

  // Admin: all group orders (events)
  app.get("/api/admin/events", requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT e.*,
          ou.first_name as organizer_first_name, ou.last_name as organizer_last_name, ou.email as organizer_email,
          tu.first_name as tailor_first_name, tu.last_name as tailor_last_name,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
        FROM events e
        JOIN users ou ON ou.id = e.organizer_id
        JOIN tailors t ON t.id = e.tailor_id
        JOIN users tu ON tu.id = t.user_id
        ORDER BY e.created_at DESC
      `) as any[];
      res.json(rows);
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
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
      const manualArtisans = await storage.getAdminArtisans();
      const registeredTailors = await storage.getRegisteredTailors();

      // Priorité aux artisans enregistrés (reg-) — ils ont un vrai compte tailor
      const registeredEmails = new Set(registeredTailors.map((t: any) => t.email?.toLowerCase()).filter(Boolean));

      // Artisans manuels dont l'email n'est PAS dans les enregistrés (pas de doublon)
      const filteredManual = manualArtisans.filter(a => !registeredEmails.has(a.email?.toLowerCase()));

      const mergedFromTailors = registeredTailors
        .map((t: any) => ({
          id: `reg-${t.tailorId}`,
          firstName: t.firstName || "",
          lastName: t.lastName || "",
          specialty: (t.specialties && t.specialties.length > 0) ? t.specialties[0] : "Non spécifié",
          status: t.isVerified ? "Vérifié" : "En attente",
          city: t.location || "",
          email: t.email || "",
          phone: t.phone || "",
          birthDate: null,
          nationality: null,
          idType: null,
          idNumber: null,
          address: null,
          siret: null,
          companyName: null,
          legalForm: null,
          tvaNumber: null,
          iban: null,
          yearsExperience: t.experience || null,
          bio: t.bio || null,
          joinDate: null,
          subscriptionPlan: t.subscriptionPlan || "Starter",
          paymentStatus: "En attente",
          createdAt: t.createdAt || new Date(),
        }));

      res.json([...filteredManual, ...mergedFromTailors]);
    } catch (error) {
      console.error("Error fetching admin artisans:", error);
      res.status(500).json({ error: "Failed to fetch artisans" });
    }
  });

  app.post("/api/admin/artisans", requireAdmin, async (req, res) => {
    try {
      const b = req.body;
      console.log("[admin] POST artisan body keys:", Object.keys(b));

      const artisanData = {
        firstName: b.firstName || "",
        lastName: b.lastName || "",
        email: b.email || null,
        phone: b.phone || null,
        specialty: b.specialty || "Couture",
        city: b.city || "Non renseignée",
        status: b.status || "En attente",
        bio: b.bio || null,
        yearsExperience: parseInt(b.yearsExperience) || 0,
        siret: b.siret || null,
        companyName: b.companyName || null,
        subscriptionPlan: b.subscriptionPlan || "Starter",
        legalForm: b.legalForm || null,
        tvaNumber: b.tvaNumber || null,
        iban: b.iban || null,
        birthDate: b.birthDate || null,
        nationality: b.nationality || null,
        idType: b.idType || null,
        idNumber: b.idNumber || null,
        address: b.address || null,
        paymentStatus: b.paymentStatus || "En attente",
        joinDate: new Date().toLocaleDateString("fr-FR"),
      };

      const artisan = await storage.createAdminArtisan(artisanData);

      if (b.email) {
        try {
          const existingUser = await storage.getUserByEmail(b.email);
          if (!existingUser) {
            const bcrypt = await import("bcrypt");
            const tempPassword = await bcrypt.hash("Seamlier2026!", 12);
            const newUser = await storage.createUser({
              email: b.email,
              password: tempPassword,
              firstName: b.firstName || null,
              lastName: b.lastName || null,
              role: "tailor",
              profileImageUrl: null,
              phone: b.phone || null,
              location: b.city || null,
              emailVerified: true,
            });

            await storage.createTailor({
              userId: newUser.id,
              bio: b.bio || null,
              specialties: b.specialty ? [b.specialty] : [],
              experience: parseInt(b.yearsExperience) || 0,
              coverImageUrl: null,
              isVerified: false,
              rating: 0,
              reviewCount: 0,
              portfolioCount: 0,
              subscriptionPlan: b.subscriptionPlan || "Starter",
            });
            console.log(`[admin] Created user+tailor for artisan: ${b.email}`);
          } else {
            const existingTailor = await storage.getTailorByUserId(existingUser.id);
            if (!existingTailor) {
              await storage.createTailor({
                userId: existingUser.id,
                bio: b.bio || null,
                specialties: b.specialty ? [b.specialty] : [],
                experience: parseInt(b.yearsExperience) || 0,
                coverImageUrl: null,
                isVerified: false,
                rating: 0,
                reviewCount: 0,
                portfolioCount: 0,
                subscriptionPlan: b.subscriptionPlan || "Starter",
              });
              console.log(`[admin] Created tailor for existing user: ${b.email}`);
            }
          }
        } catch (syncError: any) {
          console.error("[admin] Error syncing artisan:", syncError?.sqlMessage || syncError?.message);
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

  // Envoie un message automatique à l'artisan validé depuis le compte admin
  async function sendApprovalMessage(artisanUserId: string) {
    try {
      const admin = await storage.getAdminUser();
      if (!admin || admin.id === artisanUserId) return;
      const conversation = await storage.getOrCreateConversation(admin.id, artisanUserId);
      const messageText =
        "Félicitations ! 🎉 Votre profil artisan a été validé par notre équipe. " +
        "Vous êtes désormais visible sur la plateforme SEAMLIER et disponible pour recevoir des demandes de confection. " +
        "Bienvenue dans la communauté !\n\n" +
        "Congratulations! Your artisan profile has been approved by our team. " +
        "You are now visible on the SEAMLIER platform and ready to receive tailoring requests. " +
        "Welcome to the community!";
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: admin.id,
        content: messageText,
        isRead: false,
      });
      console.log(`[admin] Approval message sent to user ${artisanUserId}`);
    } catch (err) {
      console.warn("[admin] Could not send approval message:", err);
    }
  }

  app.put("/api/admin/artisans/:id", requireAdmin, async (req, res) => {
    try {
      const rawId = req.params.id;

      if (rawId.startsWith("reg-")) {
        const tailorId = rawId.replace(/^reg-/, "");
        const { status, subscriptionPlan, ...rest } = req.body;

        if (status === "Vérifié") {
          await db.update(tailors).set({ isVerified: true }).where(eq(tailors.id, tailorId));
          // Récupérer le userId pour envoyer le message automatique
          const tailorRow = await db.select({ userId: tailors.userId }).from(tailors).where(eq(tailors.id, tailorId));
          if (tailorRow[0]) await sendApprovalMessage(tailorRow[0].userId);
        } else if (status === "Rejeté") {
          await db.update(tailors).set({ isVerified: false }).where(eq(tailors.id, tailorId));
        }
        if (subscriptionPlan) {
          await db.update(tailors).set({ subscriptionPlan }).where(eq(tailors.id, tailorId));
        }

        const updated = await db.select({
          tailorId: tailors.id, userId: tailors.userId, isVerified: tailors.isVerified,
          specialties: tailors.specialties, experience: tailors.experience,
          subscriptionPlan: tailors.subscriptionPlan, bio: tailors.bio,
          firstName: users.firstName, lastName: users.lastName, email: users.email,
          phone: users.phone, location: users.location, createdAt: users.createdAt,
        }).from(tailors).innerJoin(users, eq(tailors.userId, users.id)).where(eq(tailors.id, tailorId));

        if (!updated[0]) return res.status(404).json({ error: "Tailor not found" });
        const t = updated[0];
        return res.json({
          id: rawId,
          firstName: t.firstName || "",
          lastName: t.lastName || "",
          specialty: (t.specialties && t.specialties.length > 0) ? t.specialties[0] : "Non spécifié",
          status: t.isVerified ? "Vérifié" : status === "Rejeté" ? "Rejeté" : "En attente",
          city: t.location || "",
          email: t.email || "",
          phone: t.phone || "",
          bio: t.bio || null,
          subscriptionPlan: t.subscriptionPlan || "Starter",
          paymentStatus: "En attente",
          createdAt: t.createdAt || new Date(),
        });
      }

      const artisan = await storage.updateAdminArtisan(rawId, req.body);
      if (!artisan) {
        return res.status(404).json({ error: "Artisan not found" });
      }

      // Propager isVerified sur la table tailors — créer la ligne si elle n'existe pas encore
      const { status } = req.body;
      if ((status === "Vérifié" || status === "Rejeté") && artisan.email) {
        try {
          const matchUser = await storage.getUserByEmail(artisan.email);
          if (matchUser) {
            // S'assurer que le rôle est bien "tailor"
            await storage.updateUser(matchUser.id, { role: "tailor" });
            const matchTailor = await storage.getTailorByUserId(matchUser.id);
            if (matchTailor) {
              // La ligne existe → mise à jour isVerified
              await db.update(tailors)
                .set({ isVerified: status === "Vérifié" })
                .where(eq(tailors.id, matchTailor.id));
              console.log(`[admin] Updated isVerified=${status === "Vérifié"} for tailor ${matchTailor.id} (${artisan.email})`);
            } else {
              // Pas encore de ligne tailors → création automatique avec isVerified correct
              const newTailor = await storage.createTailor({
                userId: matchUser.id,
                bio: artisan.bio || null,
                specialties: artisan.specialty ? [artisan.specialty] : [],
                experience: artisan.yearsExperience || 0,
                coverImageUrl: null,
                isVerified: status === "Vérifié",
                rating: 0,
                reviewCount: 0,
                portfolioCount: 0,
                subscriptionPlan: artisan.subscriptionPlan || "Starter",
              });
              console.log(`[admin] Created tailor row id=${newTailor.id} isVerified=${status === "Vérifié"} for ${artisan.email}`);
            }
            // Message automatique de bienvenue si validation positive
            if (status === "Vérifié") {
              await sendApprovalMessage(matchUser.id);
            }
          }
        } catch (propagateErr) {
          console.warn("[admin] Could not propagate isVerified to tailors:", propagateErr);
        }
      }

      res.json(artisan);
    } catch (error) {
      console.error("Error updating admin artisan:", error);
      res.status(500).json({ error: "Failed to update artisan" });
    }
  });

  app.post("/api/admin/artisans/:id/downgrade", requireAdmin, async (req, res) => {
    try {
      const raw = req.params.id;
      const tailorId = raw.startsWith("reg-") ? raw.slice(4) : raw;

      const [tailorRows] = await pool.query("SELECT stripe_subscription_id FROM tailors WHERE id = ? LIMIT 1", [tailorId]) as any[];
      const tailorRecord = Array.isArray(tailorRows) ? tailorRows[0] : null;

      if (tailorRecord?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
        const StripeLib = (await import("stripe")).default;
        const stripeClient = new StripeLib(process.env.STRIPE_SECRET_KEY);
        try {
          await stripeClient.subscriptions.cancel(tailorRecord.stripe_subscription_id);
          console.log(`[Admin] Abonnement ${tailorRecord.stripe_subscription_id} annulé immédiatement`);
        } catch (stripeErr: any) {
          console.error("[Admin] Erreur annulation Stripe (non bloquant):", stripeErr.message);
        }
      }

      await pool.query(
        "UPDATE tailors SET subscription_plan = 'Starter', stripe_subscription_id = NULL, subscription_current_period_end = NULL WHERE id = ?",
        [tailorId]
      );

      res.json({ success: true, message: "Artisan rétrogradé en Starter" });
    } catch (error: any) {
      console.error("Error downgrading artisan:", error);
      res.status(500).json({ error: "Erreur lors de la rétrogradation", detail: error?.message });
    }
  });

  app.delete("/api/admin/artisans/:id", requireAdmin, async (req, res) => {
    try {
      const rawId = req.params.id;
      if (rawId.startsWith("reg-")) {
        const tailorId = rawId.replace(/^reg-/, "");
        const tailor = await db.select({ userId: tailors.userId })
          .from(tailors)
          .where(eq(tailors.id, tailorId));
        if (tailor[0]?.userId) {
          await storage.deleteUser(tailor[0].userId);
        }
      } else {
        await storage.deleteAdminArtisan(rawId);
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting admin artisan:", error);
      res.status(500).json({ error: "Failed to delete artisan", detail: error?.sqlMessage || error?.message });
    }
  });

  app.delete("/api/admin/conversations", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAllConversations();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversations:", error);
      res.status(500).json({ error: "Failed to delete conversations" });
    }
  });

  // Admin debug - raw messages inspection
  app.get("/api/admin/debug/messages/:conversationId", requireAdmin, async (req, res) => {
    try {
      const [convRows] = await pool.query(
        `SELECT * FROM conversations WHERE id = ? LIMIT 1`,
        [req.params.conversationId]
      ) as any[];
      const [msgRows] = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC`,
        [req.params.conversationId]
      ) as any[];
      const [allConvRows] = await pool.query(
        `SELECT id, participant1_id, participant2_id, last_message_preview, last_message_at FROM conversations ORDER BY last_message_at DESC LIMIT 10`
      ) as any[];
      res.json({ conversation: convRows[0] ?? null, messages: msgRows, recentConversations: allConvRows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      storage.incrementArticleViews(req.params.id).catch(() => {});
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Tailor reads a specific client's measurements (for project view)
  app.get("/api/tailor/clients", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(404).json({ error: "Not a tailor" });
      const projects = await storage.getProjectsByTailor(tailor.id);
      const seen = new Set<string>();
      const clients = projects
        .filter(p => p.client && !seen.has(p.clientId) && seen.add(p.clientId))
        .map(p => ({ id: p.clientId, firstName: p.client?.firstName, lastName: p.client?.lastName, email: p.client?.email }));
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/tailor/client/:clientId/measurements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const meas = await storage.getMeasurementsByUserId(req.params.clientId);
      res.json(meas || null);
    } catch (error) {
      console.error("Failed to fetch client measurements:", error);
      res.status(500).json({ error: "Failed to fetch measurements" });
    }
  });

  // Admin: all projects
  app.get("/api/admin/all-projects", requireAdmin, async (req, res) => {
    try {
      const data = await storage.getAllProjectsForAdmin();
      res.json(data);
    } catch (error) {
      console.error("admin all-projects error:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Admin: all appointments
  app.get("/api/admin/all-appointments", requireAdmin, async (req, res) => {
    try {
      const data = await storage.getAllAppointmentsForAdmin();
      res.json(data);
    } catch (error) {
      console.error("admin all-appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Admin - Measurements
  app.get("/api/admin/measures", requireAdmin, async (req, res) => {
    try {
      const data = await storage.getAllMeasurementsForAdmin();
      res.json(data);
    } catch (error) {
      console.error("Error fetching admin measures:", error);
      res.status(500).json({ error: "Failed to fetch measures" });
    }
  });

  // Admin - Reviews
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const data = await storage.getAllReviewsForAdmin();
      res.json(data);
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteReview(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
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

  // ── Fabric deposit date (artisan sets) ───────────────────────────────────
  app.patch("/api/projects/:id/fabric-deposit", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const { fabricDepositDate } = req.body;
      await pool.query(
        `UPDATE projects SET fabric_deposit_date = ? WHERE id = ? AND tailor_id = ?`,
        [fabricDepositDate || null, req.params.id, tailor.id]
      );
      // Auto-message to client
      const [rows] = await pool.query(`SELECT * FROM projects WHERE id = ?`, [req.params.id]) as any[];
      const project = (rows as any[])[0];
      if (project && fabricDepositDate) {
        const conv = await storage.getOrCreateConversation(userId, project.client_id);
        const dateFormatted = new Date(fabricDepositDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        await storage.createMessage({
          conversationId: conv.id,
          senderId: userId,
          content: `🧵 Merci de déposer votre tissu avant le ${dateFormatted}. Cela permettra de démarrer la confection dans les meilleures conditions !`,
        });
      }
      res.json({ success: true, fabricDepositDate });
    } catch (error) {
      console.error("Failed to set fabric deposit date:", error);
      res.status(500).json({ error: "Failed to set fabric deposit date" });
    }
  });

  // ── Events (Commandes groupées) ───────────────────────────────────────────

  function generateInviteCode(): string {
    return require("crypto").randomBytes(4).toString("hex").toUpperCase();
  }

  // Create an event (organizer)
  app.post("/api/events", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { name, eventDate, tailorId, description, registrationDeadline, maxParticipants, pricePerPerson, priceGroup, deliveryDate } = req.body;
      if (!name || !eventDate || !tailorId) {
        return res.status(400).json({ error: "name, eventDate et tailorId sont requis" });
      }
      let inviteCode = generateInviteCode();
      const [existing] = await pool.query(`SELECT id FROM events WHERE invite_code = ?`, [inviteCode]) as any[];
      if ((existing as any[]).length > 0) inviteCode = generateInviteCode() + "X";
      const eventId = require("crypto").randomUUID();
      await pool.query(
        `INSERT INTO events (id, name, event_date, tailor_id, organizer_id, invite_code, description, registration_deadline, status, max_participants, price_per_person, price_group, delivery_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_tailor_approval', ?, ?, ?, ?)`,
        [eventId, name, eventDate, tailorId, userId, inviteCode, description || null, registrationDeadline || null,
         maxParticipants || null, pricePerPerson || null, priceGroup || null, deliveryDate || null]
      );
      // Notify the tailor via in-app message
      try {
        const [orgRows] = await pool.query(`SELECT first_name, last_name FROM users WHERE id = ?`, [userId]) as any[];
        const org = (orgRows as any[])[0];
        const orgName = `${org?.first_name || ""} ${org?.last_name || ""}`.trim() || "Un client";
        const [tailorRows] = await pool.query(`SELECT user_id FROM tailors WHERE id = ?`, [tailorId]) as any[];
        const tailorUserId = (tailorRows as any[])[0]?.user_id;
        if (tailorUserId) {
          const conv = await storage.getOrCreateConversation(userId, tailorUserId);
          const details = [
            `📦 **Nouvelle demande de commande groupée**`,
            `Nom : ${name}`,
            `Date de l'événement : ${new Date(eventDate).toLocaleDateString("fr-FR")}`,
            maxParticipants ? `Nombre de personnes : ${maxParticipants}` : null,
            pricePerPerson ? `Prix par personne : ${pricePerPerson} €` : null,
            priceGroup ? `Prix du groupe : ${priceGroup} €` : null,
            deliveryDate ? `Date de livraison souhaitée : ${new Date(deliveryDate).toLocaleDateString("fr-FR")}` : null,
            description ? `Description : ${description}` : null,
            `[RDV:/evenement/${eventId}]`,
          ].filter(Boolean).join("\n");
          await storage.createMessage({ conversationId: conv.id, senderId: userId, content: details });
        }
      } catch (e) { console.error("Event notification error:", e); }
      const [rows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [eventId]) as any[];
      res.status(201).json((rows as any[])[0]);
    } catch (error) {
      console.error("Failed to create event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Get event by invite code (public)
  app.get("/api/events/join/:inviteCode", async (req: any, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT e.*, 
          t.id as tailor_id,
          tu.first_name as tailor_first_name, tu.last_name as tailor_last_name,
          tu.profile_image_url as tailor_avatar,
          ou.first_name as organizer_first_name, ou.last_name as organizer_last_name,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
        FROM events e
        JOIN tailors t ON t.id = e.tailor_id
        JOIN users tu ON tu.id = t.user_id
        JOIN users ou ON ou.id = e.organizer_id
        WHERE e.invite_code = ?
      `, [req.params.inviteCode.toUpperCase()]) as any[];
      if (!(rows as any[]).length) return res.status(404).json({ error: "Événement introuvable" });
      res.json((rows as any[])[0]);
    } catch (error) {
      console.error("Failed to get event:", error);
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  // Join an event
  app.post("/api/events/join/:inviteCode", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [evRows] = await pool.query(`SELECT * FROM events WHERE invite_code = ?`, [req.params.inviteCode.toUpperCase()]) as any[];
      if (!(evRows as any[]).length) return res.status(404).json({ error: "Événement introuvable" });
      const event = (evRows as any[])[0];
      if (event.status && event.status !== 'active') {
        return res.status(403).json({ error: "Cet événement n'est pas encore ouvert aux inscriptions." });
      }
      // Check if already joined
      const [existing] = await pool.query(
        `SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?`, [event.id, userId]
      ) as any[];
      if ((existing as any[]).length > 0) return res.json({ alreadyJoined: true, eventId: event.id });
      // Create a project linked to the event
      const projectId = require("crypto").randomUUID();
      await pool.query(
        `INSERT INTO projects (id, tailor_id, client_id, title, status, progress, current_step, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', 0, 'prise_mesures', NOW(), NOW())`,
        [projectId, event.tailor_id, userId, `[Événement] ${event.name}`]
      );
      // Add participant
      const participantId = require("crypto").randomUUID();
      await pool.query(
        `INSERT IGNORE INTO event_participants (id, event_id, user_id, project_id) VALUES (?, ?, ?, ?)`,
        [participantId, event.id, userId, projectId]
      );
      res.status(201).json({ success: true, eventId: event.id, projectId });
    } catch (error) {
      console.error("Failed to join event:", error);
      res.status(500).json({ error: "Failed to join event" });
    }
  });

  // Get event details with participants
  app.get("/api/events/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [evRows] = await pool.query(`
        SELECT e.*, 
          tu.first_name as tailor_first_name, tu.last_name as tailor_last_name,
          tu.profile_image_url as tailor_avatar, tu.id as tailor_user_id,
          ou.first_name as organizer_first_name, ou.last_name as organizer_last_name
        FROM events e
        JOIN tailors t ON t.id = e.tailor_id
        JOIN users tu ON tu.id = t.user_id
        JOIN users ou ON ou.id = e.organizer_id
        WHERE e.id = ?
      `, [req.params.id]) as any[];
      if (!(evRows as any[]).length) return res.status(404).json({ error: "Événement introuvable" });
      const event = (evRows as any[])[0];
      const [partRows] = await pool.query(`
        SELECT ep.*, u.first_name, u.last_name, u.profile_image_url,
          p.status as project_status, p.current_step, p.id as project_id
        FROM event_participants ep
        JOIN users u ON u.id = ep.user_id
        LEFT JOIN projects p ON p.id = ep.project_id
        WHERE ep.event_id = ?
        ORDER BY ep.joined_at ASC
      `, [req.params.id]) as any[];
      event.participants = partRows;
      event.userHasJoined = (partRows as any[]).some((p: any) => p.user_id === userId);
      event.participantCount = (partRows as any[]).length;
      res.json(event);
    } catch (error) {
      console.error("Failed to get event details:", error);
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  // Tailor: list events
  app.get("/api/tailor/events", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [rows] = await pool.query(`
        SELECT e.*,
          ou.first_name as organizer_first_name, ou.last_name as organizer_last_name,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
        FROM events e
        JOIN users ou ON ou.id = e.organizer_id
        WHERE e.tailor_id = ?
        ORDER BY e.event_date ASC
      `, [tailor.id]) as any[];
      res.json(rows);
    } catch (error) {
      console.error("Failed to get tailor events:", error);
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  // Client: list joined events
  app.get("/api/client/events", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [rows] = await pool.query(`
        SELECT e.*,
          tu.first_name as tailor_first_name, tu.last_name as tailor_last_name,
          tu.profile_image_url as tailor_avatar,
          ou.first_name as organizer_first_name, ou.last_name as organizer_last_name,
          ep.project_id, ep.joined_at,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
        FROM event_participants ep
        JOIN events e ON e.id = ep.event_id
        JOIN tailors t ON t.id = e.tailor_id
        JOIN users tu ON tu.id = t.user_id
        JOIN users ou ON ou.id = e.organizer_id
        WHERE ep.user_id = ?
        ORDER BY e.event_date ASC
      `, [userId]) as any[];
      res.json(rows);
    } catch (error) {
      console.error("Failed to get client events:", error);
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  // Update event (organizer or tailor only)
  app.patch("/api/events/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { registrationDeadline, description, name } = req.body;
      const [evRows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      const event = (evRows as any[])[0];
      if (!event) return res.status(404).json({ error: "Event not found" });
      const tailor = await storage.getTailorByUserId(userId);
      const isTailor = tailor && tailor.id === event.tailor_id;
      const isOrganizer = event.organizer_id === userId;
      if (!isTailor && !isOrganizer) return res.status(403).json({ error: "Unauthorized" });
      const updates: string[] = [];
      const params: any[] = [];
      if (registrationDeadline !== undefined) { updates.push("registration_deadline = ?"); params.push(registrationDeadline || null); }
      if (description !== undefined) { updates.push("description = ?"); params.push(description || null); }
      if (name !== undefined) { updates.push("name = ?"); params.push(name); }
      if (updates.length > 0) {
        params.push(req.params.id);
        await pool.query(`UPDATE events SET ${updates.join(", ")} WHERE id = ?`, params);
      }
      const [updated] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      res.json((updated as any[])[0]);
    } catch (error) {
      console.error("Failed to update event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Broadcast message from tailor to all event participants
  app.post("/api/events/:id/broadcast", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [evRows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      const event = (evRows as any[])[0];
      if (!event || event.tailor_id !== tailor.id) return res.status(403).json({ error: "Unauthorized" });
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: "Message vide" });
      const [partRows] = await pool.query(
        `SELECT user_id FROM event_participants WHERE event_id = ? AND user_id != ?`,
        [event.id, userId]
      ) as any[];
      let sent = 0;
      for (const part of (partRows as any[])) {
        try {
          const conv = await storage.getOrCreateConversation(userId, part.user_id);
          await storage.createMessage({ conversationId: conv.id, senderId: userId, content });
          sent++;
        } catch (e) { console.error("Broadcast message error:", e); }
      }
      res.json({ success: true, sent });
    } catch (error) {
      console.error("Failed to broadcast:", error);
      res.status(500).json({ error: "Failed to broadcast" });
    }
  });

  // ── Event: approve / reject (tailor only) ─────────────────────────────────
  app.patch("/api/events/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [evRows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      const event = (evRows as any[])[0];
      if (!event) return res.status(404).json({ error: "Événement introuvable" });
      if (event.tailor_id !== tailor.id) return res.status(403).json({ error: "Unauthorized" });
      await pool.query(`UPDATE events SET status = 'active' WHERE id = ?`, [req.params.id]);
      // Notify organizer with invite link
      try {
        const conv = await storage.getOrCreateConversation(userId, event.organizer_id);
        const inviteUrl = `https://seamlier.fr/evenement/rejoindre/${event.invite_code}`;
        const msg = `✅ Votre commande groupée **${event.name}** a été acceptée !\n\nPartagez ce lien à votre groupe pour qu'ils puissent rejoindre :\n${inviteUrl}\n\nCode d'invitation : **${event.invite_code}**`;
        await storage.createMessage({ conversationId: conv.id, senderId: userId, content: msg });
      } catch (e) { console.error("Event approval notification error:", e); }
      const [updated] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      res.json((updated as any[])[0]);
    } catch (error) {
      console.error("Failed to approve event:", error);
      res.status(500).json({ error: "Failed to approve event" });
    }
  });

  app.patch("/api/events/:id/reject", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [evRows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      const event = (evRows as any[])[0];
      if (!event) return res.status(404).json({ error: "Événement introuvable" });
      if (event.tailor_id !== tailor.id) return res.status(403).json({ error: "Unauthorized" });
      const { reason } = req.body;
      await pool.query(`UPDATE events SET status = 'rejected' WHERE id = ?`, [req.params.id]);
      try {
        const conv = await storage.getOrCreateConversation(userId, event.organizer_id);
        const msg = reason
          ? `❌ Votre demande de commande groupée **${event.name}** n'a pas pu être acceptée.\n\nMotif : ${reason}`
          : `❌ Votre demande de commande groupée **${event.name}** n'a pas pu être acceptée.`;
        await storage.createMessage({ conversationId: conv.id, senderId: userId, content: msg });
      } catch (e) { console.error("Event rejection notification error:", e); }
      const [updated] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      res.json((updated as any[])[0]);
    } catch (error) {
      console.error("Failed to reject event:", error);
      res.status(500).json({ error: "Failed to reject event" });
    }
  });

  // ── Working hours ──────────────────────────────────────────────────────────
  // Public: get a tailor's working hours by tailor ID
  app.get("/api/tailors/:id/working-hours", async (req: any, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM tailor_working_hours WHERE tailor_id = ? ORDER BY day_of_week`,
        [req.params.id]
      ) as any[];
      res.json(rows);
    } catch (error) {
      console.error("Failed to get working hours:", error);
      res.status(500).json({ error: "Failed to get working hours" });
    }
  });

  // Pro: save own working hours (array of { dayOfWeek, startTime, endTime, isClosed })
  app.put("/api/pro/working-hours", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const { hours } = req.body;
      if (!Array.isArray(hours)) return res.status(400).json({ error: "hours doit être un tableau" });
      for (const h of hours) {
        const id = require("crypto").randomUUID();
        await pool.query(`
          INSERT INTO tailor_working_hours (id, tailor_id, day_of_week, start_time, end_time, is_closed)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time), is_closed = VALUES(is_closed)
        `, [id, tailor.id, h.dayOfWeek, h.isClosed ? null : (h.startTime || "09:00"), h.isClosed ? null : (h.endTime || "18:00"), h.isClosed ? 1 : 0]);
      }
      const [rows] = await pool.query(
        `SELECT * FROM tailor_working_hours WHERE tailor_id = ? ORDER BY day_of_week`,
        [tailor.id]
      ) as any[];
      res.json(rows);
    } catch (error) {
      console.error("Failed to save working hours:", error);
      res.status(500).json({ error: "Failed to save working hours" });
    }
  });

  // Public: get available time slots for a tailor on a given date
  app.get("/api/tailors/:id/available-slots", async (req: any, res) => {
    try {
      const tailorId = req.params.id;
      const { date } = req.query as { date?: string };
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "date (YYYY-MM-DD) est requise" });
      }
      const dayOfWeek = new Date(date + "T12:00:00").getDay(); // 0=Sun
      // Get working hours for that day
      const [whRows] = await pool.query(
        `SELECT * FROM tailor_working_hours WHERE tailor_id = ? AND day_of_week = ?`,
        [tailorId, dayOfWeek]
      ) as any[];
      const wh = (whRows as any[])[0];
      if (wh?.is_closed) return res.json({ available: false, slots: [] });
      const startH = wh?.start_time ? parseInt(wh.start_time.split(":")[0]) : 9;
      const endH = wh?.end_time ? parseInt(wh.end_time.split(":")[0]) : 18;
      // Get confirmed appointments for that tailor on that date
      const [apptRows] = await pool.query(`
        SELECT DATE_FORMAT(scheduled_at, '%H:%i') as time_slot, duration
        FROM appointments
        WHERE tailor_id = ? AND DATE(scheduled_at) = ? AND status IN ('scheduled','confirmed')
      `, [tailorId, date]) as any[];
      const busySlots = new Set<string>();
      for (const appt of (apptRows as any[])) {
        const [hh, mm] = appt.time_slot.split(":").map(Number);
        const dur = Math.ceil((appt.duration || 60) / 60);
        for (let i = 0; i < dur; i++) {
          const h = hh + i;
          busySlots.add(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
        }
      }
      const slots: { time: string; available: boolean }[] = [];
      for (let h = startH; h < endH; h++) {
        const time = `${String(h).padStart(2, "0")}:00`;
        slots.push({ time, available: !busySlots.has(time) });
      }
      res.json({ available: true, startTime: wh?.start_time || "09:00", endTime: wh?.end_time || "18:00", slots });
    } catch (error) {
      console.error("Failed to get available slots:", error);
      res.status(500).json({ error: "Failed to get available slots" });
    }
  });

  // ── Cron: daily deadline + fabric deposit checks ──────────────────────────
  async function runDailyChecks() {
    try {
      const today = new Date();
      // Fabric deposit: 48h before
      const in48h = new Date(today); in48h.setDate(in48h.getDate() + 2);
      const in48hStr = in48h.toISOString().slice(0, 10);
      const [fabRows] = await pool.query(`
        SELECT p.*, u.email as client_email, u.first_name as client_name,
          tu.first_name as tailor_first_name, tu.last_name as tailor_last_name
        FROM projects p
        JOIN users u ON u.id = p.client_id
        JOIN tailors t ON t.id = p.tailor_id
        JOIN users tu ON tu.id = t.user_id
        WHERE p.fabric_deposit_date = ? AND p.fabric_deposit_reminder_sent = 0
      `, [in48hStr]) as any[];
      for (const row of (fabRows as any[])) {
        const artisanName = `${row.tailor_first_name || ""} ${row.tailor_last_name || ""}`.trim();
        const dateFormatted = new Date(row.fabric_deposit_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
        await sendFabricDepositReminderEmail(row.client_email, row.client_name, artisanName, dateFormatted);
        await pool.query(`UPDATE projects SET fabric_deposit_reminder_sent = 1 WHERE id = ?`, [row.id]);
      }
      // Deadline < 5 days: warn artisan + admin
      const in5days = new Date(today); in5days.setDate(in5days.getDate() + 5);
      const in5daysStr = in5days.toISOString().slice(0, 10);
      const todayStr = today.toISOString().slice(0, 10);
      const [dlRows] = await pool.query(`
        SELECT p.*, tu.email as tailor_email, tu.first_name as tailor_first_name, tu.last_name as tailor_last_name
        FROM projects p
        JOIN tailors t ON t.id = p.tailor_id
        JOIN users tu ON tu.id = t.user_id
        WHERE p.client_deadline BETWEEN ? AND ? AND p.status NOT IN ('completed','cancelled')
      `, [todayStr, in5daysStr]) as any[];
      const adminEmail = process.env.ADMIN_EMAIL || "admin@seamlier.fr";
      for (const row of (dlRows as any[])) {
        const deadlineFormatted = new Date(row.client_deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
        const tailorName = `${row.tailor_first_name || ""} ${row.tailor_last_name || ""}`.trim();
        await sendDeadlineWarningEmail(row.tailor_email, tailorName, row.title, deadlineFormatted, "artisan");
        await sendDeadlineWarningEmail(adminEmail, "Admin", row.title, deadlineFormatted, "admin");
      }
      console.log(`[CRON] Daily checks done — fabric: ${(fabRows as any[]).length}, deadlines: ${(dlRows as any[]).length}`);
    } catch (err) {
      console.error("[CRON] Daily check error:", err);
    }
  }
  // Run once at startup (delayed) and then every 24h
  setTimeout(() => { runDailyChecks(); setInterval(runDailyChecks, 24 * 60 * 60 * 1000); }, 30000);

  const deployZipPath = path.join(process.cwd(), "seamlier-deploy.zip");
  const serveZip = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=seamlier-deploy.zip");
    res.sendFile(deployZipPath, (err) => {
      if (err && !res.headersSent) res.status(404).send("Fichier non trouvé");
    });
  };
  app.get("/download/seamlier-deploy.zip", serveZip);
  app.get("/seamlier-deploy.zip", serveZip);

    registerStripeRoutes(app);

  // ─── Tailor Schedule ───────────────────────────────────────────────────────

  app.get('/api/tailor/:tailorId/schedule', async (req, res) => {
    try {
      const { tailorId } = req.params;
      const [rows] = await pool.query('SELECT * FROM tailor_schedule WHERE tailor_id = ? ORDER BY day_of_week', [tailorId]) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post('/api/tailor/schedule', requireAuth, async (req: any, res) => {
    try {
      const tailor = await storage.getTailorByUserId(req.authUserId);
      if (!tailor) return res.status(403).json({ error: 'Not a tailor' });
      const { schedule } = req.body;
      for (const day of schedule) {
        const [existing] = await pool.query('SELECT id FROM tailor_schedule WHERE tailor_id = ? AND day_of_week = ?', [tailor.id, day.dayOfWeek]) as any[];
        if (Array.isArray(existing) && existing.length > 0) {
          await pool.query('UPDATE tailor_schedule SET start_time = ?, end_time = ?, is_closed = ? WHERE tailor_id = ? AND day_of_week = ?', [day.startTime, day.endTime, day.isClosed ? 1 : 0, tailor.id, day.dayOfWeek]);
        } else {
          const newId = require('crypto').randomUUID();
          await pool.query('INSERT INTO tailor_schedule (id, tailor_id, day_of_week, start_time, end_time, is_closed) VALUES (?, ?, ?, ?, ?, ?)', [newId, tailor.id, day.dayOfWeek, day.startTime, day.endTime, day.isClosed ? 1 : 0]);
        }
      }
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get('/api/tailor/:tailorId/availability', async (req, res) => {
    try {
      const { tailorId } = req.params;
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'date requis' });
      const d = new Date(date as string);
      const dayOfWeek = d.getDay();
      const [scheduleRows] = await pool.query('SELECT * FROM tailor_schedule WHERE tailor_id = ? AND day_of_week = ?', [tailorId, dayOfWeek]) as any[];
      const schedule = Array.isArray(scheduleRows) ? scheduleRows[0] : null;
      if (!schedule || schedule.is_closed) return res.json({ slots: [], isClosed: true });
      const slots = [];
      const [startH, startM] = schedule.start_time.split(':').map(Number);
      const [endH, endM] = schedule.end_time.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      const [apptRows] = await pool.query("SELECT scheduled_at, duration FROM appointments WHERE tailor_id = ? AND DATE(scheduled_at) = ? AND status = 'confirmed'", [tailorId, date]) as any[];
      const bookedSlots = Array.isArray(apptRows) ? apptRows.map((a: any) => { const t = new Date(a.scheduled_at); return { start: t.getHours() * 60 + t.getMinutes(), duration: a.duration || 60 }; }) : [];
      for (let m = startTotal; m < endTotal; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
        const isBooked = bookedSlots.some((b: any) => m >= b.start && m < b.start + b.duration);
      }
      res.json({ slots, isClosed: false });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });
  return httpServer;
}

function renderVerificationPage(success: boolean, message: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vérification Email - SEAMLIER</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#faf9f7;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;border-radius:16px;padding:48px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{width:64px;height:64px;border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:28px}.success{background:#dcfce7;color:#16a34a}.error{background:#fee2e2;color:#dc2626}h1{font-family:'Playfair Display',serif;color:#722F37;font-size:24px;margin-bottom:12px}p{color:#6b7280;line-height:1.6;margin-bottom:24px}a{display:inline-block;background:#722F37;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;transition:background .2s}a:hover{background:#5a252c}</style></head><body><div class="card"><div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div><h1>${success ? 'Email vérifié !' : 'Erreur de vérification'}</h1><p>${message}</p><a href="/connexion">Se connecter</a></div></body></html>`;
}
