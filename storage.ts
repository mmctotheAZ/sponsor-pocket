import { users, messages, progressEntries, aiInteractions } from "@shared/schema";
import type { User, Message, ProgressEntry, InsertUser, InsertMessage, InsertProgress, AiInteraction, InsertAiInteraction } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  // Message operations
  getMessages(relationshipId: number): Promise<Message[]>;
  getRecentMessages(relationshipId: number, limit: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Progress operations
  getProgressEntries(userId: number): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgress): Promise<ProgressEntry>;

  // AI operations
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getMessages(relationshipId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.relationshipId, relationshipId))
      .orderBy(messages.timestamp);
  }

  async getRecentMessages(relationshipId: number, limit: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.relationshipId, relationshipId))
      .orderBy(desc(messages.timestamp))
      .limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getProgressEntries(userId: number): Promise<ProgressEntry[]> {
    return db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userId, userId));
  }

  async createProgressEntry(entry: InsertProgress): Promise<ProgressEntry> {
    const [newEntry] = await db
      .insert(progressEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction> {
    const [newInteraction] = await db
      .insert(aiInteractions)
      .values(interaction)
      .returning();
    return newInteraction;
  }
}

export const storage = new DatabaseStorage();