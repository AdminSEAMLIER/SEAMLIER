import { db, pool } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { 
  users, tailors, portfolioItems, products, reviews, 
  conversations, messages, measurements, projects, appointments,
  adminArtisans, adminSettings, userPreferences, magazineArticles,
  type User, type InsertUser,
  type Tailor, type InsertTailor,
  type PortfolioItem, type InsertPortfolioItem,
  type Product, type InsertProduct,
  type Review, type InsertReview,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Measurements, type InsertMeasurements,
  type Project, type InsertProject,
  type Appointment, type InsertAppointment,
  type AdminArtisan, type InsertAdminArtisan,
  type AdminSetting, type InsertAdminSetting,
  type UserPreferences, type InsertUserPreferences,
  type MagazineArticle, type InsertMagazineArticle,
  type TailorWithUser,
  type PortfolioWithTailor,
  type ProductWithTailor,
  type ReviewWithUser,
  type ConversationWithParticipant,
  type MessageWithSender,
  type ProjectWithClient,
  type ProjectWithTailor,
  type AppointmentWithClient
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  getTailors(): Promise<TailorWithUser[]>;
  getTailor(id: string): Promise<TailorWithUser | undefined>;
  getTailorByUserId(userId: string): Promise<Tailor | undefined>;
  createTailor(tailor: InsertTailor): Promise<Tailor>;
  updateTailor(id: string, updates: Partial<InsertTailor>): Promise<Tailor | undefined>;

  getPortfolioItems(): Promise<PortfolioWithTailor[]>;
  getPortfolioItemsByTailor(tailorId: string): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  deletePortfolioItem(id: string): Promise<void>;

  getProducts(): Promise<ProductWithTailor[]>;
  getProductsByTailor(tailorId: string): Promise<Product[]>;
  getProduct(id: string): Promise<ProductWithTailor | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  getReviewsByTailor(tailorId: string): Promise<ReviewWithUser[]>;
  createReview(review: InsertReview): Promise<Review>;

  getConversations(userId: string): Promise<ConversationWithParticipant[]>;
  getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation>;
  getMessages(conversationId: string): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  markAllMessagesAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;

  getMeasurements(userId: string): Promise<Measurements | undefined>;
  upsertMeasurements(measurements: InsertMeasurements): Promise<Measurements>;

  getProjectsByTailor(tailorId: string): Promise<ProjectWithClient[]>;
  getProjectsByClient(clientId: string): Promise<ProjectWithTailor[]>;
  getProject(id: string): Promise<ProjectWithClient | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;

  getAppointmentsByTailor(tailorId: string): Promise<AppointmentWithClient[]>;
  getAppointmentsByClient(clientId: string): Promise<AppointmentWithClient[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<void>;

  getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'createdAt' | 'emailVerified'>[]>;
  getAdminUser(): Promise<Pick<User, 'id'> | undefined>;
  deleteUnverifiedUsers(): Promise<number>;
  deleteUser(id: string): Promise<void>;

  getAdminArtisans(): Promise<AdminArtisan[]>;
  getRegisteredTailors(): Promise<any[]>;
  getAdminArtisan(id: string): Promise<AdminArtisan | undefined>;
  createAdminArtisan(artisan: InsertAdminArtisan): Promise<AdminArtisan>;
  updateAdminArtisan(id: string, updates: Partial<InsertAdminArtisan>): Promise<AdminArtisan | undefined>;
  deleteAdminArtisan(id: string): Promise<void>;

  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  getMagazineArticles(publishedOnly?: boolean): Promise<MagazineArticle[]>;
  getMagazineArticle(id: string): Promise<MagazineArticle | undefined>;
  incrementArticleViews(id: string): Promise<void>;
  createMagazineArticle(article: InsertMagazineArticle): Promise<MagazineArticle>;
  updateMagazineArticle(id: string, updates: Partial<InsertMagazineArticle>): Promise<MagazineArticle | undefined>;
  deleteMagazineArticle(id: string): Promise<void>;
  deleteAllConversations(): Promise<void>;

  getAdminSettings(): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  upsertAdminSetting(key: string, value: string): Promise<AdminSetting>;

  getAllProjectsForAdmin(): Promise<any[]>;
  getAllAppointmentsForAdmin(): Promise<any[]>;
  getMeasurementsByUserId(userId: string): Promise<Measurements | undefined>;
  getAllMeasurementsForAdmin(): Promise<any[]>;
  getAllReviewsForAdmin(): Promise<any[]>;
  deleteReview(id: string): Promise<void>;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function parseTailorSpecialties<T extends Record<string, any>>(tailor: T): T {
  if (!tailor) return tailor;
  if (typeof tailor.specialties === 'string') {
    try { tailor.specialties = JSON.parse(tailor.specialties); } catch { tailor.specialties = []; }
  }
  if (!Array.isArray(tailor.specialties)) tailor.specialties = [];
  return tailor;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      if (!result || result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("getUser error:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      if (!result || result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("getUserByEmail error:", error);
      return undefined;
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.verificationToken, token));
      if (!result || result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("getUserByVerificationToken error:", error);
      return undefined;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1",
        [token]
      ) as any[];
      if (!rows || rows.length === 0) return undefined;
      const r = rows[0];
      return { ...r, emailVerified: !!r.email_verified, firstName: r.first_name, lastName: r.last_name, profileImageUrl: r.profile_image_url, verificationToken: r.verification_token, verificationExpires: r.verification_expires, resetToken: r.reset_token, resetTokenExpires: r.reset_token_expires, createdAt: r.created_at, updatedAt: r.updated_at } as User;
    } catch (error) {
      console.error("getUserByResetToken error:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = generateUUID();
    await db.insert(users).values({ ...user, id });
    const created = await this.getUser(id);
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id));
    return this.getUser(id);
  }

  async getTailors(): Promise<TailorWithUser[]> {
    try {
      const result = await db.select()
        .from(tailors)
        .innerJoin(users, eq(tailors.userId, users.id))
        .where(eq(tailors.isVerified, true));

      if (!result || !Array.isArray(result)) return [];

      return result.map(row => parseTailorSpecialties({ ...row.tailors, user: row.users }));
    } catch (error) {
      console.error("getTailors error:", error);
      return [];
    }
  }

  async getTailor(id: string): Promise<TailorWithUser | undefined> {
    const result = await db.select()
      .from(tailors)
      .innerJoin(users, eq(tailors.userId, users.id))
      .where(eq(tailors.id, id));

    if (!result || result.length === 0) return undefined;
    return parseTailorSpecialties({ ...result[0].tailors, user: result[0].users });
  }

  async getTailorByUserId(userId: string): Promise<Tailor | undefined> {
    const result = await db.select().from(tailors).where(eq(tailors.userId, userId));
    return result[0] ? parseTailorSpecialties(result[0]) : undefined;
  }

  async createTailor(tailor: InsertTailor): Promise<Tailor> {
    const id = generateUUID();
    await db.insert(tailors).values({ ...tailor, id } as any);
    const result = await db.select().from(tailors).where(eq(tailors.id, id));
    return parseTailorSpecialties(result[0]);
  }

  async updateTailor(id: string, updates: Partial<InsertTailor>): Promise<Tailor | undefined> {
    await db.update(tailors)
      .set(updates as any)
      .where(eq(tailors.id, id));
    const result = await db.select().from(tailors).where(eq(tailors.id, id));
    return result[0] ? parseTailorSpecialties(result[0]) : undefined;
  }

  async getPortfolioItems(): Promise<PortfolioWithTailor[]> {
    try {
      const result = await db.select()
        .from(portfolioItems)
        .innerJoin(tailors, eq(portfolioItems.tailorId, tailors.id))
        .innerJoin(users, eq(tailors.userId, users.id))
        .orderBy(desc(portfolioItems.createdAt));

      if (!result || !Array.isArray(result)) return [];

      return result.map(row => ({
        ...row.portfolio_items,
        tailor: parseTailorSpecialties({ ...row.tailors, user: row.users })
      }));
    } catch (error) {
      console.error("getPortfolioItems error:", error);
      return [];
    }
  }

  async getPortfolioItemsByTailor(tailorId: string): Promise<PortfolioItem[]> {
    return await db.select()
      .from(portfolioItems)
      .where(eq(portfolioItems.tailorId, tailorId))
      .orderBy(desc(portfolioItems.createdAt));
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const id = generateUUID();
    await db.insert(portfolioItems).values({ ...item, id });
    const result = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id));
    return result[0];
  }

  async deletePortfolioItem(id: string): Promise<void> {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
  }

  async getProducts(): Promise<ProductWithTailor[]> {
    try {
      const result = await db.select()
        .from(products)
        .innerJoin(tailors, eq(products.tailorId, tailors.id))
        .innerJoin(users, eq(tailors.userId, users.id));

      if (!result || !Array.isArray(result)) return [];

      return result.map(row => ({
        ...row.products,
        tailor: parseTailorSpecialties({ ...row.tailors, user: row.users })
      }));
    } catch (error) {
      console.error("getProducts error:", error);
      return [];
    }
  }

  async getProductsByTailor(tailorId: string): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(eq(products.tailorId, tailorId));
  }

  async getProduct(id: string): Promise<ProductWithTailor | undefined> {
    const result = await db.select()
      .from(products)
      .innerJoin(tailors, eq(products.tailorId, tailors.id))
      .innerJoin(users, eq(tailors.userId, users.id))
      .where(eq(products.id, id));

    if (!result || result.length === 0) return undefined;
    return { ...result[0].products, tailor: parseTailorSpecialties({ ...result[0].tailors, user: result[0].users }) };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = generateUUID();
    await db.insert(products).values({ ...product, id });
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getReviewsByTailor(tailorId: string): Promise<ReviewWithUser[]> {
    const result = await db.select()
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.tailorId, tailorId))
      .orderBy(desc(reviews.createdAt));

    if (!result || !Array.isArray(result)) return [];

    return result.map(row => ({
      ...row.reviews,
      user: row.users
    }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = generateUUID();
    await db.insert(reviews).values({ ...review, id });
    const allReviews = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.tailorId, review.tailorId));
    const avg = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
    await db.update(tailors).set({ rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length }).where(eq(tailors.id, review.tailorId));
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result[0];
  }

  async getConversations(userId: string): Promise<ConversationWithParticipant[]> {
    const [rows] = await pool.query(
      `SELECT 
        c.id, c.participant1_id as participant1Id, c.participant2_id as participant2Id,
        c.last_message_at as lastMessageAt, c.last_message_preview as lastMessagePreview,
        c.created_at as createdAt,
        u.id as u_id, u.first_name as u_firstName, u.last_name as u_lastName,
        u.email as u_email, u.role as u_role, u.profile_image_url as u_profileImageUrl,
        t.id as t_tailorId,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id COLLATE utf8mb4_unicode_ci = c.id COLLATE utf8mb4_unicode_ci
           AND m.is_read = 0 
           AND m.sender_id COLLATE utf8mb4_unicode_ci != ? COLLATE utf8mb4_unicode_ci
        ) as unreadCount
       FROM conversations c
       LEFT JOIN users u ON (
         CASE WHEN c.participant1_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
              THEN c.participant2_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
              ELSE c.participant1_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
         END
       )
       LEFT JOIN tailors t ON t.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
       WHERE c.participant1_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
          OR c.participant2_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId]
    ) as any[];

    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((row: any) => ({
      id: row.id,
      participant1Id: row.participant1Id,
      participant2Id: row.participant2Id,
      lastMessageAt: row.lastMessageAt,
      lastMessagePreview: row.lastMessagePreview,
      createdAt: row.createdAt,
      otherParticipant: row.u_id ? {
        id: row.u_id,
        firstName: row.u_firstName,
        lastName: row.u_lastName,
        email: row.u_email,
        role: row.u_role,
        profileImageUrl: row.u_profileImageUrl,
      } : undefined,
      otherParticipantTailorId: row.t_tailorId || null,
      unreadCount: Number(row.unreadCount) || 0,
    }));
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    const existing = await db.select()
      .from(conversations)
      .where(or(
        and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
        and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
      ));

    if (existing.length > 0) return existing[0];

    const id = generateUUID();
    await db.insert(conversations).values({ participant1Id, participant2Id, id });
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const [rows] = await pool.query(
      `SELECT m.id, m.conversation_id as conversationId, m.sender_id as senderId,
              m.content, m.sent_at as sentAt, m.is_read as isRead,
              u.id as u_id, u.first_name as u_firstName, u.last_name as u_lastName,
              u.email as u_email, u.role as u_role, u.profile_image_url as u_profileImageUrl
       FROM messages m
       LEFT JOIN users u ON m.sender_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
       WHERE m.conversation_id = ?
       ORDER BY m.sent_at ASC`,
      [conversationId]
    ) as any[];

    console.log(`[getMessages] conversationId=${conversationId} → ${rows?.length ?? 0} rows`);

    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((row: any) => ({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: row.content,
      sentAt: row.sentAt,
      isRead: !!row.isRead,
      sender: row.u_id ? {
        id: row.u_id,
        firstName: row.u_firstName,
        lastName: row.u_lastName,
        email: row.u_email,
        role: row.u_role,
        profileImageUrl: row.u_profileImageUrl,
      } : null
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = generateUUID();
    console.log(`[createMessage] conversationId=${message.conversationId} senderId=${message.senderId}`);
    await db.insert(messages).values({ ...message, id });

    await db.update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        lastMessagePreview: message.content.substring(0, 100)
      })
      .where(eq(conversations.id, message.conversationId));

    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [conversationId, userId]
    );
  }

  async markAllMessagesAsRead(userId: string): Promise<void> {
    await pool.query(
      `UPDATE messages m
       JOIN conversations c ON m.conversation_id COLLATE utf8mb4_unicode_ci = c.id COLLATE utf8mb4_unicode_ci
       SET m.is_read = 1
       WHERE (c.participant1_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
           OR c.participant2_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci)
         AND m.sender_id COLLATE utf8mb4_unicode_ci != ? COLLATE utf8mb4_unicode_ci
         AND m.is_read = 0`,
      [userId, userId, userId]
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM messages m
       JOIN conversations c ON m.conversation_id COLLATE utf8mb4_unicode_ci = c.id COLLATE utf8mb4_unicode_ci
       WHERE (c.participant1_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
           OR c.participant2_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci)
         AND m.sender_id COLLATE utf8mb4_unicode_ci != ? COLLATE utf8mb4_unicode_ci
         AND m.is_read = 0`,
      [userId, userId, userId]
    ) as any[];
    return Number(rows[0]?.count) || 0;
  }

  async getMeasurements(userId: string): Promise<Measurements | undefined> {
    const result = await db.select()
      .from(measurements)
      .where(eq(measurements.userId, userId));
    return result[0];
  }

  async upsertMeasurements(data: InsertMeasurements): Promise<Measurements> {
    try {
      console.log("[storage] upsertMeasurements called with userId:", data.userId);
      const cleanData = {
        userId: data.userId,
        neck: data.neck ?? null,
        bust: data.bust ?? null,
        waist: data.waist ?? null,
        hips: data.hips ?? null,
        shoulders: data.shoulders ?? null,
        armLength: data.armLength ?? null,
        backLength: data.backLength ?? null,
        inseam: data.inseam ?? null,
        height: data.height ?? null,
        weight: data.weight ?? null,
        photoUrl: data.photoUrl ?? null,
      };

      const existing = await this.getMeasurements(data.userId);
      console.log("[storage] existing measurements:", existing ? existing.id : "none");

      if (existing) {
        const { userId, ...updateFields } = cleanData;
        await db.update(measurements)
          .set({ ...updateFields, updatedAt: new Date() })
          .where(eq(measurements.userId, data.userId));
        const result = await db.select().from(measurements).where(eq(measurements.userId, data.userId));
        return result[0];
      }

      const id = generateUUID();
      console.log("[storage] inserting new measurements with id:", id);
      await db.insert(measurements).values({ ...cleanData, id });
      const result = await db.select().from(measurements).where(eq(measurements.id, id));
      return result[0];
    } catch (error: any) {
      console.error("[storage] upsertMeasurements FULL ERROR:", error);
      console.error("[storage] error.sqlMessage:", error?.sqlMessage);
      console.error("[storage] error.code:", error?.code);
      throw error;
    }
  }

  async getProjectsByTailor(tailorId: string): Promise<ProjectWithClient[]> {
    const result = await db.select()
      .from(projects)
      .innerJoin(users, eq(projects.clientId, users.id))
      .where(eq(projects.tailorId, tailorId))
      .orderBy(desc(projects.createdAt));

    if (!result || !Array.isArray(result)) return [];

    return result.map(row => ({
      ...row.projects,
      client: row.users
    }));
  }

  async getProjectsByClient(clientId: string): Promise<ProjectWithTailor[]> {
    const result = await db.select()
      .from(projects)
      .innerJoin(tailors, eq(projects.tailorId, tailors.id))
      .innerJoin(users, eq(tailors.userId, users.id))
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.updatedAt));

    if (!result || !Array.isArray(result)) return [];

    return result.map(row => ({
      ...row.projects,
      tailor: parseTailorSpecialties(row.tailors),
      tailorUser: row.users,
    }));
  }

  async getProject(id: string): Promise<ProjectWithClient | undefined> {
    const result = await db.select()
      .from(projects)
      .innerJoin(users, eq(projects.clientId, users.id))
      .where(eq(projects.id, id));

    if (!result || result.length === 0) return undefined;
    return { ...result[0].projects, client: result[0].users };
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = generateUUID();
    await db.insert(projects).values({ ...project, id });
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    await db.update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id));
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getAppointmentsByTailor(tailorId: string): Promise<AppointmentWithClient[]> {
    const result = await db.select()
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .where(eq(appointments.tailorId, tailorId))
      .orderBy(appointments.scheduledAt);

    if (!result || !Array.isArray(result)) return [];

    return result.map(row => ({
      ...row.appointments,
      client: row.users
    }));
  }

  async getAppointmentsByClient(clientId: string): Promise<AppointmentWithClient[]> {
    const result = await db.select()
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .where(eq(appointments.clientId, clientId))
      .orderBy(appointments.scheduledAt);

    if (!result || !Array.isArray(result)) return [];

    return result.map(row => ({
      ...row.appointments,
      client: row.users
    }));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = generateUUID();
    await db.insert(appointments).values({ ...appointment, id });
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    await db.update(appointments)
      .set(updates)
      .where(eq(appointments.id, id));
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'createdAt' | 'emailVerified'>[]> {
    try {
      const result = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        emailVerified: users.emailVerified,
      }).from(users).orderBy(desc(users.createdAt));
      return result || [];
    } catch (error) {
      console.error("getAllUsers error (trying fallback without emailVerified):", error);
      try {
        const fallback = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          createdAt: users.createdAt,
        }).from(users).orderBy(desc(users.createdAt));
        return (fallback || []).map((u: any) => ({ ...u, emailVerified: false }));
      } catch (fallbackError) {
        console.error("getAllUsers fallback error:", fallbackError);
        return [];
      }
    }
  }

  async getAdminUser(): Promise<Pick<User, 'id'> | undefined> {
    try {
      const result = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("getAdminUser error:", error);
      return undefined;
    }
  }

  private async cascadeDeleteUser(id: string): Promise<void> {
    const safeDelete = async (label: string, fn: () => Promise<any>) => {
      try { await fn(); } catch (e: any) {
        console.error(`[cascade] ${label} failed for user ${id}:`, e?.sqlMessage || e?.message);
      }
    };

    await safeDelete("messages.senderId", () => db.delete(messages).where(eq(messages.senderId, id)));

    try {
      const userConvos = await db.select({ id: conversations.id }).from(conversations)
        .where(or(eq(conversations.participant1Id, id), eq(conversations.participant2Id, id)));
      for (const c of userConvos) {
        await safeDelete(`messages.conversationId=${c.id}`, () => db.delete(messages).where(eq(messages.conversationId, c.id)));
        await safeDelete(`conversations.id=${c.id}`, () => db.delete(conversations).where(eq(conversations.id, c.id)));
      }
    } catch (e: any) {
      console.error("[cascade] conversations lookup failed:", e?.sqlMessage || e?.message);
    }

    await safeDelete("measurements", () => db.delete(measurements).where(eq(measurements.userId, id)));
    await safeDelete("reviews.userId", () => db.delete(reviews).where(eq(reviews.userId, id)));
    await safeDelete("projects.clientId", () => db.delete(projects).where(eq(projects.clientId, id)));
    await safeDelete("appointments.clientId", () => db.delete(appointments).where(eq(appointments.clientId, id)));
    await safeDelete("userPreferences", () => db.delete(userPreferences).where(eq(userPreferences.userId, id)));
    await safeDelete("magazineArticles.authorId", () => db.update(magazineArticles).set({ authorId: null }).where(eq(magazineArticles.authorId, id)));

    try {
      const userTailors = await db.select({ id: tailors.id }).from(tailors).where(eq(tailors.userId, id));
      for (const t of userTailors) {
        await safeDelete(`portfolioItems.tailorId=${t.id}`, () => db.delete(portfolioItems).where(eq(portfolioItems.tailorId, t.id)));
        await safeDelete(`products.tailorId=${t.id}`, () => db.delete(products).where(eq(products.tailorId, t.id)));
        await safeDelete(`reviews.tailorId=${t.id}`, () => db.delete(reviews).where(eq(reviews.tailorId, t.id)));
        await safeDelete(`projects.tailorId=${t.id}`, () => db.delete(projects).where(eq(projects.tailorId, t.id)));
        await safeDelete(`appointments.tailorId=${t.id}`, () => db.delete(appointments).where(eq(appointments.tailorId, t.id)));
      }
    } catch (e: any) {
      console.error("[cascade] tailors lookup failed:", e?.sqlMessage || e?.message);
    }

    await safeDelete("tailors", () => db.delete(tailors).where(eq(tailors.userId, id)));

    try {
      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
      await db.delete(users).where(eq(users.id, id));
      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (e: any) {
      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
      console.error(`[cascade] FINAL delete users.id=${id} failed:`, e?.sqlMessage || e?.message);
      throw e;
    }
  }

  async deleteUnverifiedUsers(): Promise<number> {
    try {
      const unverified = await db.select({ id: users.id })
        .from(users)
        .where(and(
          sql`(${users.emailVerified} = false OR ${users.emailVerified} = 0 OR ${users.emailVerified} IS NULL)`,
          sql`${users.role} != 'admin'`
        ));

      console.log("[storage] Found", unverified.length, "unverified users to delete:", unverified.map(u => u.id));

      if (unverified.length === 0) return 0;

      let deleted = 0;
      for (const u of unverified) {
        try {
          await this.cascadeDeleteUser(u.id);
          deleted++;
          console.log("[storage] Successfully deleted user:", u.id);
        } catch (userError: any) {
          console.error("[storage] Failed to delete user", u.id, ":", userError?.sqlMessage || userError?.message || userError);
        }
      }
      return deleted;
    } catch (error: any) {
      console.error("deleteUnverifiedUsers error:", error);
      console.error("deleteUnverifiedUsers sqlMessage:", error?.sqlMessage);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.cascadeDeleteUser(id);
    } catch (error) {
      console.error("deleteUser error:", error);
      throw error;
    }
  }

  async getAdminArtisans(): Promise<AdminArtisan[]> {
    try {
      return await db.select().from(adminArtisans).orderBy(desc(adminArtisans.createdAt));
    } catch (error) {
      console.error("getAdminArtisans error:", error);
      return [];
    }
  }

  async getRegisteredTailors(): Promise<any[]> {
    try {
      const result = await db.select({
        tailorId: tailors.id,
        userId: tailors.userId,
        bio: tailors.bio,
        specialties: tailors.specialties,
        experience: tailors.experience,
        isVerified: tailors.isVerified,
        subscriptionPlan: tailors.subscriptionPlan,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        location: users.location,
        createdAt: users.createdAt,
      })
        .from(tailors)
        .innerJoin(users, eq(tailors.userId, users.id));
      return result;
    } catch (error) {
      console.error("getRegisteredTailors error:", error);
      return [];
    }
  }

  async getAdminArtisan(id: string): Promise<AdminArtisan | undefined> {
    const result = await db.select().from(adminArtisans).where(eq(adminArtisans.id, id));
    return result[0];
  }

  async createAdminArtisan(artisan: InsertAdminArtisan): Promise<AdminArtisan> {
    const id = generateUUID();
    await db.insert(adminArtisans).values({ ...artisan, id });
    const result = await db.select().from(adminArtisans).where(eq(adminArtisans.id, id));
    return result[0];
  }

  async updateAdminArtisan(id: string, updates: Partial<InsertAdminArtisan>): Promise<AdminArtisan | undefined> {
    await db.update(adminArtisans)
      .set(updates)
      .where(eq(adminArtisans.id, id));
    const result = await db.select().from(adminArtisans).where(eq(adminArtisans.id, id));
    return result[0];
  }

  async deleteAdminArtisan(id: string): Promise<void> {
    await db.delete(adminArtisans).where(eq(adminArtisans.id, id));
  }

  async getAdminSettings(): Promise<AdminSetting[]> {
    try {
      return await db.select().from(adminSettings);
    } catch (error) {
      console.error("getAdminSettings error:", error);
      return [];
    }
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    try {
      const result = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
      return result?.[0];
    } catch (error) {
      return undefined;
    }
  }

  async upsertAdminSetting(key: string, value: string): Promise<AdminSetting> {
    try {
      const existing = await this.getAdminSetting(key);
      if (existing) {
        await db.update(adminSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(adminSettings.key, key));
        const result = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
        return result[0];
      }
    } catch (error) {
      // Fall through to insert
    }
    const id = generateUUID();
    await db.insert(adminSettings).values({ key, value, id });
    const result = await db.select().from(adminSettings).where(eq(adminSettings.id, id));
    return result[0];
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
      if (!result || result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("getUserPreferences error:", error);
      return undefined;
    }
  }

  async upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    try {
      const existing = await this.getUserPreferences(userId);
      if (existing) {
        await db.update(userPreferences)
          .set({ ...prefs, updatedAt: new Date() })
          .where(eq(userPreferences.userId, userId));
        const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
        return result[0];
      }
    } catch (error) {
      // Fall through to insert
    }
    const id = generateUUID();
    await db.insert(userPreferences).values({ userId, ...prefs, id });
    const result = await db.select().from(userPreferences).where(eq(userPreferences.id, id));
    return result[0];
  }

  async getMagazineArticles(publishedOnly?: boolean): Promise<MagazineArticle[]> {
    try {
      if (publishedOnly) {
        return await db.select().from(magazineArticles)
          .where(eq(magazineArticles.status, "Publié"))
          .orderBy(desc(magazineArticles.createdAt));
      }
      return await db.select().from(magazineArticles).orderBy(desc(magazineArticles.createdAt));
    } catch (error) {
      console.error("getMagazineArticles error:", error);
      return [];
    }
  }

  async getMagazineArticle(id: string): Promise<MagazineArticle | undefined> {
    try {
      const result = await db.select().from(magazineArticles).where(eq(magazineArticles.id, id));
      return result[0];
    } catch (error) {
      console.error("getMagazineArticle error:", error);
      return undefined;
    }
  }

  async createMagazineArticle(article: InsertMagazineArticle): Promise<MagazineArticle> {
    const id = generateUUID();
    await db.insert(magazineArticles).values({ ...article, id });
    const result = await db.select().from(magazineArticles).where(eq(magazineArticles.id, id));
    return result[0];
  }

  async updateMagazineArticle(id: string, updates: Partial<InsertMagazineArticle>): Promise<MagazineArticle | undefined> {
    await db.update(magazineArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(magazineArticles.id, id));
    const result = await db.select().from(magazineArticles).where(eq(magazineArticles.id, id));
    return result[0];
  }

  async deleteMagazineArticle(id: string): Promise<void> {
    await db.delete(magazineArticles).where(eq(magazineArticles.id, id));
  }

  async incrementArticleViews(id: string): Promise<void> {
    try {
      await db.update(magazineArticles)
        .set({ views: sql`${magazineArticles.views} + 1` })
        .where(eq(magazineArticles.id, id));
    } catch (error) {
      console.error("incrementArticleViews error:", error);
    }
  }

  async deleteAllConversations(): Promise<void> {
    await db.delete(messages);
    await db.delete(conversations);
  }

  async getMeasurementsByUserId(userId: string): Promise<Measurements | undefined> {
    const result = await db.select().from(measurements).where(eq(measurements.userId, userId));
    return result[0];
  }

  async getAllProjectsForAdmin(): Promise<any[]> {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.description,
        p.status,
        p.amount,
        p.payment_status,
        p.client_confirmed,
        p.created_at,
        CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
        CONCAT(tu.first_name, ' ', tu.last_name) AS tailor_name
      FROM projects p
      INNER JOIN users cu ON p.client_id = cu.id
      INNER JOIN tailors t ON p.tailor_id = t.id
      INNER JOIN users tu ON t.user_id = tu.id
      ORDER BY p.created_at DESC
    `) as any[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => ({
      id: r.id,
      client: r.client_name || "—",
      artisan: r.tailor_name || "—",
      description: r.description || r.title || "—",
      date: r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—",
      amount: r.amount ? `${r.amount}€` : "—",
      status: (r.status === "completed") ? "Libéré" : "Bloqué",
      paymentStatus: r.payment_status || null,
      clientConfirmed: !!r.client_confirmed,
    }));
  }

  async getAllAppointmentsForAdmin(): Promise<any[]> {
    const [rows] = await pool.query(`
      SELECT
        a.id,
        a.type,
        a.scheduled_at,
        a.status,
        CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
        CONCAT(tu.first_name, ' ', tu.last_name) AS tailor_name
      FROM appointments a
      INNER JOIN users cu ON a.client_id = cu.id
      INNER JOIN tailors t ON a.tailor_id = t.id
      INNER JOIN users tu ON t.user_id = tu.id
      ORDER BY a.scheduled_at ASC
    `) as any[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => {
      const dt = r.scheduled_at ? new Date(r.scheduled_at) : null;
      return {
        id: r.id,
        title: r.type || "Rendez-vous",
        client: r.client_name || "—",
        artisan: r.tailor_name || "—",
        date: dt ? dt.toLocaleDateString("fr-FR") : "—",
        time: dt ? dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—",
        status: r.status === "confirmed" ? "Confirmé" : r.status === "cancelled" ? "Annulé" : "En attente",
      };
    });
  }

  async getAllMeasurementsForAdmin(): Promise<any[]> {
    const [rows] = await pool.query(`
      SELECT m.id, m.user_id, m.neck, m.bust, m.waist, m.hips, m.shoulders,
             m.arm_length, m.back_length, m.inseam, m.height, m.weight, m.updated_at,
             u.first_name, u.last_name, u.email
      FROM measurements m
      INNER JOIN users u ON m.user_id = u.id COLLATE utf8mb4_unicode_ci
      ORDER BY m.updated_at DESC
    `) as any[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => {
      const fields = [r.neck, r.bust, r.waist, r.hips, r.shoulders, r.arm_length, r.back_length, r.inseam, r.height, r.weight];
      const filled = fields.filter((v) => v != null).length;
      return {
        id: r.id,
        userId: r.user_id,
        clientName: `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email || "—",
        email: r.email || "—",
        neck: r.neck,
        bust: r.bust,
        waist: r.waist,
        hips: r.hips,
        shoulders: r.shoulders,
        armLength: r.arm_length,
        backLength: r.back_length,
        inseam: r.inseam,
        height: r.height,
        weight: r.weight,
        filledCount: filled,
        totalFields: fields.length,
        status: filled === fields.length ? "Complet" : filled > 0 ? "Incomplet" : "Vide",
        updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString("fr-FR") : "—",
      };
    });
  }

  async getAllReviewsForAdmin(): Promise<any[]> {
    const [rows] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at,
             u.first_name as client_first, u.last_name as client_last, u.email as client_email,
             tu.first_name as tailor_first, tu.last_name as tailor_last,
             t.id as tailor_id
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id COLLATE utf8mb4_unicode_ci
      INNER JOIN tailors t ON r.tailor_id = t.id COLLATE utf8mb4_unicode_ci
      INNER JOIN users tu ON t.user_id = tu.id COLLATE utf8mb4_unicode_ci
      ORDER BY r.created_at DESC
    `) as any[];
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment || null,
      tailorId: r.tailor_id,
      tailorName: `${r.tailor_first || ""} ${r.tailor_last || ""}`.trim() || "—",
      clientName: `${r.client_first || ""} ${r.client_last || ""}`.trim() || r.client_email || "—",
      createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—",
    }));
  }

  async deleteReview(id: string): Promise<void> {
    const [reviewRows] = await pool.query(`SELECT tailor_id FROM reviews WHERE id = ?`, [id]) as any[];
    const tailorId = Array.isArray(reviewRows) && reviewRows[0] ? reviewRows[0].tailor_id : null;
    await pool.query(`DELETE FROM reviews WHERE id = ?`, [id]);
    if (tailorId) {
      const [ratingRows] = await pool.query(`SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE tailor_id = ?`, [tailorId]) as any[];
      const avg = Array.isArray(ratingRows) && ratingRows[0] ? (parseFloat(ratingRows[0].avg) || 0) : 0;
      const cnt = Array.isArray(ratingRows) && ratingRows[0] ? (parseInt(ratingRows[0].cnt) || 0) : 0;
      await pool.query(`UPDATE tailors SET rating = ?, review_count = ? WHERE id = ?`, [Math.round(avg * 10) / 10, cnt, tailorId]);
    }
  }
}

export const storage = new DatabaseStorage();