import { mysqlTable, text, varchar, int, boolean, float, timestamp, json, bigint, date } from "drizzle-orm/mysql-core";
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
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: text("profile_image_url"),
  phone: text("phone"),
  role: text("role").notNull().default("client"),
  location: text("location"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token", { length: 100 }),
  verificationExpires: timestamp("verification_expires"),
  resetToken: varchar("reset_token", { length: 100 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
  stripeOnboarded: boolean("stripe_onboarded").default(false),
});
export const tailors = mysqlTable("tailors", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  bio: text("bio"),
  specialties: json("specialties").$type<string[]>(),
  experience: int("experience"),
  coverImageUrl: text("cover_image_url"),
  isVerified: boolean("is_verified").default(false),
  rating: float("rating").default(0),
  reviewCount: int("review_count").default(0),
  portfolioCount: int("portfolio_count").default(0),
  subscriptionPlan: text("subscription_plan").default("Starter"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionCurrentPeriodEnd: bigint("subscription_current_period_end", { mode: "number" }),
  latitude: float("latitude"),
  longitude: float("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const portfolioItems = mysqlTable("portfolio_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  imageUrl: text("image_url").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  likesCount: int("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: float("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 100 }),
  inStock: boolean("in_stock").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  participant1Id: varchar("participant1_id", { length: 36 }).notNull().references(() => users.id),
  participant2Id: varchar("participant2_id", { length: 36 }).notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 36 }).notNull().references(() => conversations.id),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const measurements = mysqlTable("measurements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
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
  photoUrl: text("photo_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  clothingType: varchar("clothing_type", { length: 100 }),
  requestedPrice: float("requested_price"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  progress: int("progress").default(0),
  currentStep: varchar("current_step", { length: 50 }).default("prise_mesures"),
  amount: float("amount"),
  deadline: timestamp("deadline"),
  modelPhotoUrl: text("model_photo_url"),
  notes: text("notes"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  amountTotal: int("amount_total"),
  amountArtisan: int("amount_artisan"),
  clientConfirmed: boolean("client_confirmed").default(false),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }),
  clientDeadline: date("client_deadline"),
  artisanDeadline: date("artisan_deadline"),
  isUrgent: boolean("is_urgent").default(false),
  fabricDepositDate: date("fabric_deposit_date"),
  fabricDepositReminderSent: boolean("fabric_deposit_reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => users.id),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  type: varchar("type", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: int("duration").default(60),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminArtisans = mysqlTable("admin_artisans", {
  id: varchar("id", { length: 36 }).primaryKey(),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = mysqlTable("user_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  emailMessages: boolean("email_messages").default(true),
  emailAppointments: boolean("email_appointments").default(true),
  emailPromotions: boolean("email_promotions").default(false),
  emailNewsletter: boolean("email_newsletter").default(true),
  pushMessages: boolean("push_messages").default(true),
  pushAppointments: boolean("push_appointments").default(true),
  pushPromotions: boolean("push_promotions").default(false),
  pushOrders: boolean("push_orders").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const magazineArticles = mysqlTable("magazine_articles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  content: text("content"),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 50 }).notNull().default("Brouillon"),
  authorId: varchar("author_id", { length: 36 }).references(() => users.id),
  views: int("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tailorClientData = mysqlTable("tailor_client_data", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => users.id),
  note: text("note"),
  clientStatus: varchar("client_status", { length: 20 }).default("nouveau"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = mysqlTable("events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  eventDate: date("event_date").notNull(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull().references(() => tailors.id),
  organizerId: varchar("organizer_id", { length: 36 }).notNull().references(() => users.id),
  inviteCode: varchar("invite_code", { length: 10 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventParticipants = mysqlTable("event_participants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const adminSettings = mysqlTable("admin_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
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
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertMagazineArticleSchema = createInsertSchema(magazineArticles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });
export const insertTailorClientDataSchema = createInsertSchema(tailorClientData).omit({ id: true, updatedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({ id: true, joinedAt: true });

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
export type InsertMagazineArticle = z.infer<typeof insertMagazineArticleSchema>;
export type MagazineArticle = typeof magazineArticles.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertTailorClientData = z.infer<typeof insertTailorClientDataSchema>;
export type TailorClientData = typeof tailorClientData.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type EventWithDetails = Event & { tailor: { id: string; user: { firstName: string | null; lastName: string | null } }; organizer: { firstName: string | null; lastName: string | null }; participantCount: number; userHasJoined?: boolean };

// Composite types
export type TailorWithUser = Tailor & { user: User };
export type PortfolioWithTailor = PortfolioItem & { tailor: TailorWithUser };
export type ProductWithTailor = Product & { tailor: TailorWithUser };
export type ReviewWithUser = Review & { user: User };
export type ConversationWithParticipant = Conversation & { otherParticipant: User; unreadCount: number; otherParticipantTailorId?: string | null };
export type MessageWithSender = Message & { sender: User };
export type ProjectWithClient = Project & { client: User };
export type ProjectWithTailor = Project & { tailor: Tailor; tailorUser: User };
export type AppointmentWithClient = Appointment & { client: User };

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const favorites = mysqlTable("favorites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  tailorId: varchar("tailor_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Favorite = typeof favorites.$inferSelect;
