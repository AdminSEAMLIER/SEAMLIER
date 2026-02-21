import { users, type User, type UpsertUser, type InsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = generateUUID();
    await db.insert(users).values({ ...userData, id });
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result[0]) throw new Error("Failed to create user");
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id) {
      const existing = await this.getUser(userData.id);
      if (existing) {
        await db.update(users)
          .set({ ...userData, updatedAt: new Date() })
          .where(eq(users.id, userData.id));
        const result = await db.select().from(users).where(eq(users.id, userData.id));
        return result[0];
      }
    }
    const id = userData.id || generateUUID();
    await db.insert(users).values({ ...userData, id });
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
}

export const authStorage = new AuthStorage();
