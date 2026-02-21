import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, int, boolean, float, datetime, index, json, char } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = mysqlTable(
  "sessions",
  {
    session_id: varchar("session_id", { length: 128 }).primaryKey(),
    expires: int("expires").notNull(),
    data: text("data"),
  }
);

export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  location: varchar("location", { length: 255 }),
  createdAt: datetime("created_at").default(sql`NOW()`),
  updatedAt: datetime("updated_at").default(sql`NOW()`),
});

export const tailors = mysqlTable("tailors", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id),
  bio: text("bio"),
  specialties: json("specialties").$type<string[]>(),
  experience: int("experience"),
  coverImageUrl: text("cover_image_url"),
  isVerified: boolean("is_verified").default(false),
  rating: float("rating").default(0),
  reviewCount: int("review_count").default(0),
  portfolioCount: int("portfolio_count").default(0),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("Starter"),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const portfolioItems = mysqlTable("portfolio_items", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tailorId: char("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  imageUrl: text("image_url").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  likesCount: int("likes_count").default(0),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const products = mysqlTable("products", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tailorId: char("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: float("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 100 }),
  inStock: boolean("in_stock").default(true),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const reviews = mysqlTable("reviews", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tailorId: char("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  userId: char("user_id", { length: 36 }).notNull().references(() => users.id),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const conversations = mysqlTable("conversations", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  participant1Id: char("participant1_id", { length: 36 }).notNull().references(() => users.id),
  participant2Id: char("participant2_id", { length: 36 }).notNull().references(() => users.id),
  lastMessageAt: datetime("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const messages = mysqlTable("messages", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  conversationId: char("conversation_id", { length: 36 }).notNull().references(() => conversations.id),
  senderId: char("sender_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: datetime("sent_at").default(sql`NOW()`),
  isRead: boolean("is_read").default(false),
});

export const measurements = mysqlTable("measurements", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: char("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  neck: float("neck"),
  bust: float("bust"),
  waist: float("waist"),
  hips: float("hips"),
  shoulders: float("shoulders"),
  armLength: float("arm_length"),
  backLength: float("back_length"),
  inseam: float("inseam"),
  height: float("height"),
  weight: float("weight"),
  updatedAt: datetime("updated_at").default(sql`NOW()`),
});

export const projects = mysqlTable("projects", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tailorId: char("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  clientId: char("client_id", { length: 36 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  progress: int("progress").default(0),
  currentStep: varchar("current_step", { length: 50 }).default("prise_mesures"),
  amount: float("amount"),
  deadline: datetime("deadline"),
  modelPhotoUrl: text("model_photo_url"),
  notes: text("notes"),
  createdAt: datetime("created_at").default(sql`NOW()`),
  updatedAt: datetime("updated_at").default(sql`NOW()`),
});

export const appointments = mysqlTable("appointments", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  tailorId: char("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  clientId: char("client_id", { length: 36 }).notNull().references(() => users.id),
  projectId: char("project_id", { length: 36 }).references(() => projects.id),
  type: varchar("type", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  scheduledAt: datetime("scheduled_at").notNull(),
  duration: int("duration").default(60),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const adminArtisans = mysqlTable("admin_artisans", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  specialty: varchar("specialty", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("En attente"),
  city: varchar("city", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  birthDate: varchar("birth_date", { length: 20 }),
  nationality: varchar("nationality", { length: 100 }),
  idType: varchar("id_type", { length: 50 }),
  idNumber: varchar("id_number", { length: 100 }),
  address: text("address"),
  siret: varchar("siret", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  legalForm: varchar("legal_form", { length: 100 }),
  tvaNumber: varchar("tva_number", { length: 50 }),
  iban: varchar("iban", { length: 50 }),
  yearsExperience: int("years_experience"),
  bio: text("bio"),
  joinDate: varchar("join_date", { length: 20 }),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("Starter"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("En attente"),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const userPreferences = mysqlTable("user_preferences", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: char("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  emailMessages: boolean("email_messages").default(true),
  emailAppointments: boolean("email_appointments").default(true),
  emailPromotions: boolean("email_promotions").default(false),
  emailNewsletter: boolean("email_newsletter").default(true),
  pushMessages: boolean("push_messages").default(true),
  pushAppointments: boolean("push_appointments").default(true),
  pushPromotions: boolean("push_promotions").default(false),
  pushOrders: boolean("push_orders").default(true),
  updatedAt: datetime("updated_at").default(sql`NOW()`),
});

export const adminSettings = mysqlTable("admin_settings", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: datetime("updated_at").default(sql`NOW()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTailorSchema = createInsertSchema(tailors).omit({ id: true, createdAt: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, sentAt: true });
export const insertMeasurementsSchema = createInsertSchema(measurements).omit({ id: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertAdminArtisanSchema = createInsertSchema(adminArtisans).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertTailor = z.infer<typeof insertTailorSchema>;
export type Tailor = typeof tailors.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMeasurements = z.infer<typeof insertMeasurementsSchema>;
export type Measurements = typeof measurements.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAdminArtisan = z.infer<typeof insertAdminArtisanSchema>;
export type AdminArtisan = typeof adminArtisans.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;

// Composite types
export type TailorWithUser = Tailor & { user: User };
export type PortfolioWithTailor = PortfolioItem & { tailor: TailorWithUser };
export type ProductWithTailor = Product & { tailor: TailorWithUser };
export type ReviewWithUser = Review & { user: User };
export type ConversationWithParticipant = Conversation & { otherParticipant: User; unreadCount: number };
export type MessageWithSender = Message & { sender: User };
export type ProjectWithClient = Project & { client: User };
export type ProjectWithTailor = Project & { tailor: Tailor; tailorUser: User };
export type AppointmentWithClient = Appointment & { client: User };
