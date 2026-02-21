import { users, type User, type UpsertUser, type InsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(userData).returning();
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id) {
      const existing = await this.getUser(userData.id);
      if (existing) {
        const [updated] = await db.update(users)
          .set({ ...userData, updatedAt: new Date() })
          .where(eq(users.id, userData.id))
          .returning();
        return updated;
      }
    }
    const [created] = await db.insert(users).values(userData).returning();
    return created;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}

export const authStorage = new AuthStorage();
