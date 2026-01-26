import { 
  type User, type InsertUser, 
  type Tailor, type InsertTailor,
  type PortfolioItem, type InsertPortfolioItem,
  type Product, type InsertProduct,
  type Review, type InsertReview,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type TailorWithUser,
  type PortfolioWithTailor,
  type ProductWithTailor,
  type ReviewWithUser,
  type ConversationWithParticipant,
  type MessageWithSender
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTailors(): Promise<TailorWithUser[]>;
  getTailor(id: string): Promise<TailorWithUser | undefined>;
  createTailor(tailor: InsertTailor): Promise<Tailor>;
  
  getPortfolioItems(): Promise<PortfolioWithTailor[]>;
  getPortfolioItemsByTailor(tailorId: string): Promise<PortfolioWithTailor[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  
  getProducts(): Promise<ProductWithTailor[]>;
  getProductsByTailor(tailorId: string): Promise<ProductWithTailor[]>;
  getProduct(id: string): Promise<ProductWithTailor | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  getReviewsByTailor(tailorId: string): Promise<ReviewWithUser[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  getConversations(userId: string): Promise<ConversationWithParticipant[]>;
  getMessages(conversationId: string): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tailors: Map<string, Tailor>;
  private portfolioItems: Map<string, PortfolioItem>;
  private products: Map<string, Product>;
  private reviews: Map<string, Review>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.tailors = new Map();
    this.portfolioItems = new Map();
    this.products = new Map();
    this.reviews = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    
    this.seedData();
  }

  private seedData() {
    const users: User[] = [
      { id: "u1", username: "marie_couture", password: "hash", fullName: "Marie Dupont", email: "marie@example.com", phone: "0612345678", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", role: "tailor", location: "Paris" },
      { id: "u2", username: "jean_style", password: "hash", fullName: "Jean-Pierre Martin", email: "jean@example.com", phone: "0623456789", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", role: "tailor", location: "Lyon" },
      { id: "u3", username: "aisha_mode", password: "hash", fullName: "Aïsha Konaté", email: "aisha@example.com", phone: "0634567890", avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop", role: "tailor", location: "Paris" },
      { id: "u4", username: "sophie_atelier", password: "hash", fullName: "Sophie Bernard", email: "sophie@example.com", phone: "0645678901", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", role: "tailor", location: "Bordeaux" },
      { id: "u5", username: "lucas_craft", password: "hash", fullName: "Lucas Moreau", email: "lucas@example.com", phone: "0656789012", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop", role: "tailor", location: "Marseille" },
      { id: "u6", username: "client1", password: "hash", fullName: "Claire Petit", email: "claire@example.com", phone: "0667890123", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", role: "client", location: "Paris" },
      { id: "u7", username: "client2", password: "hash", fullName: "Thomas Roux", email: "thomas@example.com", phone: "0678901234", avatarUrl: null, role: "client", location: "Lyon" },
    ];
    users.forEach(u => this.users.set(u.id, u));

    const tailors: Tailor[] = [
      { id: "t1", userId: "u1", bio: "Créatrice passionnée de haute couture depuis 15 ans. Spécialisée dans les robes de mariée et les tenues de soirée sur mesure. Chaque création est unique et réalisée avec les meilleurs tissus.", specialties: ["Haute Couture", "Mariage", "Robes"], experience: 15, hourlyRate: 75, coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", isVerified: true, rating: 4.9, reviewCount: 47, portfolioCount: 24 },
      { id: "t2", userId: "u2", bio: "Maître tailleur spécialisé dans les costumes homme. Du costume classique au streetwear élégant, je crée des pièces qui reflètent votre personnalité.", specialties: ["Costumes", "Retouches", "Streetwear"], experience: 20, hourlyRate: 65, coverImageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop", isVerified: true, rating: 4.8, reviewCount: 38, portfolioCount: 18 },
      { id: "t3", userId: "u3", bio: "Styliste spécialisée dans la mode africaine contemporaine. Je fusionne les tissus traditionnels avec des coupes modernes pour créer des tenues uniques.", specialties: ["Vêtements Africains", "Robes", "Haute Couture"], experience: 8, hourlyRate: 55, coverImageUrl: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop", isVerified: true, rating: 4.7, reviewCount: 29, portfolioCount: 32 },
      { id: "t4", userId: "u4", bio: "Retoucheuse professionnelle avec un œil pour le détail. Transformations, ajustements et réparations de tous types de vêtements.", specialties: ["Retouches", "Costumes", "Robes"], experience: 12, hourlyRate: 45, coverImageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=600&fit=crop", isVerified: false, rating: 4.6, reviewCount: 52, portfolioCount: 15 },
      { id: "t5", userId: "u5", bio: "Designer créatif spécialisé dans le streetwear et la mode enfant. Des créations fun et originales pour toute la famille.", specialties: ["Streetwear", "Mode Enfant"], experience: 5, hourlyRate: 50, coverImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop", isVerified: false, rating: 4.5, reviewCount: 18, portfolioCount: 21 },
    ];
    tailors.forEach(t => this.tailors.set(t.id, t));

    const portfolioItems: PortfolioItem[] = [
      { id: "p1", tailorId: "t1", imageUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&h=600&fit=crop", title: "Robe de mariée en dentelle", description: "Robe sur mesure avec dentelle de Calais", category: "Mariage", likesCount: 156 },
      { id: "p2", tailorId: "t1", imageUrl: "https://images.unsplash.com/photo-1518657175232-6f728c325f0f?w=600&h=600&fit=crop", title: "Robe de soirée bordeaux", description: "Soie sauvage avec broderies", category: "Haute Couture", likesCount: 89 },
      { id: "p3", tailorId: "t2", imageUrl: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&h=600&fit=crop", title: "Costume trois pièces", description: "Laine italienne, coupe slim", category: "Costumes", likesCount: 124 },
      { id: "p4", tailorId: "t2", imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop", title: "Costume de mariage", description: "Costume croisé en lin", category: "Mariage", likesCount: 97 },
      { id: "p5", tailorId: "t3", imageUrl: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&h=600&fit=crop", title: "Robe en wax", description: "Création originale en tissu africain", category: "Vêtements Africains", likesCount: 203 },
      { id: "p6", tailorId: "t3", imageUrl: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&h=600&fit=crop", title: "Ensemble moderne", description: "Fusion contemporaine et tradition", category: "Vêtements Africains", likesCount: 178 },
      { id: "p7", tailorId: "t4", imageUrl: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=600&fit=crop", title: "Retouche robe vintage", description: "Transformation complète", category: "Retouches", likesCount: 45 },
      { id: "p8", tailorId: "t5", imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=600&fit=crop", title: "Collection enfant été", description: "Vêtements colorés et confortables", category: "Mode Enfant", likesCount: 67 },
    ];
    portfolioItems.forEach(p => this.portfolioItems.set(p.id, p));

    const products: Product[] = [
      { id: "prod1", tailorId: "t1", title: "Robe de cocktail sur mesure", description: "Robe élégante réalisée selon vos mesures", price: 450, imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop", category: "Robes", inStock: true },
      { id: "prod2", tailorId: "t1", title: "Voile de mariée brodé", description: "Voile en tulle avec broderies florales", price: 180, imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop", category: "Mariage", inStock: true },
      { id: "prod3", tailorId: "t2", title: "Costume sur mesure classique", description: "Costume deux pièces en laine fine", price: 650, imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop", category: "Costumes", inStock: true },
      { id: "prod4", tailorId: "t3", title: "Robe Ankara moderne", description: "Robe mi-longue en tissu wax authentique", price: 220, imageUrl: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&h=800&fit=crop", category: "Vêtements Africains", inStock: true },
      { id: "prod5", tailorId: "t3", title: "Ensemble bazin", description: "Boubou et pantalon assortis", price: 350, imageUrl: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&h=800&fit=crop", category: "Vêtements Africains", inStock: true },
      { id: "prod6", tailorId: "t5", title: "T-shirt personnalisé enfant", description: "T-shirt en coton bio avec motif au choix", price: 35, imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=800&fit=crop", category: "Mode Enfant", inStock: true },
    ];
    products.forEach(p => this.products.set(p.id, p));

    const reviews: Review[] = [
      { id: "r1", tailorId: "t1", userId: "u6", rating: 5, comment: "Marie a réalisé ma robe de mariée et c'était exactement ce que j'imaginais ! Un travail d'une qualité exceptionnelle.", createdAt: "2024-12-15T10:30:00Z" },
      { id: "r2", tailorId: "t1", userId: "u7", rating: 5, comment: "Professionnelle, à l'écoute et talentueuse. Je recommande vivement.", createdAt: "2024-11-20T14:00:00Z" },
      { id: "r3", tailorId: "t2", userId: "u6", rating: 4, comment: "Excellent costume, livré dans les temps. Petit ajustement nécessaire mais très réactif.", createdAt: "2024-12-01T09:15:00Z" },
      { id: "r4", tailorId: "t3", userId: "u7", rating: 5, comment: "Aïsha a créé une robe magnifique pour mon anniversaire. Les finitions sont parfaites !", createdAt: "2024-12-10T16:45:00Z" },
    ];
    reviews.forEach(r => this.reviews.set(r.id, r));

    const conversations: Conversation[] = [
      { id: "c1", participant1Id: "u6", participant2Id: "u1", lastMessageAt: "2024-12-20T15:30:00Z", lastMessagePreview: "Parfait, à bientôt !" },
      { id: "c2", participant1Id: "u6", participant2Id: "u3", lastMessageAt: "2024-12-19T10:00:00Z", lastMessagePreview: "Merci pour les photos du tissu" },
    ];
    conversations.forEach(c => this.conversations.set(c.id, c));

    const messages: Message[] = [
      { id: "m1", conversationId: "c1", senderId: "u6", content: "Bonjour Marie, je souhaiterais commander une robe de soirée", sentAt: "2024-12-20T14:00:00Z", isRead: true },
      { id: "m2", conversationId: "c1", senderId: "u1", content: "Bonjour Claire ! Avec plaisir, quel style recherchez-vous ?", sentAt: "2024-12-20T14:30:00Z", isRead: true },
      { id: "m3", conversationId: "c1", senderId: "u6", content: "Quelque chose d'élégant pour un gala", sentAt: "2024-12-20T15:00:00Z", isRead: true },
      { id: "m4", conversationId: "c1", senderId: "u1", content: "Parfait, à bientôt !", sentAt: "2024-12-20T15:30:00Z", isRead: true },
    ];
    messages.forEach(m => this.messages.set(m.id, m));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTailors(): Promise<TailorWithUser[]> {
    return Array.from(this.tailors.values()).map(tailor => {
      const user = this.users.get(tailor.userId)!;
      return { ...tailor, user };
    });
  }

  async getTailor(id: string): Promise<TailorWithUser | undefined> {
    const tailor = this.tailors.get(id);
    if (!tailor) return undefined;
    const user = this.users.get(tailor.userId)!;
    return { ...tailor, user };
  }

  async createTailor(insertTailor: InsertTailor): Promise<Tailor> {
    const id = randomUUID();
    const tailor: Tailor = { ...insertTailor, id };
    this.tailors.set(id, tailor);
    return tailor;
  }

  async getPortfolioItems(): Promise<PortfolioWithTailor[]> {
    return Array.from(this.portfolioItems.values()).map(item => {
      const tailor = this.tailors.get(item.tailorId)!;
      const user = this.users.get(tailor.userId)!;
      return { ...item, tailor: { ...tailor, user } };
    });
  }

  async getPortfolioItemsByTailor(tailorId: string): Promise<PortfolioWithTailor[]> {
    return Array.from(this.portfolioItems.values())
      .filter(item => item.tailorId === tailorId)
      .map(item => {
        const tailor = this.tailors.get(item.tailorId)!;
        const user = this.users.get(tailor.userId)!;
        return { ...item, tailor: { ...tailor, user } };
      });
  }

  async createPortfolioItem(insertItem: InsertPortfolioItem): Promise<PortfolioItem> {
    const id = randomUUID();
    const item: PortfolioItem = { ...insertItem, id };
    this.portfolioItems.set(id, item);
    return item;
  }

  async getProducts(): Promise<ProductWithTailor[]> {
    return Array.from(this.products.values()).map(product => {
      const tailor = this.tailors.get(product.tailorId)!;
      const user = this.users.get(tailor.userId)!;
      return { ...product, tailor: { ...tailor, user } };
    });
  }

  async getProductsByTailor(tailorId: string): Promise<ProductWithTailor[]> {
    return Array.from(this.products.values())
      .filter(product => product.tailorId === tailorId)
      .map(product => {
        const tailor = this.tailors.get(product.tailorId)!;
        const user = this.users.get(tailor.userId)!;
        return { ...product, tailor: { ...tailor, user } };
      });
  }

  async getProduct(id: string): Promise<ProductWithTailor | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const tailor = this.tailors.get(product.tailorId)!;
    const user = this.users.get(tailor.userId)!;
    return { ...product, tailor: { ...tailor, user } };
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async getReviewsByTailor(tailorId: string): Promise<ReviewWithUser[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.tailorId === tailorId)
      .map(review => {
        const user = this.users.get(review.userId)!;
        return { ...review, user };
      });
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = { ...insertReview, id };
    this.reviews.set(id, review);
    return review;
  }

  async getConversations(userId: string): Promise<ConversationWithParticipant[]> {
    return Array.from(this.conversations.values())
      .filter(c => c.participant1Id === userId || c.participant2Id === userId)
      .map(conversation => {
        const otherParticipantId = conversation.participant1Id === userId 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        const otherParticipant = this.users.get(otherParticipantId)!;
        const unreadCount = Array.from(this.messages.values())
          .filter(m => m.conversationId === conversation.id && m.senderId !== userId && !m.isRead)
          .length;
        return { ...conversation, otherParticipant, unreadCount };
      });
  }

  async getMessages(conversationId: string): Promise<MessageWithSender[]> {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .map(message => {
        const sender = this.users.get(message.senderId)!;
        return { ...message, sender };
      })
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { ...insertMessage, id };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
