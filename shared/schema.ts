import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: text("phone"),
  role: text("role").notNull().default("client"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tailors = pgTable("tailors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  specialties: text("specialties").array(),
  experience: integer("experience"),
  coverImageUrl: text("cover_image_url"),
  isVerified: boolean("is_verified").default(false),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  portfolioCount: integer("portfolio_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tailorId: varchar("tailor_id").notNull().references(() => tailors.id),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tailorId: varchar("tailor_id").notNull().references(() => tailors.id),
  title: text("title").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category"),
  inStock: boolean("in_stock").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tailorId: varchar("tailor_id").notNull().references(() => tailors.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const measurements = pgTable("measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  neck: real("neck"),
  bust: real("bust"),
  waist: real("waist"),
  hips: real("hips"),
  shoulders: real("shoulders"),
  armLength: real("arm_length"),
  backLength: real("back_length"),
  inseam: real("inseam"),
  height: real("height"),
  weight: real("weight"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tailorId: varchar("tailor_id").notNull().references(() => tailors.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").default(0),
  amount: real("amount"),
  deadline: timestamp("deadline"),
  modelPhotoUrl: text("model_photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tailorId: varchar("tailor_id").notNull().references(() => tailors.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  type: text("type").notNull(),
  location: text("location"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(60),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminArtisans = pgTable("admin_artisans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  specialty: text("specialty").notNull(),
  status: text("status").notNull().default("En attente"),
  city: text("city").notNull(),
  email: text("email"),
  phone: text("phone"),
  birthDate: text("birth_date"),
  nationality: text("nationality"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  address: text("address"),
  siret: text("siret"),
  companyName: text("company_name"),
  legalForm: text("legal_form"),
  tvaNumber: text("tva_number"),
  iban: text("iban"),
  yearsExperience: integer("years_experience"),
  bio: text("bio"),
  joinDate: text("join_date"),
  subscriptionPlan: text("subscription_plan").default("Mensuel"),
  paymentStatus: text("payment_status").default("En attente"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export type AppointmentWithClient = Appointment & { client: User };
