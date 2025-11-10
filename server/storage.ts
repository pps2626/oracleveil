import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { users, accessTokens, type User, type InsertUser, type AccessToken, type InsertAccessToken } from "@shared/schema";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createAccessToken(token: InsertAccessToken): Promise<AccessToken>;
  getAccessToken(token: string): Promise<AccessToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  getUnusedTokens(): Promise<AccessToken[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createAccessToken(insertToken: InsertAccessToken): Promise<AccessToken> {
    const result = await db.insert(accessTokens).values(insertToken).returning();
    return result[0];
  }

  async getAccessToken(token: string): Promise<AccessToken | undefined> {
    const result = await db.select().from(accessTokens).where(eq(accessTokens.token, token)).limit(1);
    return result[0];
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db.update(accessTokens).set({ used: true }).where(eq(accessTokens.token, token));
  }

  async getUnusedTokens(): Promise<AccessToken[]> {
    const result = await db.select().from(accessTokens).where(eq(accessTokens.used, false));
    return result;
  }
}

export const storage = new DatabaseStorage();
