import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { 
  users, tailors, portfolioItems, products, reviews, 
  conversations, messages, measurements, projects, appointments,
  adminArtisans, adminSettings, userPreferences,
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
  
  getMeasurements(userId: string): Promise<Measurements | undefined>;
  upsertMeasurements(measurements: InsertMeasurements): Promise<Measurements>;
  
  getProjectsByTailor(tailorId: string): Promise<ProjectWithClient[]>;
  getProjectsByClient(clientId: string): Promise<ProjectWithTailor[]>;
  getProject(id: string): Promise<ProjectWithClient | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  
  getAppointmentsByTailor(tailorId: string): Promise<AppointmentWithClient[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<void>;

  getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'createdAt'>[]>;

  getAdminArtisans(): Promise<AdminArtisan[]>;
  getAdminArtisan(id: string): Promise<AdminArtisan | undefined>;
  createAdminArtisan(artisan: InsertAdminArtisan): Promise<AdminArtisan>;
  updateAdminArtisan(id: string, updates: Partial<InsertAdminArtisan>): Promise<AdminArtisan | undefined>;
  deleteAdminArtisan(id: string): Promise<void>;

  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences>;

  getAdminSettings(): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  upsertAdminSetting(key: string, value: string): Promise<AdminSetting>;
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

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
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
        .innerJoin(users, eq(tailors.userId, users.id));
      
      if (!result || !Array.isArray(result)) return [];
      
      return result.map(row => ({
        ...row.tailors,
        user: row.users
      }));
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
    return { ...result[0].tailors, user: result[0].users };
  }

  async getTailorByUserId(userId: string): Promise<Tailor | undefined> {
    const result = await db.select().from(tailors).where(eq(tailors.userId, userId));
    return result[0];
  }

  async createTailor(tailor: InsertTailor): Promise<Tailor> {
    const id = randomUUID();
    await db.insert(tailors).values({ ...tailor, id } as any);
    const result = await db.select().from(tailors).where(eq(tailors.id, id));
    return result[0];
  }

  async updateTailor(id: string, updates: Partial<InsertTailor>): Promise<Tailor | undefined> {
    await db.update(tailors).set(updates as any).where(eq(tailors.id, id));
    const result = await db.select().from(tailors).where(eq(tailors.id, id));
    return result[0];
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
        tailor: { ...row.tailors, user: row.users }
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
    const id = randomUUID();
    await db.insert(portfolioItems).values({ ...item, id });
    const result = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id));
    return result[0];
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
        tailor: { ...row.tailors, user: row.users }
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
    return { ...result[0].products, tailor: { ...result[0].tailors, user: result[0].users } };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
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
    const id = randomUUID();
    await db.insert(reviews).values({ ...review, id });
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result[0];
  }

  async getConversations(userId: string): Promise<ConversationWithParticipant[]> {
    const result = await db.select()
      .from(conversations)
      .where(or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      ))
      .orderBy(desc(conversations.lastMessageAt));
    
    const conversationsWithParticipants: ConversationWithParticipant[] = [];
    
    for (const conv of result) {
      const otherParticipantId = conv.participant1Id === userId 
        ? conv.participant2Id 
        : conv.participant1Id;
      
      const otherResult = await db.select()
        .from(users)
        .where(eq(users.id, otherParticipantId));
      
      const unreadMessages = await db.select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, conv.id),
          eq(messages.isRead, false)
        ));
      
      conversationsWithParticipants.push({
        ...conv,
        otherParticipant: otherResult[0],
        unreadCount: unreadMessages.filter(m => m.senderId !== userId).length
      });
    }
    
    return conversationsWithParticipants;
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    const existing = await db.select()
      .from(conversations)
      .where(or(
        and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
        and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
      ));
    
    if (existing.length > 0) return existing[0];
    
    const id = randomUUID();
    await db.insert(conversations).values({ id, participant1Id, participant2Id });
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const result = await db.select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.sentAt);
    
    if (!result || !Array.isArray(result)) return [];
    
    return result.map(row => ({
      ...row.messages,
      sender: row.users
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
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

  async getMeasurements(userId: string): Promise<Measurements | undefined> {
    const result = await db.select()
      .from(measurements)
      .where(eq(measurements.userId, userId));
    return result[0];
  }

  async upsertMeasurements(data: InsertMeasurements): Promise<Measurements> {
    const existing = await this.getMeasurements(data.userId);
    
    if (existing) {
      await db.update(measurements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(measurements.userId, data.userId));
      const result = await db.select().from(measurements).where(eq(measurements.userId, data.userId));
      return result[0];
    }
    
    const id = randomUUID();
    await db.insert(measurements).values({ ...data, id });
    const result = await db.select().from(measurements).where(eq(measurements.id, id));
    return result[0];
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
      tailor: row.tailors,
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
    const id = randomUUID();
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

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    await db.insert(appointments).values({ ...appointment, id });
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    await db.update(appointments).set(updates).where(eq(appointments.id, id));
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getAllUsers(): Promise<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'role' | 'createdAt'>[]> {
    try {
      const result = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
      return result || [];
    } catch (error) {
      console.error("getAllUsers error:", error);
      return [];
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

  async getAdminArtisan(id: string): Promise<AdminArtisan | undefined> {
    const result = await db.select().from(adminArtisans).where(eq(adminArtisans.id, id));
    return result[0];
  }

  async createAdminArtisan(artisan: InsertAdminArtisan): Promise<AdminArtisan> {
    const id = randomUUID();
    await db.insert(adminArtisans).values({ ...artisan, id });
    const result = await db.select().from(adminArtisans).where(eq(adminArtisans.id, id));
    return result[0];
  }

  async updateAdminArtisan(id: string, updates: Partial<InsertAdminArtisan>): Promise<AdminArtisan | undefined> {
    await db.update(adminArtisans).set(updates).where(eq(adminArtisans.id, id));
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
    const existing = await this.getAdminSetting(key);
    if (existing) {
      await db.update(adminSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(adminSettings.key, key));
      const result = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
      return result[0];
    }
    const id = randomUUID();
    await db.insert(adminSettings).values({ id, key, value });
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
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      await db.update(userPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
      const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
      return result[0];
    }
    const id = randomUUID();
    await db.insert(userPreferences).values({ id, userId, ...prefs });
    const result = await db.select().from(userPreferences).where(eq(userPreferences.id, id));
    return result[0];
  }
}

export const storage = new DatabaseStorage();
