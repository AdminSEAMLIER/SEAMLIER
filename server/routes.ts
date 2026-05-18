import { registerStripeRoutes } from "./stripe";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import { tailors, users, insertEventSchema } from "../shared/schema";
import { randomUUID } from "crypto";
import { uploadDoc, uploadPortfolio, uploadsDir } from "./upload";
import { generateProjectContract } from "./contract";
import {
  sendNewMessageEmail,
  sendDeliveryEmail,
  sendReviewRequestEmail,
  sendPaymentConfirmationEmail,
  sendAppointmentConfirmationEmail,
  sendNewAppointmentRequestEmail,
  sendFabricDepositReminderEmail,
  sendDeadlineWarningEmail,
  sendDossierValidatedEmail,
  sendDossierRejectedEmail,
  sendWelcomeEmail,
  sendDossierReceivedEmail,
  sendNewProjectRequestEmail,
  sendQuoteReadyEmail,
  sendQuoteAcceptedByClientEmail,
  sendQuoteAcceptedClientConfirmationEmail,
  sendArtisanPaymentReceivedEmail,
  sendReferralInviteEmail,
  sendAdminDocUploadNotif,
  sendAdminProInfoEmail,
} from "./email";
import { sendSms } from "./sms";
import { getIO } from "./socketio";
import { sendPushNotification, saveSubscription, deleteSubscription } from "./push";

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
): Promise<any> {

  // Stripe routes registered first — must come before any catch-all middleware
  registerStripeRoutes(app);

  // Email verification — registered immediately after Stripe, before all other routes,
  // to guarantee it is never shadowed by an uncaught error in a later route block.
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
      if (userRaw.email) {
        sendWelcomeEmail(userRaw.email, userRaw.firstName ?? null).catch(err =>
          console.error("[Welcome email] Failed:", err)
        );
      }
      return res.send(renderVerificationPage(true, "Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter."));
    } catch (error) {
      console.error("Email verification error:", error);
      return res.status(500).send(renderVerificationPage(false, "Erreur serveur."));
    }
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


  // ─── Routes planning (avant /:id pour éviter conflit Express) ──────────────
  app.get('/api/tailors/availability', async (req, res) => {
    try {
      const tailorId = req.query.tailorId as string;
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'date requis' });
      const dateStr = date as string;
      const [exRows] = await pool.query('SELECT * FROM tailor_exceptions WHERE tailor_id = ? AND date = ?', [tailorId, dateStr]) as any[];
      if (Array.isArray(exRows) && exRows.length > 0) return res.json({ slots: [], isClosed: true, isException: true, reason: exRows[0].reason });
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay();
      const [whRows] = await pool.query('SELECT * FROM tailor_working_hours WHERE tailor_id = ? AND day_of_week = ?', [tailorId, dayOfWeek]) as any[];
      const [schRows] = await pool.query('SELECT * FROM tailor_schedule WHERE tailor_id = ? AND day_of_week = ?', [tailorId, dayOfWeek]) as any[];
      const schedule = (Array.isArray(whRows) && whRows.length > 0 ? whRows[0] : null) || (Array.isArray(schRows) ? schRows[0] : null);
      if (!schedule || schedule.is_closed) return res.json({ slots: [], isClosed: true, isException: false });
      const [sh, sm] = schedule.start_time.split(':').map(Number);
      const [eh, em] = schedule.end_time.split(':').map(Number);
      const startTotal = sh * 60 + sm, endTotal = eh * 60 + em;
      const [apptRows] = await pool.query("SELECT scheduled_at, duration FROM appointments WHERE tailor_id = ? AND DATE(scheduled_at) = ? AND status IN ('confirmed','scheduled','pending')", [tailorId, dateStr]) as any[];
      const booked = Array.isArray(apptRows) ? apptRows.map((a: any) => { const t = new Date(a.scheduled_at); return { start: t.getHours() * 60 + t.getMinutes(), duration: a.duration || 60 }; }) : [];
      const slots = [];
      for (let m = startTotal; m < endTotal; m += 30) {
        const timeStr = String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
        slots.push({ time: timeStr, available: !booked.some((b: any) => m >= b.start && m < b.start + b.duration) });
      }
      res.json({ slots, isClosed: false, isException: false });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get('/api/tailors/closed-days', async (req, res) => {
    try {
      const tailorId = req.query.tailorId as string;
      const { year, month } = req.query;
      if (!year || !month) return res.status(400).json({ error: 'year and month required' });
      const [whRows] = await pool.query('SELECT day_of_week, is_closed FROM tailor_working_hours WHERE tailor_id = ?', [tailorId]) as any[];
      const [schRows] = await pool.query('SELECT day_of_week, is_closed FROM tailor_schedule WHERE tailor_id = ?', [tailorId]) as any[];
      const rows = Array.isArray(whRows) && whRows.length > 0 ? whRows : (Array.isArray(schRows) ? schRows : []);
      const closedWeekdays = rows.filter((r: any) => r.is_closed).map((r: any) => r.day_of_week);
      const y = parseInt(year as string), mo = parseInt(month as string);
      const dateFrom = `${y}-${String(mo).padStart(2,'0')}-01`;
      const dateTo = `${y}-${String(mo).padStart(2,'0')}-${new Date(y,mo,0).getDate()}`;
      const [exRows] = await pool.query('SELECT date FROM tailor_exceptions WHERE tailor_id = ? AND date BETWEEN ? AND ?', [tailorId, dateFrom, dateTo]) as any[];
      const exceptionDates = Array.isArray(exRows) ? exRows.map((r: any) => { const d = new Date(r.date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }) : [];
      const closedDates = [...exceptionDates];
      for (let day = 1; day <= new Date(y,mo,0).getDate(); day++) {
        const dow = new Date(y,mo-1,day).getDay();
        if (closedWeekdays.includes(dow)) { const ds = `${y}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`; if (!closedDates.includes(ds)) closedDates.push(ds); }
      }
      res.json({ closedDates, closedWeekdays, exceptionDates });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get('/api/tailors/exceptions', async (req, res) => {
    try {
      const tailorId = req.query.tailorId as string;
      const [rows] = await pool.query('SELECT * FROM tailor_exceptions WHERE tailor_id = ? ORDER BY date ASC', [tailorId]) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // UUID-only constraint prevents this wildcard from shadowing keyword routes like
  // /api/tailors/projects or /api/tailors/portfolio registered later in this file.
  app.get("/api/tailors/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", async (req, res) => {
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
        SELECT t.*, u.first_name, u.last_name, u.profile_image_url, u.location
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
      // Drizzle retourne isApproved en boolean (true/false) — ne pas comparer à 1 avec ===
      const reviews = allReviews.filter((r: any) => !!r.isApproved || !!r.is_approved);
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
      
      const { bio, specialties, experience, coverImageUrl, languages, priceMin, priceMax } = req.body;
      const updated = await storage.updateTailor(tailor.id, { bio, specialties, experience, coverImageUrl, languages, priceMin, priceMax });
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

      // Broadcast to conversation room via Socket.io
      const io = getIO();
      if (io && message.conversationId) {
        io.to(message.conversationId).emit("new_message", message);
      }

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
            const fiveMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
            const isAway = !lastActive || lastActive < fiveMinsAgo;
            if (recipEmail && isAway) {
              const preview = (req.body.content || "").slice(0, 100);
              sendNewMessageEmail(recipEmail, recipName, senderName, preview).catch(() => {});
            }
            // Push notification to recipient
            if (row.recip_uid) {
              const preview = (req.body.content || "").slice(0, 80);
              sendPushNotification(row.recip_uid, `Nouveau message de ${senderName}`, preview, "/messages").catch(() => {});
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

  // ── Push Notifications ────────────────────────────────────────────────────
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
  });

  app.post("/api/push/subscribe", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: "Subscription invalide" });
      await saveSubscription(userId, { endpoint, keys });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.delete("/api/push/unsubscribe", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { endpoint } = req.body;
      if (endpoint) await deleteSubscription(userId, endpoint);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // ── PARRAINAGE ARTISAN ──────────────────────────────────────────────────────

  app.post("/api/referrals", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Réservé aux artisans" });

      const { email } = req.body;
      if (!email || typeof email !== "string") return res.status(400).json({ error: "Email requis" });

      const [existing] = await pool.query(
        "SELECT id FROM referrals WHERE referrer_tailor_id = ? AND referred_email = ?",
        [tailor.id, email.toLowerCase()]
      ) as any[];
      if ((existing as any[]).length > 0) {
        return res.status(409).json({ error: "Cet email a déjà été invité" });
      }

      const token = randomUUID().replace(/-/g, "").slice(0, 32);
      const id = randomUUID();
      await pool.query(
        "INSERT INTO referrals (id, referrer_tailor_id, referred_email, status, token) VALUES (?, ?, ?, 'pending', ?)",
        [id, tailor.id, email.toLowerCase(), token]
      );

      if (!(tailor as any).referralCode) {
        const code = (tailor.id.replace(/-/g, "").slice(0, 8)).toUpperCase();
        await pool.query("UPDATE tailors SET referral_code = ? WHERE id = ?", [code, tailor.id]);
      }

      const [userRows] = await pool.query("SELECT first_name, last_name FROM users WHERE id = ?", [userId]) as any[];
      const u = (userRows as any[])[0];
      const referrerName = u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : "Un artisan SEAMLIER";

      await sendReferralInviteEmail(email.toLowerCase(), referrerName, token);

      res.json({ success: true, id, token });
    } catch (err) {
      console.error("referral POST error:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/referrals/mine", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Réservé aux artisans" });

      const [rows] = await pool.query(
        "SELECT id, referred_email, status, created_at FROM referrals WHERE referrer_tailor_id = ? ORDER BY created_at DESC",
        [tailor.id]
      ) as any[];

      res.json({ referrals: rows, referralCode: (tailor as any).referralCode || null });
    } catch (err) {
      console.error("referral GET error:", err);
      res.status(500).json({ error: "Erreur serveur" });
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

  app.get("/api/tailors/projects", requireAuth, async (req: any, res) => {
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

  app.get("/api/tailors/requests", requireAuth, async (req: any, res) => {
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

  app.get("/api/tailors/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const now = new Date();
      const rawMonth = req.query.month;
      const rawYear  = req.query.year;
      const targetYear  = rawYear  !== undefined ? parseInt(rawYear  as string, 10) : now.getFullYear();
      const targetMonth = rawMonth !== undefined ? parseInt(rawMonth as string, 10) : now.getMonth();

      // Serialize Date bounds as MySQL DATETIME strings (YYYY-MM-DD HH:MM:SS)
      const toMysqlDatetime = (d: Date): string => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      const firstOfMonth    = toMysqlDatetime(new Date(targetYear, targetMonth, 1));
      const firstOfNextMonth = toMysqlDatetime(new Date(targetYear, targetMonth + 1, 1));
      const isCurrentMonth  = targetYear === now.getFullYear() && targetMonth === now.getMonth();

      // Revenus du mois : montant artisan réel (amount_artisan en centimes → ÷100), fallback sur amount
      const [revenueRows] = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN amount_artisan > 0 THEN amount_artisan/100 ELSE amount END), 0) as total
         FROM projects
         WHERE tailor_id = ? AND status = 'completed'
           AND updated_at >= ? AND updated_at < ?`,
        [tailor.id, firstOfMonth, firstOfNextMonth]
      ) as any[];
      const monthlyRevenue = Array.isArray(revenueRows) && revenueRows[0]
        ? parseFloat(revenueRows[0].total) || 0 : 0;

      // Projets actifs : tous les in_progress pour le mois courant,
      // ou projets créés dans la période pour les mois historiques
      let activeProjects = 0;
      if (isCurrentMonth) {
        const [activeRows] = await pool.query(
          "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND status = 'in_progress'",
          [tailor.id]
        ) as any[];
        activeProjects = Array.isArray(activeRows) && activeRows[0]
          ? parseInt(activeRows[0].cnt) || 0 : 0;
      } else {
        const [activeRows] = await pool.query(
          "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND created_at >= ? AND created_at < ?",
          [tailor.id, firstOfMonth, firstOfNextMonth]
        ) as any[];
        activeProjects = Array.isArray(activeRows) && activeRows[0]
          ? parseInt(activeRows[0].cnt) || 0 : 0;
      }

      // Nouvelles demandes : créées dans la période
      const [requestRows] = await pool.query(
        `SELECT COUNT(*) as cnt FROM projects
         WHERE tailor_id = ? AND status IN ('pending','new')
           AND created_at >= ? AND created_at < ?`,
        [tailor.id, firstOfMonth, firstOfNextMonth]
      ) as any[];
      const newRequests = Array.isArray(requestRows) && requestRows[0]
        ? parseInt(requestRows[0].cnt) || 0 : 0;

      const averageRating = tailor.rating || 0;

      res.json({ monthlyRevenue, activeProjects, newRequests, averageRating });
    } catch (error) {
      console.error("Error fetching tailor stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/tailors/stats-full", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // CA du mois en cours — montant artisan réel (amount_artisan centimes ÷ 100), fallback sur amount
      const [revenueRows] = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN amount_artisan > 0 THEN amount_artisan/100 ELSE amount END), 0) as total
         FROM projects WHERE tailor_id = ? AND status = 'completed' AND updated_at >= ?`,
        [tailor.id, firstOfMonth]
      ) as any[];
      const monthlyRevenue = parseFloat(revenueRows?.[0]?.total) || 0;

      // Panier moyen — montant artisan réel
      const [avgRows] = await pool.query(
        `SELECT COALESCE(AVG(CASE WHEN amount_artisan > 0 THEN amount_artisan/100 ELSE amount END), 0) as avg_val
         FROM projects WHERE tailor_id = ? AND status = 'completed' AND (amount_artisan > 0 OR amount > 0)`,
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

      // CA des 6 derniers mois — montant artisan réel
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const [monthlyRows] = await pool.query(
        `SELECT DATE_FORMAT(updated_at, '%Y-%m') as month,
                COALESCE(SUM(CASE WHEN amount_artisan > 0 THEN amount_artisan/100 ELSE amount END), 0) as total
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

  app.get("/api/tailors/projects/count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [rows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND status IN ('in_progress','completed') AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')",
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

      // Mark client as confirmed
      await pool.query("UPDATE projects SET client_confirmed = 1 WHERE id = ?", [id]);
      console.log(`[Project] ${id} → clientConfirmed=true, deadlineRespected=${deadlineRespected}`);

      // Auto-trigger Stripe transfer to artisan
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const [rows] = await pool.query(`
            SELECT p.stripe_transfer_id, p.amount_artisan, p.stripe_payment_intent_id,
                   u.stripe_account_id, u.id AS tailor_user_id,
                   t.id AS tailor_id
            FROM projects p
            JOIN tailors t ON t.id = p.tailor_id
            JOIN users u ON u.id = t.user_id
            WHERE p.id = ? LIMIT 1
          `, [id]) as any[];
          const proj = Array.isArray(rows) && rows[0] ? rows[0] : null;

          if (proj && !proj.stripe_transfer_id && proj.stripe_account_id && proj.amount_artisan > 0) {
            const StripeLib = (await import("stripe")).default;
            const stripeClient = new StripeLib(process.env.STRIPE_SECRET_KEY);
            const transfer = await stripeClient.transfers.create({
              amount: proj.amount_artisan,
              currency: "eur",
              destination: proj.stripe_account_id,
              description: `SEAMLiER - Virement projet #${id}`,
            });
            await pool.query(
              "UPDATE projects SET stripe_transfer_id = ?, payment_status = 'transferred' WHERE id = ?",
              [transfer.id, id]
            );
            console.log(`[Project] ${id} → transfer ${transfer.id} vers ${proj.stripe_account_id}`);

            // Notify artisan via push
            if (proj.tailor_user_id) {
              sendPushNotification(proj.tailor_user_id, "Virement effectué !", "Le client a confirmé la réception. Le virement a été envoyé sur votre compte.", "/atelier").catch(() => {});
            }
          }
        } catch (transferErr) {
          console.error(`[Project] Transfer auto-release failed for ${id}:`, transferErr);
          // Non-blocking — client confirmation is still saved
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming project:", error);
      res.status(500).json({ error: "Failed to confirm project" });
    }
  });

  // ── CRM : Notes et statut client par artisan ──────────────────────────────
  app.get("/api/tailors/client/:clientId/notes", requireAuth, async (req: any, res) => {
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

  app.post("/api/tailors/client/:clientId/notes", requireAuth, async (req: any, res) => {
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
        if (!tailor) return res.status(403).json({ error: "Tailor profile not found" });
        if (!tailor.subscriptionPlan || tailor.subscriptionPlan === "Starter") {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const [countRows] = await pool.query(
            "SELECT COUNT(*) as cnt FROM projects WHERE tailor_id = ? AND created_at >= ?",
            [tailor.id, startOfMonth]
          ) as any[];
          const monthlyCount = Array.isArray(countRows) && countRows[0] ? Number(countRows[0].cnt) : 0;
          if (monthlyCount >= 10) return res.status(403).json({ error: "Limite mensuelle atteinte" });
        }
        if (!req.body.clientId) {
          return res.status(400).json({ error: "clientId is required" });
        }
        let project: any;
        try {
          project = await storage.createProject({ ...req.body, tailorId: tailor.id });
        } catch (photoErr: any) {
          if ((photoErr?.message?.includes("Data too long") || photoErr?.code === "ER_DATA_TOO_LONG") && req.body.modelPhotoUrl) {
            console.warn("[PROJECT] modelPhotoUrl too large, retrying without photo");
            project = await storage.createProject({ ...req.body, tailorId: tailor.id, modelPhotoUrl: null });
          } else {
            throw photoErr;
          }
        }
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
      const projectPayload = {
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
      };
      let project: any;
      try {
        project = await storage.createProject(projectPayload);
      } catch (photoErr: any) {
        if ((photoErr?.message?.includes("Data too long") || photoErr?.code === "ER_DATA_TOO_LONG") && req.body.modelPhotoUrl) {
          console.warn("[PROJECT] modelPhotoUrl too large, retrying without photo");
          project = await storage.createProject({ ...projectPayload, modelPhotoUrl: null });
        } else {
          throw photoErr;
        }
      }
      res.status(201).json(project);

      // Notify artisan of new project request
      try {
        const [clientRows] = await pool.query(
          `SELECT first_name, last_name FROM users WHERE id = ?`, [userId]
        ) as any[];
        const [tailorRows] = await pool.query(
          `SELECT u.email, u.first_name, u.last_name FROM users u JOIN tailors t ON t.user_id = u.id WHERE t.id = ?`, [project.tailorId]
        ) as any[];
        const cl = (clientRows as any[])[0];
        const ta = (tailorRows as any[])[0];
        if (cl && ta && ta.email) {
          const clientName = `${cl.first_name || ""} ${cl.last_name || ""}`.trim() || "Un client";
          const tailorName = `${ta.first_name || ""} ${ta.last_name || ""}`.trim();
          sendNewProjectRequestEmail(ta.email, tailorName, clientName, project.title || "Nouvelle commande", project.description ?? null, project.requestedPrice ?? null).catch(() => {});
          // Push to artisan
          const [tailorUserRows] = await pool.query(`SELECT user_id FROM tailors WHERE id = ?`, [project.tailorId]) as any[];
          const tailorUserId = Array.isArray(tailorUserRows) && tailorUserRows[0]?.user_id;
          if (tailorUserId) sendPushNotification(tailorUserId, `Nouvelle demande de ${clientName}`, project.title || "Demande de devis", "/gestion-demandes").catch(() => {});
        }
      } catch (emailErr) {
        console.error("[PROJECT EMAIL]", emailErr);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const prevProject = await storage.getProject(req.params.id);
      const userId = req.authUserId;
      const tailorCheck = await storage.getTailorByUserId(userId);
      if (!prevProject) return res.status(404).json({ error: "Project not found" });
      const isOwner = tailorCheck?.id === prevProject.tailorId || userId === prevProject.clientId;
      if (!isOwner) return res.status(403).json({ error: "Forbidden" });
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

        // Email client : devis prêt
        try {
          const tailor = await storage.getTailor(project.tailorId);
          const [clientRows] = await pool.query(
            `SELECT email, first_name, last_name FROM users WHERE id = ?`, [project.clientId]
          ) as any[];
          const [tailorUserRows] = await pool.query(
            `SELECT u.first_name, u.last_name FROM users u JOIN tailors t ON t.user_id = u.id WHERE t.id = ?`, [project.tailorId]
          ) as any[];
          const cl = (clientRows as any[])[0];
          const ta = (tailorUserRows as any[])[0];
          if (cl?.email && ta) {
            const clientName = `${cl.first_name || ""} ${cl.last_name || ""}`.trim();
            const tailorName = `${ta.first_name || ""} ${ta.last_name || ""}`.trim();
            sendQuoteReadyEmail(cl.email, clientName, tailorName, project.title || "votre projet", project.amount ?? null).catch(() => {});
          }
        } catch (emailErr) {
          console.error("[QUOTE EMAIL]", emailErr);
        }
      }

      // Auto-message + contrat quand la confection commence (status → "in_progress")
      if (req.body.status === "in_progress" && prevProject?.status !== "in_progress") {
        try {
          const tailor = await storage.getTailor(project.tailorId);
          if (tailor?.userId && project.clientId) {
            const conv = await storage.getOrCreateConversation(tailor.userId, project.clientId);
            await storage.createMessage({
              conversationId: conv.id,
              senderId: tailor.userId,
              content: `Votre devis a été accepté ! Vous pouvez maintenant procéder au paiement et prendre rendez-vous.\n[RDV:/prendre-rdv?tailor=${tailor.userId}]`,
            });
          }
        } catch (msgErr) {
          console.error("Auto-message error on project start:", msgErr);
        }

        // Email artisan : devis accepté par le client
        try {
          const [tailorUserRows] = await pool.query(
            `SELECT u.email, u.first_name, u.last_name FROM users u JOIN tailors t ON t.user_id = u.id WHERE t.id = ?`, [project.tailorId]
          ) as any[];
          const [clientRows] = await pool.query(
            `SELECT email, first_name, last_name FROM users WHERE id = ?`, [project.clientId]
          ) as any[];
          const ta = (tailorUserRows as any[])[0];
          const cl = (clientRows as any[])[0];
          if (ta?.email && cl) {
            const tailorName = `${ta.first_name || ""} ${ta.last_name || ""}`.trim();
            const clientName = `${cl.first_name || ""} ${cl.last_name || ""}`.trim();
            // Artisan : son devis a été accepté
            sendQuoteAcceptedByClientEmail(ta.email, tailorName, clientName, project.title || "votre projet", project.amount ?? null).catch(() => {});
            // Client : confirmation de l'acceptation du devis avec montant
            if (cl.email) {
              sendQuoteAcceptedClientConfirmationEmail(cl.email, clientName, tailorName, project.title || "votre projet", project.amount ?? null).catch(() => {});
            }
          }
          // Push to artisan: devis accepté
          const [tailorUserIdRows] = await pool.query(`SELECT user_id FROM tailors WHERE id = ?`, [project.tailorId]) as any[];
          const tuId = Array.isArray(tailorUserIdRows) && tailorUserIdRows[0]?.user_id;
          if (tuId) sendPushNotification(tuId, "Devis accepté !", `${project.title || "Votre devis"} a été accepté par le client.`, "/atelier").catch(() => {});
          // Push to client: devis accepté, paiement disponible
          if (project.clientId) sendPushNotification(project.clientId, "Devis validé", `Vous pouvez maintenant procéder au paiement.`, "/mes-projets").catch(() => {});
        } catch (emailErr) {
          console.error("[QUOTE ACCEPTED EMAIL]", emailErr);
        }

        // Génération du contrat PDF
        try {
          const tailor = await storage.getTailor(project.tailorId);
          const tailorUser = tailor ? await storage.getUser(tailor.userId) : null;
          const clientUser = await storage.getUser(project.clientId);
          const contractUrl = await generateProjectContract(project, tailorUser, clientUser);
          await pool.query(
            "UPDATE projects SET contract_url = ? WHERE id = ?",
            [contractUrl, project.id]
          );
        } catch (contractErr) {
          console.error("Contract generation error:", contractErr);
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
  app.get("/api/tailors/clients/:clientId/summary", requireAuth, async (req: any, res) => {
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

  app.get("/api/tailors/appointments", requireAuth, async (req: any, res) => {
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

      const { scheduledAt, type, duration, notes, location, projectId } = req.body;
      // Client-created appointments start as "pending" (artisan must accept).
      // Artisan-created appointments are "scheduled" immediately.
      const initialStatus = tailor ? "scheduled" : "pending";
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
          initialStatus,
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
          if (!tailor) {
            // Client created → notify artisan to accept/refuse (no confirmation to client yet)
            sendNewAppointmentRequestEmail(ta.email, tailorName, clientName, type || "consultation", scheduledAt).catch(() => {});
            const [tUserRows] = await pool.query(`SELECT user_id FROM tailors WHERE id = ?`, [tailorId]) as any[];
            const tUid = Array.isArray(tUserRows) && tUserRows[0]?.user_id;
            if (tUid) sendPushNotification(tUid, `Nouveau RDV de ${clientName}`, `${type || "Consultation"} — ${new Date(scheduledAt).toLocaleDateString("fr-FR")}`, "/pro-planning").catch(() => {});
          } else {
            // Artisan created → immediately confirmed, notify client
            sendAppointmentConfirmationEmail(cl.email, clientName, scheduledAt, type || "consultation", tailorName).catch(() => {});
            sendPushNotification(clientId, "Rendez-vous confirmé", `${type || "Consultation"} le ${new Date(scheduledAt).toLocaleDateString("fr-FR")}`, "/mes-rendez-vous").catch(() => {});
          }
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
      const existingAppointment = await storage.getAppointment(req.params.id);
      if (!existingAppointment) return res.status(404).json({ error: "Appointment not found" });
      const tailorCheck = await storage.getTailorByUserId(callerId);
      const isOwner = tailorCheck?.id === existingAppointment.tailorId || callerId === existingAppointment.clientId;
      if (!isOwner) return res.status(403).json({ error: "Forbidden" });
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
          const isArtisanConfirming = callerId !== appointment.clientId;
          if (tailor?.userId && appointment.clientId) {
            const conv = await storage.getOrCreateConversation(tailor.userId, appointment.clientId);
            if (!isArtisanConfirming) {
              await storage.createMessage({
                conversationId: conv.id,
                senderId: appointment.clientId,
                content: `✅ J'ai confirmé notre rendez-vous du ${dateStr} à ${timeStr}. À bientôt !`,
              });
            } else {
              await storage.createMessage({
                conversationId: conv.id,
                senderId: tailor.userId,
                content: `✅ Votre rendez-vous du ${dateStr} à ${timeStr} a été confirmé. À bientôt !`,
              });
              // Email de confirmation au client
              const [clientRows] = await pool.query(
                `SELECT email, first_name, last_name FROM users WHERE id = ?`, [appointment.clientId]
              ) as any[];
              const [tailorUserRows] = await pool.query(
                `SELECT u.first_name, u.last_name FROM users u JOIN tailors t ON t.user_id = u.id WHERE t.id = ?`, [appointment.tailorId]
              ) as any[];
              const cl = (clientRows as any[])[0];
              const ta = (tailorUserRows as any[])[0];
              if (cl?.email) {
                const clientName = `${cl.first_name || ""} ${cl.last_name || ""}`.trim();
                const tailorName = ta ? `${ta.first_name || ""} ${ta.last_name || ""}`.trim() : "votre artisan";
                sendAppointmentConfirmationEmail(cl.email, clientName, appointment.scheduledAt, appointment.type || "consultation", tailorName).catch(() => {});
                sendPushNotification(appointment.clientId, "Rendez-vous confirmé !", `${appointment.type || "Consultation"} le ${new Date(appointment.scheduledAt).toLocaleDateString("fr-FR")}`, "/mes-rendez-vous").catch(() => {});
              }
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
  app.get("/api/tailors/portfolio", requireAuth, async (req: any, res) => {
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

  app.post("/api/tailors/portfolio", requireAuth, (req: any, res, next) => {
    uploadPortfolio(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Erreur d'upload" });
      }
      try {
        const userId = req.authUserId;
        const tailor = await storage.getTailorByUserId(userId);
        if (!tailor) {
          return res.status(403).json({ error: "Not a tailor" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "Image requise" });
        }
        const imageUrl = `/uploads/portfolio/${req.file.filename}`;
        const item = await storage.createPortfolioItem({
          tailorId: tailor.id,
          imageUrl,
          title: req.body.title || "Sans titre",
          category: req.body.category || null,
          description: req.body.description || null,
        });
        res.status(201).json(item);
      } catch (error) {
        console.error("Failed to add portfolio item:", error);
        res.status(500).json({ error: "Failed to add portfolio item" });
      }
    });
  });

  app.delete("/api/tailors/portfolio/:id", requireAuth, async (req: any, res) => {
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
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
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

      // Filtre strict : paiement Stripe confirmé uniquement
      const PAID_FILTER = `payment_status = 'paid' AND stripe_payment_intent_id IS NOT NULL AND amount_total > 0`;

      // CA total = SUM(amount_total centimes ÷ 100)
      const [revenueRows] = await pool.query(
        `SELECT COALESCE(SUM(amount_total)/100, 0) as total FROM projects WHERE ${PAID_FILTER}`
      ) as any[];
      const totalRevenue = parseFloat(revenueRows?.[0]?.total) || 0;

      // Commissions SEAMLiER = SUM((amount_total - amount_artisan) ÷ 100)
      const [commRows] = await pool.query(
        `SELECT COALESCE(SUM(amount_total - amount_artisan)/100, 0) as total FROM projects WHERE ${PAID_FILTER}`
      ) as any[];
      const totalCommissions = parseFloat(commRows?.[0]?.total) || 0;

      // CA ce mois (filtré sur updated_at = date de paiement)
      const [monthRevenueRows] = await pool.query(
        `SELECT COALESCE(SUM(amount_total)/100, 0) as total FROM projects WHERE ${PAID_FILTER} AND updated_at >= ?`,
        [firstOfMonth]
      ) as any[];
      const monthRevenue = parseFloat(monthRevenueRows?.[0]?.total) || 0;

      // Commissions ce mois
      const [monthCommRows] = await pool.query(
        `SELECT COALESCE(SUM(amount_total - amount_artisan)/100, 0) as total FROM projects WHERE ${PAID_FILTER} AND updated_at >= ?`,
        [firstOfMonth]
      ) as any[];
      const monthCommissions = parseFloat(monthCommRows?.[0]?.total) || 0;

      // Panier moyen = AVG(amount_total ÷ 100) des projets payés
      const [avgRows] = await pool.query(
        `SELECT COALESCE(AVG(amount_total)/100, 0) as avg_val FROM projects WHERE ${PAID_FILTER}`
      ) as any[];
      const avgProjectValue = parseFloat(avgRows?.[0]?.avg_val) || 0;

      // Projets payés (pas seulement completed — un projet payé peut encore être en fabrication)
      const [paidRows] = await pool.query(
        `SELECT COUNT(*) as cnt FROM projects WHERE ${PAID_FILTER}`
      ) as any[];
      const totalProjectsPaid = parseInt(paidRows?.[0]?.cnt) || 0;

      // Projets complétés (pour info)
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
        totalCommissions,
        monthRevenue,
        monthCommissions,
        avgProjectValue,
        totalProjectsPaid,
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
        JOIN users ou ON ou.id COLLATE utf8mb4_unicode_ci = e.organizer_id COLLATE utf8mb4_unicode_ci
        JOIN tailors t ON t.id = e.tailor_id
        JOIN users tu ON tu.id COLLATE utf8mb4_unicode_ci = t.user_id COLLATE utf8mb4_unicode_ci
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
      const limit = Math.min(parseInt(String(req.query.limit ?? "200")), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0")), 0);
      const allUsers = await storage.getAllUsers();
      const page = allUsers.slice(offset, offset + limit);
      res.json(page);
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
          paymentStatus: (t as any).paymentStatus || "En attente",
          subscriptionCurrentPeriodEnd: (t as any).subscriptionCurrentPeriodEnd || null,
          stripeSubscriptionId: (t as any).stripeSubscriptionId || null,
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
            const defaultPwd = process.env.DEFAULT_TAILOR_PASSWORD;
            if (!defaultPwd) throw new Error("DEFAULT_TAILOR_PASSWORD env var manquante");
            const tempPassword = await bcrypt.hash(defaultPwd, 12);
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
          paymentStatus: (t as any).paymentStatus || "En attente",
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
  app.get("/api/tailors/clients", requireAuth, async (req: any, res) => {
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

  app.get("/api/tailors/client/:clientId/measurements", requireAuth, async (req: any, res) => {
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
      const limit = Math.min(parseInt(String(req.query.limit ?? "200")), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0")), 0);
      const data = await storage.getAllProjectsForAdmin(limit, offset);
      res.json(data);
    } catch (error) {
      console.error("admin all-projects error:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Admin: payments with commission breakdown
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          p.id, p.title, p.amount, p.amount_total, p.amount_artisan,
          p.payment_status, p.stripe_payment_intent_id, p.stripe_transfer_id,
          p.client_confirmed, p.created_at,
          CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
          CONCAT(tu.first_name, ' ', tu.last_name) AS tailor_name,
          cu.email AS client_email,
          tu.email AS tailor_email
        FROM projects p
        INNER JOIN users cu ON p.client_id = cu.id
        INNER JOIN tailors t ON p.tailor_id = t.id
        INNER JOIN users tu ON t.user_id = tu.id
        WHERE p.amount IS NOT NULL AND p.amount > 0
        ORDER BY p.created_at DESC
        LIMIT 500
      `) as any[];
      if (!Array.isArray(rows)) return res.json([]);
      res.json((rows as any[]).map((r: any) => {
        // amount_total et amount_artisan sont en centimes ; fallback sur amount (euros) si non renseignés
        const amountClient = r.amount_total
          ? Math.round(r.amount_total) / 100
          : parseFloat(r.amount) || 0;
        const artisanAmount = r.amount_artisan
          ? Math.round(r.amount_artisan) / 100
          : Math.round(amountClient * 0.9 * 100) / 100;
        const commission = Math.round((amountClient - artisanAmount) * 100) / 100;
        return {
          id: r.id,
          title: r.title || "—",
          client: r.client_name || "—",
          tailor: r.tailor_name || "—",
          amountClient,
          commission,
          amountArtisan: artisanAmount,
          paymentStatus: r.payment_status || "pending",
          stripePaymentIntentId: r.stripe_payment_intent_id || null,
          stripeTransferId: r.stripe_transfer_id || null,
          clientConfirmed: !!r.client_confirmed,
          createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—",
        };
      }));
    } catch (error) {
      console.error("admin payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Admin: all appointments
  app.get("/api/admin/all-appointments", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "200")), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0")), 0);
      const data = await storage.getAllAppointmentsForAdmin(limit, offset);
      res.json(data);
    } catch (error) {
      console.error("admin all-appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Admin - Measurements
  app.get("/api/admin/measures", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "200")), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0")), 0);
      const data = await storage.getAllMeasurementsForAdmin(limit, offset);
      res.json(data);
    } catch (error) {
      console.error("Error fetching admin measures:", error);
      res.status(500).json({ error: "Failed to fetch measures" });
    }
  });

  // Admin - Reviews
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "200")), 500);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0")), 0);
      const data = await storage.getAllReviewsForAdmin(limit, offset);
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

  // Admin: edit project (bypass ownership check)
  app.patch("/api/admin/projects/:id", requireAdmin, async (req, res) => {
    try {
      const { status, amount, adminNotes } = req.body;
      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (amount !== undefined) updates.amount = parseFloat(amount) || null;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
      await pool.query(
        `UPDATE projects SET ${Object.keys(updates).map(k => `\`${k.replace(/([A-Z])/g, '_$1').toLowerCase()}\` = ?`).join(", ")} WHERE id = ?`,
        [...Object.values(updates), req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("admin project edit error:", error);
      res.status(500).json({ error: "Failed to update project" });
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
      const { name, eventDate, tailorId, description, registrationDeadline, maxParticipants, pricePerPerson, priceGroup, deliveryDate, inspirationPhotos } = req.body;
      if (!name || !eventDate || !tailorId) {
        return res.status(400).json({ error: "name, eventDate et tailorId sont requis" });
      }
      // Zod validation
      const parsed = insertEventSchema.safeParse({
        name, eventDate, tailorId, organizerId: userId, inviteCode: "PLACEHOLDER", validationCode: "0000",
        description: description || undefined,
        registrationDeadline: registrationDeadline || undefined,
        status: "pending_tailor_approval",
        maxParticipants: maxParticipants || undefined,
        pricePerPerson: pricePerPerson || undefined,
        priceGroup: priceGroup || undefined,
        deliveryDate: deliveryDate || undefined,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
      }
      let inviteCode = generateInviteCode();
      const [existing] = await pool.query(`SELECT id FROM events WHERE invite_code = ?`, [inviteCode]) as any[];
      if ((existing as any[]).length > 0) inviteCode = generateInviteCode() + "X";
      // Generate a private 4-digit validation code for the organizer to share with participants
      const validationCode = String(Math.floor(1000 + Math.random() * 9000));
      const eventId = require("crypto").randomUUID();
      const photosJson = Array.isArray(inspirationPhotos) && inspirationPhotos.length > 0
        ? JSON.stringify(inspirationPhotos)
        : null;
      await pool.query(
        `INSERT INTO events (id, name, event_date, tailor_id, organizer_id, invite_code, validation_code, description, registration_deadline, status, max_participants, price_per_person, price_group, delivery_date, inspiration_photos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_tailor_approval', ?, ?, ?, ?, ?)`,
        [eventId, name, eventDate, tailorId, userId, inviteCode, validationCode, description || null, registrationDeadline || null,
         maxParticipants || null, pricePerPerson || null, priceGroup || null, deliveryDate || null, photosJson]
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
      const event = (rows as any[])[0];
      delete event.validation_code;
      res.json(event);
    } catch (error) {
      console.error("Failed to get event:", error);
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  // Join an event
  app.post("/api/events/join/:inviteCode", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { validationCode } = req.body;
      const [evRows] = await pool.query(`SELECT * FROM events WHERE invite_code = ?`, [req.params.inviteCode.toUpperCase()]) as any[];
      if (!(evRows as any[]).length) return res.status(404).json({ error: "Événement introuvable" });
      const event = (evRows as any[])[0];
      if (event.status && event.status !== 'active') {
        return res.status(403).json({ error: "Cet événement n'est pas encore ouvert aux inscriptions." });
      }
      // Validate the private code
      if (!validationCode) {
        return res.status(400).json({ error: "Code de validation requis.", needsCode: true });
      }
      if (event.validation_code && event.validation_code !== String(validationCode).trim()) {
        return res.status(403).json({ error: "Code de validation incorrect.", invalidCode: true });
      }
      // Check if already joined
      const [existing] = await pool.query(
        `SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?`, [event.id, userId]
      ) as any[];
      if ((existing as any[]).length > 0) return res.json({ alreadyJoined: true, eventId: event.id });
      // Check registration deadline
      if (event.registration_deadline) {
        const deadline = new Date(event.registration_deadline);
        deadline.setHours(23, 59, 59, 999);
        if (new Date() > deadline) {
          return res.status(403).json({ error: "Les inscriptions sont fermées — la date limite est dépassée." });
        }
      }
      // Check max participants
      if (event.max_participants) {
        const [countRows] = await pool.query(
          `SELECT COUNT(*) as cnt FROM event_participants WHERE event_id = ?`, [event.id]
        ) as any[];
        const currentCount = (countRows as any[])[0]?.cnt ?? 0;
        if (currentCount >= event.max_participants) {
          return res.status(403).json({ error: "Cet événement est complet." });
        }
      }
      // Stripe payment if pricePerPerson > 0
      if (event.price_per_person && event.price_per_person > 0 && process.env.STRIPE_SECRET_KEY) {
        const StripeLib = (await import("stripe")).default;
        const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY);
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(event.price_per_person * 100),
          currency: "eur",
          metadata: {
            eventId: event.id,
            userId,
            inviteCode: req.params.inviteCode.toUpperCase(),
          },
          description: `SEAMLiER — Événement ${event.name}`,
        });
        return res.json({ needsPayment: true, clientSecret: pi.client_secret, eventId: event.id, amount: event.price_per_person });
      }
      // Create a project linked to the event (in_progress so it appears in artisan's project list)
      const projectId = require("crypto").randomUUID();
      await pool.query(
        `INSERT INTO projects (id, tailor_id, client_id, title, status, progress, current_step, delivery_date, event_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'in_progress', 0, 'prise_mesures', ?, ?, NOW(), NOW())`,
        [projectId, event.tailor_id, userId, `[Événement] ${event.name}`, event.delivery_date || null, event.id]
      );
      // Add participant
      const participantId = require("crypto").randomUUID();
      await pool.query(
        `INSERT IGNORE INTO event_participants (id, event_id, user_id, project_id) VALUES (?, ?, ?, ?)`,
        [participantId, event.id, userId, projectId]
      );
      // Notify organizer
      sendPushNotification(event.organizer_id, `Nouveau participant pour ${event.name}`, "Un nouveau membre vient de rejoindre votre événement.", `/evenement/${event.id}`).catch(() => {});
      res.status(201).json({ success: true, eventId: event.id, projectId });
    } catch (error) {
      console.error("Failed to join event:", error);
      res.status(500).json({ error: "Failed to join event" });
    }
  });

  // Confirm payment and complete event join
  app.post("/api/events/join/:inviteCode/confirm-payment", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) return res.status(400).json({ error: "paymentIntentId requis" });
      if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe non configuré" });
      const StripeLib = (await import("stripe")).default;
      const stripe = new StripeLib(process.env.STRIPE_SECRET_KEY);
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== "succeeded") return res.status(402).json({ error: "Paiement non confirmé" });
      const eventId = pi.metadata?.eventId;
      if (!eventId) return res.status(400).json({ error: "Métadonnées manquantes" });
      const [evRows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [eventId]) as any[];
      if (!(evRows as any[]).length) return res.status(404).json({ error: "Événement introuvable" });
      const event = (evRows as any[])[0];
      // Check if already joined (idempotent)
      const [existing] = await pool.query(`SELECT id, project_id FROM event_participants WHERE event_id = ? AND user_id = ?`, [event.id, userId]) as any[];
      if ((existing as any[]).length > 0) return res.json({ alreadyJoined: true, eventId: event.id, projectId: (existing as any[])[0]?.project_id });
      const projectId = require("crypto").randomUUID();
      await pool.query(
        `INSERT INTO projects (id, tailor_id, client_id, title, status, progress, current_step, delivery_date, event_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'in_progress', 0, 'prise_mesures', ?, ?, NOW(), NOW())`,
        [projectId, event.tailor_id, userId, `[Événement] ${event.name}`, event.delivery_date || null, event.id]
      );
      const participantId = require("crypto").randomUUID();
      await pool.query(
        `INSERT IGNORE INTO event_participants (id, event_id, user_id, project_id) VALUES (?, ?, ?, ?)`,
        [participantId, event.id, userId, projectId]
      );
      // Notify organizer
      sendPushNotification(event.organizer_id, `Nouveau participant pour ${event.name}`, "Un nouveau membre vient de rejoindre votre événement.", `/evenement/${event.id}`).catch(() => {});
      res.status(201).json({ success: true, eventId: event.id, projectId });
    } catch (error) {
      console.error("Failed to confirm event payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
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
      // Parse inspiration_photos JSON
      try { event.inspiration_photos = event.inspiration_photos ? JSON.parse(event.inspiration_photos) : []; }
      catch { event.inspiration_photos = []; }
      // Only expose validation_code to organizer and tailor
      const isOrganizerOrTailor = event.organizer_id === userId || event.tailor_user_id === userId;
      if (!isOrganizerOrTailor) delete event.validation_code;
      res.json(event);
    } catch (error) {
      console.error("Failed to get event details:", error);
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  // Tailor: list events
  app.get("/api/tailors/events", requireAuth, async (req: any, res) => {
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
  // Events organized by this user (organizer_id = userId)
  app.get("/api/client/events/organized", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [rows] = await pool.query(`
        SELECT e.*,
          tu.first_name as tailor_first_name, tu.last_name as tailor_last_name,
          tu.profile_image_url as tailor_avatar,
          (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
        FROM events e
        JOIN tailors t ON t.id = e.tailor_id
        JOIN users tu ON tu.id = t.user_id
        WHERE e.organizer_id = ?
        ORDER BY e.event_date ASC
      `, [userId]) as any[];
      res.json(rows);
    } catch (error) {
      console.error("Failed to get organized events:", error);
      res.status(500).json({ error: "Failed to get organized events" });
    }
  });

  // Events the user has joined as participant
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

  // Delete event
  app.delete("/api/events/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [evRows] = await pool.query(`SELECT * FROM events WHERE id = ?`, [req.params.id]) as any[];
      if (!(evRows as any[]).length) return res.status(404).json({ error: "Événement introuvable" });
      const event = (evRows as any[])[0];
      const [userRows] = await pool.query(`SELECT role FROM users WHERE id = ?`, [userId]) as any[];
      const role = (userRows as any[])[0]?.role;
      if (event.organizer_id !== userId && role !== "admin") {
        return res.status(403).json({ error: "Non autorisé" });
      }
      await pool.query(`DELETE FROM event_participants WHERE event_id = ?`, [event.id]);
      await pool.query(`DELETE FROM events WHERE id = ?`, [event.id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete event:", error);
      res.status(500).json({ error: "Failed to delete event" });
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
        WHERE tailor_id = ? AND DATE(scheduled_at) = ? AND status IN ('scheduled','confirmed','pending')
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
  app.get("/api/tailors/:tailorId/schedule", async (req: any, res) => {
    try {
      const tailorId = req.query.tailorId as string;
      const [rows] = await pool.query('SELECT * FROM tailor_schedule WHERE tailor_id = ? ORDER BY day_of_week', [tailorId]) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post('/api/tailors/schedule', requireAuth, async (req: any, res) => {
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

  // ─── Tailor Exceptions ──────────────────────────────────────────────────────


  app.post('/api/tailors/exceptions', requireAuth, async (req: any, res) => {
    try {
      const tailor = await storage.getTailorByUserId(req.authUserId);
      if (!tailor) return res.status(403).json({ error: 'Not a tailor' });
      const { date, reason } = req.body;
      if (!date) return res.status(400).json({ error: 'date requis' });
      const newId = require('crypto').randomUUID();
      await pool.query(
        'INSERT INTO tailor_exceptions (id, tailor_id, date, reason) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)',
        [newId, tailor.id, date, reason || null]
      );
      const [rows] = await pool.query('SELECT * FROM tailor_exceptions WHERE tailor_id = ? ORDER BY date ASC', [tailor.id]) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.delete('/api/tailors/exceptions', requireAuth, async (req: any, res) => {
    try {
      const tailor = await storage.getTailorByUserId(req.authUserId);
      if (!tailor) return res.status(403).json({ error: 'Not a tailor' });
      await pool.query('DELETE FROM tailor_exceptions WHERE id = ? AND tailor_id = ?', [req.query.id, tailor.id]);
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // ─── Availability ──────────────────────────────────────────────────────────


  // ─── Closed days for a month (for calendar UI) ─────────────────────────────

  // ── Helper: create notification ───────────────────────────────────────────
  async function createNotification(userId: string, type: string, title: string, message: string) {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)",
      [id, userId, type, title, message]
    );
  }

  // ── Feature 1: Pro Dossier Routes ─────────────────────────────────────────

  app.get("/api/professionnel/dossier", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const [rows] = await pool.query(
        `SELECT * FROM tailors WHERE id = ?`,
        [tailor.id]
      ) as any[];
      const row = Array.isArray(rows) && rows[0] ? rows[0] : {};
      res.json({
        siret: row.siret || null,
        kbisUrl: row.kbis_url || null,
        kbisExpiryDate: row.kbis_expiry_date || null,
        idCardUrl: row.id_card_url || null,
        rcProUrl: row.rc_pro_url || null,
        ibanRib: row.iban_rib || null,
        dossierStatus: row.dossier_status || "pending",
        dossierRejectionReason: row.dossier_rejection_reason || null,
        insurerName: row.insurer_name || null,
        insurerPolicy: row.insurer_policy || null,
        rcProCertified: row.rc_pro_certified != null ? !!row.rc_pro_certified : null,
      });
    } catch (error) {
      console.error("Failed to fetch dossier:", error);
      res.status(500).json({ error: "Failed to fetch dossier" });
    }
  });

  app.post("/api/professionnel/dossier/upload/:docType", requireAuth, (req: any, res, next) => {
    console.log('[UPLOAD DOC] route hit', req.params.docType, 'user', req.authUserId);
    try {
      uploadDoc(req, res, async (err) => {
        if (err) {
          console.error('[UPLOAD DOC]', err);
          return res.status(400).json({ error: err.message });
        }
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      try {
        const userId = req.authUserId;
        if ((req.user as any)?.role !== "tailor") {
          return res.status(403).json({ error: "Réservé aux professionnels" });
        }
        const tailor = await storage.getTailorByUserId(userId);
        if (!tailor) return res.status(403).json({ error: "Not a tailor" });

        const { docType } = req.params;
        const fileUrl = `/uploads/docs/${req.file.filename}`;

        const validDocTypes: Record<string, string> = {
          kbis: "kbis_url",
          idCard: "id_card_url",
          rcPro: "rc_pro_url",
          ibanRib: "iban_rib",
        };

        if (!validDocTypes[docType]) {
          return res.status(400).json({ error: "Type de document invalide" });
        }

        const field = validDocTypes[docType];
        await pool.query(
          `UPDATE tailors SET ${field} = ?, dossier_status = 'pending' WHERE id = ?`,
          [fileUrl, tailor.id]
        );

        const [userRows] = await pool.query(
          "SELECT email, first_name, last_name FROM users WHERE id = ?",
          [userId]
        ) as any[];
        const userRow = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
        if (userRow) {
          const userName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ") || userRow.email;
          sendDossierReceivedEmail(userRow.email, userName).catch(err =>
            console.error("[Dossier received email] Failed:", err)
          );
          sendAdminDocUploadNotif(userName, docType, fileUrl).catch((adminErr) =>
            console.error("[Admin doc notif email] Failed:", adminErr)
          );
        }

        res.json({ url: fileUrl });
      } catch (error) {
        console.error("Failed to upload document:", error);
        res.status(500).json({ error: "Failed to upload document" });
      }
    });
    } catch (syncErr) {
      next(syncErr);
    }
  });

    app.delete("/api/professionnel/dossier/document/:docType", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      if ((req.user as any)?.role !== "tailor") {
        return res.status(403).json({ error: "Réservé aux professionnels" });
      }
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const { docType } = req.params;
      const validDocTypes: Record<string, string> = {
        kbis: "kbis_url",
        idCard: "id_card_url",
        rcPro: "rc_pro_url",
        ibanRib: "iban_rib",
      };
      if (!validDocTypes[docType]) {
        return res.status(400).json({ error: "Type de document invalide" });
      }

      const field = validDocTypes[docType];
      await pool.query(
        `UPDATE tailors SET ${field} = NULL WHERE id = ?`,
        [tailor.id]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.patch("/api/professionnel/dossier", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      if ((req.user as any)?.role !== "tailor") {
        return res.status(403).json({ error: "Réservé aux professionnels" });
      }
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const { siret, iban, insurerName, insurerPolicy, rcProCertified } = req.body;

      if (!siret || !/^\d{14}$/.test(siret.replace(/\s/g, ""))) {
        return res.status(400).json({ error: "SIRET invalide (14 chiffres requis)" });
      }
      if (!iban || !iban.trim()) {
        return res.status(400).json({ error: "IBAN requis" });
      }

      const siretClean = siret.replace(/\s/g, "");

      await pool.query(
        `UPDATE tailors SET siret = ?, iban_rib = ?, insurer_name = ?, insurer_policy = ?, rc_pro_certified = ?, dossier_status = 'pending' WHERE id = ?`,
        [siretClean, iban.trim(), insurerName || null, insurerPolicy || null, rcProCertified ? 1 : 0, tailor.id]
      );

      // Notify admin
      const [userRows] = await pool.query(
        "SELECT email, first_name, last_name FROM users WHERE id = ?",
        [userId]
      ) as any[];
      const userRow = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
      if (userRow) {
        const userName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ") || userRow.email;
        sendAdminProInfoEmail(userName, siretClean, iban.trim(), insurerName, insurerPolicy, !!rcProCertified)
          .catch(err => console.error("[Pro info email] Failed:", err));
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update pro info:", {
        message: error?.message,
        code: error?.code,
        sqlMessage: error?.sqlMessage,
        errno: error?.errno,
        stack: error?.stack?.split("\n").slice(0, 4).join("\n"),
      });
      res.status(500).json({ error: "Erreur lors de la sauvegarde", detail: error?.message });
    }
  });


  // ── Pro Info (déclaration professionnelle) ─────────────────────────────────

  app.get("/api/professionnel/pro-info", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });
      const [rows] = await pool.query(
        "SELECT * FROM pro_info WHERE tailor_id = ?",
        [tailor.id]
      ) as any[];
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return res.json(null);
      res.json({
        id: row.id,
        siret: row.siret || null,
        iban: row.iban || null,
        insurerName: row.insurer_name || null,
        insurerPolicy: row.insurer_policy || null,
        rcProCertified: row.rc_pro_certified != null ? !!row.rc_pro_certified : null,
        status: row.status || "pending",
      });
    } catch (error: any) {
      console.error("[GET pro-info] error:", error?.message);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/professionnel/pro-info", requireAuth, async (req: any, res) => {
    console.log("[POST /api/professionnel/pro-info] hit — user:", (req as any).authUserId);
    try {
      const userId = req.authUserId;
      if ((req.user as any)?.role !== "tailor") {
        return res.status(403).json({ error: "Réservé aux professionnels" });
      }
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Not a tailor" });

      const { siret, iban, insurerName, insurerPolicy, rcProCertified } = req.body;
      console.log("[POST pro-info] body:", { siret, iban: iban ? "***" : null, insurerName, rcProCertified });

      if (!siret || !/^\d{14}$/.test(siret.replace(/\s/g, ""))) {
        return res.status(400).json({ error: "SIRET invalide (14 chiffres requis)" });
      }
      if (!iban || !iban.trim()) {
        return res.status(400).json({ error: "IBAN requis" });
      }

      const siretClean = siret.replace(/\s/g, "");

      await pool.query(
        `INSERT INTO pro_info (tailor_id, siret, iban, insurer_name, insurer_policy, rc_pro_certified, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
         ON DUPLICATE KEY UPDATE
           siret = VALUES(siret),
           iban = VALUES(iban),
           insurer_name = VALUES(insurer_name),
           insurer_policy = VALUES(insurer_policy),
           rc_pro_certified = VALUES(rc_pro_certified),
           status = 'pending',
           updated_at = NOW()`,
        [tailor.id, siretClean, iban.trim(), insurerName || null, insurerPolicy || null, rcProCertified ? 1 : 0]
      );

      const [userRows] = await pool.query(
        "SELECT email, first_name, last_name FROM users WHERE id = ?",
        [userId]
      ) as any[];
      const userRow = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
      if (userRow) {
        const userName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ") || userRow.email;
        sendAdminProInfoEmail(userName, siretClean, iban.trim(), insurerName, insurerPolicy, !!rcProCertified)
          .catch((err: any) => console.error("[Pro info email] Failed:", err));
      }

      console.log("[POST pro-info] success — tailor:", tailor.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[POST pro-info] error:", {
        message: error?.message,
        code: error?.code,
        sqlMessage: error?.sqlMessage,
        errno: error?.errno,
      });
      res.status(500).json({ error: "Erreur lors de l'enregistrement", detail: error?.message });
    }
  });

  app.get("/api/admin/pro-info", requireAuth, async (req: any, res) => {
    try {
      if ((req.user as any)?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }
      const [rows] = await pool.query(`
        SELECT pi.id, pi.siret, pi.iban, pi.insurer_name, pi.insurer_policy,
               pi.rc_pro_certified, pi.status, pi.created_at, pi.updated_at,
               u.email, u.first_name, u.last_name, t.shop_name, t.id AS tailor_id
        FROM pro_info pi
        JOIN tailors t ON t.id = pi.tailor_id
        JOIN users u ON u.id = t.user_id
        ORDER BY pi.updated_at DESC
      `) as any[];
      res.json(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
      console.error("[GET admin/pro-info] error:", error?.message);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.patch("/api/admin/pro-info/:id", requireAuth, async (req: any, res) => {
    try {
      if ((req.user as any)?.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }
      const { id } = req.params;
      const { status } = req.body;
      if (!["pending", "validated", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
      }
      await pool.query(
        "UPDATE pro_info SET status = ?, updated_at = NOW() WHERE id = ?",
        [status, id]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("[PATCH admin/pro-info] error:", error?.message);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

// ── Notifications ──────────────────────────────────────────────────────────

  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const [rows] = await pool.query(
        `SELECT id, user_id, type, title, message, is_read, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY is_read ASC, created_at DESC
         LIMIT 50`,
        [userId]
      ) as any[];
      const notifs = Array.isArray(rows) ? rows : [];
      res.json(notifs.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: !!n.is_read,
        createdAt: n.created_at,
      })));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      await pool.query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
        [req.params.id, userId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      await pool.query(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
        [userId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // ── Feature 2: Admin Dossier Validation ───────────────────────────────────

  app.get("/api/admin/dossiers", requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT t.id, t.siret, t.kbis_url, t.kbis_expiry_date, t.id_card_url,
                t.rc_pro_url, t.iban_rib, t.dossier_status, t.dossier_rejection_reason,
                u.email, u.first_name, u.last_name, u.phone
         FROM tailors t
         INNER JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC`
      ) as any[];
      const tailorList = Array.isArray(rows) ? rows : [];
      res.json(tailorList.map((t: any) => ({
        id: t.id,
        siret: t.siret,
        kbisUrl: t.kbis_url,
        kbisExpiryDate: t.kbis_expiry_date,
        idCardUrl: t.id_card_url,
        rcProUrl: t.rc_pro_url,
        ibanRib: t.iban_rib,
        dossierStatus: t.dossier_status || "pending",
        dossierRejectionReason: t.dossier_rejection_reason,
        email: t.email,
        firstName: t.first_name,
        lastName: t.last_name,
        phone: t.phone,
      })));
    } catch (error) {
      console.error("Failed to fetch dossiers:", error);
      res.status(500).json({ error: "Failed to fetch dossiers" });
    }
  });

  app.patch("/api/admin/dossiers/:tailorId", requireAdmin, async (req, res) => {
    try {
      const { tailorId } = req.params;
      const { siret, kbisExpiryDate, action, rejectionReason } = req.body;

      const [tailorRows] = await pool.query(
        "SELECT t.id, t.user_id FROM tailors t WHERE t.id = ?",
        [tailorId]
      ) as any[];
      const tailorRow = Array.isArray(tailorRows) && tailorRows[0] ? tailorRows[0] : null;
      if (!tailorRow) return res.status(404).json({ error: "Tailor not found" });

      const [userRows] = await pool.query(
        "SELECT id, email, first_name, last_name, phone FROM users WHERE id = ?",
        [tailorRow.user_id]
      ) as any[];
      const userRow = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
      if (!userRow) return res.status(404).json({ error: "User not found" });

      const userName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ") || userRow.email;

      if (action === "validate") {
        if (siret && kbisExpiryDate) {
          await pool.query(
            "UPDATE tailors SET dossier_status = 'validated', siret = ?, kbis_expiry_date = ?, is_verified = 1 WHERE id = ?",
            [siret, kbisExpiryDate, tailorId]
          );
        } else if (siret) {
          await pool.query(
            "UPDATE tailors SET dossier_status = 'validated', siret = ?, is_verified = 1 WHERE id = ?",
            [siret, tailorId]
          );
        } else if (kbisExpiryDate) {
          await pool.query(
            "UPDATE tailors SET dossier_status = 'validated', kbis_expiry_date = ?, is_verified = 1 WHERE id = ?",
            [kbisExpiryDate, tailorId]
          );
        } else {
          await pool.query(
            "UPDATE tailors SET dossier_status = 'validated', is_verified = 1 WHERE id = ?",
            [tailorId]
          );
        }

        // Bug #2 fix: effacer toute raison de rejet précédente lors d'une validation
        await pool.query(
          "UPDATE tailors SET dossier_rejection_reason = NULL WHERE id = ?",
          [tailorId]
        );

        // Bug #3 fix: logger si l'envoi échoue
        const emailValidated = await sendDossierValidatedEmail(userRow.email, userName);
        if (!emailValidated) console.error(`[DOSSIER] Email validation non envoyé à ${userRow.email}`);

        await createNotification(
          tailorRow.user_id,
          "dossier_validated",
          "Dossier validé",
          "Votre dossier professionnel a été validé par SEAMLIER."
        );

        if (userRow.phone) {
          const smsValidated = await sendSms(userRow.phone, `SEAMLIER : Votre dossier professionnel a été validé. Félicitations ${userName} !`);
          if (!smsValidated) console.error(`[DOSSIER] SMS validation non envoyé à ${userRow.phone}`);
        }
      } else if (action === "reject") {
        // Bug #1 fix: réinitialiser is_verified lors d'un rejet
        await pool.query(
          "UPDATE tailors SET dossier_status = 'rejected', dossier_rejection_reason = ?, is_verified = 0 WHERE id = ?",
          [rejectionReason || null, tailorId]
        );

        // Bug #3 fix: logger si l'envoi échoue
        const emailRejected = await sendDossierRejectedEmail(userRow.email, userName, rejectionReason || "");
        if (!emailRejected) console.error(`[DOSSIER] Email rejet non envoyé à ${userRow.email}`);

        await createNotification(
          tailorRow.user_id,
          "dossier_rejected",
          "Dossier à compléter",
          `Votre dossier n'a pas pu être validé : ${rejectionReason || "Documents manquants ou illisibles."}`
        );

        if (userRow.phone) {
          const smsRejected = await sendSms(userRow.phone, `SEAMLIER : Votre dossier requiert des corrections. Connectez-vous pour plus d'informations.`);
          if (!smsRejected) console.error(`[DOSSIER] SMS rejet non envoyé à ${userRow.phone}`);
        }
      } else {
        return res.status(400).json({ error: "Action invalide. Utilisez 'validate' ou 'reject'." });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update dossier:", error);
      res.status(500).json({ error: "Failed to update dossier" });
    }
  });

  // ── Litiges ────────────────────────────────────────────────────────────────

  app.post("/api/disputes", requireAuth, async (req: any, res) => {
    try {
      const clientId = req.authUserId;
      const { projectId, reason } = req.body;
      if (!projectId || !reason?.trim()) {
        return res.status(400).json({ error: "projectId et reason requis" });
      }
      const [projectRows] = await pool.query(
        "SELECT id, client_id FROM projects WHERE id = ?",
        [projectId]
      ) as any[];
      const project = Array.isArray(projectRows) && projectRows[0] ? projectRows[0] : null;
      if (!project) return res.status(404).json({ error: "Projet introuvable" });
      if (project.client_id !== clientId) return res.status(403).json({ error: "Non autorisé" });

      const [existing] = await pool.query(
        "SELECT id FROM disputes WHERE project_id = ? AND client_id = ? AND status = 'open'",
        [projectId, clientId]
      ) as any[];
      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(409).json({ error: "Un litige est déjà ouvert pour ce projet" });
      }

      const id = crypto.randomUUID();
      await pool.query(
        "INSERT INTO disputes (id, project_id, client_id, reason, status) VALUES (?, ?, ?, ?, 'open')",
        [id, projectId, clientId, reason.trim()]
      );
      await createNotification(
        clientId,
        "dispute_opened",
        "Litige signalé",
        "Votre signalement a bien été enregistré. L'équipe SEAMLIER vous répondra sous 48h."
      );
      res.status(201).json({ id });
    } catch (error) {
      console.error("Failed to open dispute:", error);
      res.status(500).json({ error: "Failed to open dispute" });
    }
  });

  app.get("/api/admin/disputes", requireAdmin, async (_req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT d.id, d.project_id, d.reason, d.status, d.admin_note,
               d.stripe_refund_id, d.created_at, d.resolved_at,
               p.title AS project_title, p.stripe_payment_intent_id, p.amount_total,
               u.email AS client_email, u.first_name AS client_first, u.last_name AS client_last,
               tu.email AS tailor_email, tu.first_name AS tailor_first, tu.last_name AS tailor_last
        FROM disputes d
        JOIN projects p ON p.id = d.project_id
        JOIN users u ON u.id = d.client_id
        LEFT JOIN tailors t ON t.id = p.tailor_id
        LEFT JOIN users tu ON tu.id = t.user_id
        ORDER BY d.created_at DESC
        LIMIT 200
      `) as any[];
      const disputes = (Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        projectTitle: r.project_title || "—",
        reason: r.reason,
        status: r.status,
        adminNote: r.admin_note || null,
        stripeRefundId: r.stripe_refund_id || null,
        amountTotal: r.amount_total,
        stripePaymentIntentId: r.stripe_payment_intent_id || null,
        clientEmail: r.client_email,
        clientName: [r.client_first, r.client_last].filter(Boolean).join(" ") || r.client_email,
        tailorEmail: r.tailor_email || null,
        tailorName: [r.tailor_first, r.tailor_last].filter(Boolean).join(" ") || r.tailor_email || "—",
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—",
        resolvedAt: r.resolved_at ? new Date(r.resolved_at).toLocaleDateString("fr-FR") : null,
      }));
      res.json(disputes);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  app.patch("/api/admin/disputes/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { action, adminNote, refundAmount } = req.body;
      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Action invalide. Utilisez 'approve' ou 'reject'." });
      }

      const [disputeRows] = await pool.query(
        "SELECT d.*, p.stripe_payment_intent_id, p.amount_total, u.email, u.first_name, u.last_name FROM disputes d JOIN projects p ON p.id = d.project_id JOIN users u ON u.id = d.client_id WHERE d.id = ?",
        [id]
      ) as any[];
      const dispute = Array.isArray(disputeRows) && disputeRows[0] ? disputeRows[0] : null;
      if (!dispute) return res.status(404).json({ error: "Litige introuvable" });
      if (dispute.status !== "open") return res.status(409).json({ error: "Ce litige est déjà résolu" });

      let stripeRefundId: string | null = null;

      if (action === "approve" && dispute.stripe_payment_intent_id) {
        try {
          const stripe = process.env.STRIPE_SECRET_KEY
            ? new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any })
            : null;
          if (stripe) {
            const amountCents = refundAmount
              ? Math.round(refundAmount * 100)
              : (dispute.amount_total ?? undefined);
            const refund = await stripe.refunds.create({
              payment_intent: dispute.stripe_payment_intent_id,
              ...(amountCents ? { amount: amountCents } : {}),
            });
            stripeRefundId = refund.id;
          }
        } catch (stripeErr) {
          console.error("[Dispute] Stripe refund failed:", stripeErr);
        }
      }

      await pool.query(
        `UPDATE disputes SET status = ?, admin_note = ?, stripe_refund_id = ?, resolved_at = NOW() WHERE id = ?`,
        [action === "approve" ? "approved" : "rejected", adminNote || null, stripeRefundId, id]
      );

      const clientName = [dispute.first_name, dispute.last_name].filter(Boolean).join(" ") || dispute.email;
      if (action === "approve") {
        await createNotification(
          dispute.client_id,
          "dispute_approved",
          "Litige résolu — Remboursement en cours",
          `Votre litige a été approuvé. ${stripeRefundId ? "Le remboursement a été initié." : "Notre équipe vous contactera pour le remboursement."}`
        );
      } else {
        await createNotification(
          dispute.client_id,
          "dispute_rejected",
          "Litige clôturé",
          adminNote || "Votre litige a été examiné et clôturé par notre équipe."
        );
      }

      res.json({ success: true, stripeRefundId });
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  // ── Feature 6: RGPD Routes ─────────────────────────────────────────────────

  app.get("/api/user/export-data", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;

      const [userRows] = await pool.query(
        "SELECT id, email, first_name, last_name, phone, role, location, created_at FROM users WHERE id = ?",
        [userId]
      ) as any[];
      const user = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;

      const [measureRows] = await pool.query(
        "SELECT * FROM measurements WHERE user_id = ?",
        [userId]
      ) as any[];

      const [projectRows] = await pool.query(
        `SELECT id, title, description, clothing_type, status, current_step, created_at, updated_at
         FROM projects WHERE client_id = ?`,
        [userId]
      ) as any[];

      const [appointmentRows] = await pool.query(
        "SELECT id, type, scheduled_at, status, notes FROM appointments WHERE client_id = ?",
        [userId]
      ) as any[];

      const [reviewRows] = await pool.query(
        "SELECT id, rating, comment, created_at FROM reviews WHERE user_id = ?",
        [userId]
      ) as any[];

      const [convRows] = await pool.query(
        `SELECT c.id, c.last_message_preview, c.last_message_at
         FROM conversations c
         WHERE c.participant1_id = ? OR c.participant2_id = ?`,
        [userId, userId]
      ) as any[];

      const convIds = (Array.isArray(convRows) ? convRows : []).map((c: any) => c.id);
      let messageRows: any[] = [];
      if (convIds.length > 0) {
        const placeholders = convIds.map(() => "?").join(",");
        const [msgRows] = await pool.query(
          `SELECT id, content, sent_at FROM messages WHERE sender_id = ? AND conversation_id IN (${placeholders})`,
          [userId, ...convIds]
        ) as any[];
        messageRows = Array.isArray(msgRows) ? msgRows : [];
      }

      res.json({
        exportedAt: new Date().toISOString(),
        user,
        measurements: Array.isArray(measureRows) ? measureRows : [],
        projects: Array.isArray(projectRows) ? projectRows : [],
        appointments: Array.isArray(appointmentRows) ? appointmentRows : [],
        reviews: Array.isArray(reviewRows) ? reviewRows : [],
        messages: messageRows,
      });
    } catch (error) {
      console.error("Failed to export user data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.delete("/api/user/account", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;

      await pool.query(
        `UPDATE users SET
          email = CONCAT('deleted_', SUBSTRING(id, 1, 8), '@seamlier.fr'),
          first_name = 'Utilisateur',
          last_name = 'Supprimé',
          phone = NULL,
          profile_image_url = NULL,
          password = '<anonymized>'
         WHERE id = ?`,
        [userId]
      );

      await pool.query(
        "DELETE FROM user_preferences WHERE user_id = ?",
        [userId]
      );

      // Destroy session
      if (req.session) {
        req.session.destroy(() => {});
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // ── Vue artisan : litiges sur ses projets ─────────────────────────────────
  app.get("/api/tailors/disputes", requireAuth, async (req: any, res) => {
    try {
      const userId = req.authUserId;
      const tailor = await storage.getTailorByUserId(userId);
      if (!tailor) return res.status(403).json({ error: "Réservé aux artisans" });
      const [rows] = await pool.query(`
        SELECT d.id, d.project_id, d.reason, d.status, d.admin_note,
               d.created_at, d.resolved_at,
               p.title AS project_title,
               u.email AS client_email, u.first_name AS client_first, u.last_name AS client_last
        FROM disputes d
        JOIN projects p ON p.id = d.project_id AND p.tailor_id = ?
        JOIN users u ON u.id = d.client_id
        ORDER BY d.created_at DESC
        LIMIT 50
      `, [tailor.id]) as any[];
      res.json((Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        projectTitle: r.project_title || "—",
        reason: r.reason,
        status: r.status,
        adminNote: r.admin_note || null,
        clientName: [r.client_first, r.client_last].filter(Boolean).join(" ") || r.client_email,
        clientEmail: r.client_email,
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—",
        resolvedAt: r.resolved_at ? new Date(r.resolved_at).toLocaleDateString("fr-FR") : null,
      })));
    } catch (err) {
      console.error("tailors/disputes error:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  return httpServer;
}

function renderVerificationPage(success: boolean, message: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vérification Email - SEAMLIER</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#faf9f7;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;border-radius:16px;padding:48px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{width:64px;height:64px;border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:28px}.success{background:#dcfce7;color:#16a34a}.error{background:#fee2e2;color:#dc2626}h1{font-family:'Playfair Display',serif;color:#722F37;font-size:24px;margin-bottom:12px}p{color:#6b7280;line-height:1.6;margin-bottom:24px}a{display:inline-block;background:#722F37;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;transition:background .2s}a:hover{background:#5a252c}</style></head><body><div class="card"><div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div><h1>${success ? 'Email vérifié !' : 'Erreur de vérification'}</h1><p>${message}</p><a href="/connexion">Se connecter</a></div></body></html>`;
}
}
// Dim 17 mai 2026 22:33:19 CEST
