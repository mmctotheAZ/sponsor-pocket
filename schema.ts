import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["sponsor", "sponsee"] }).notNull(),
  sobrietyDate: timestamp("sobriety_date"),
  name: text("name").notNull(),
  bio: text("bio"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const sponsorRelationships = pgTable("sponsor_relationships", {
  id: serial("id").primaryKey(),
  sponsorId: integer("sponsor_id").references(() => users.id),
  sponseeId: integer("sponsee_id").references(() => users.id),
  status: text("status", { enum: ["pending", "active", "ended"] }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  relationshipId: integer("relationship_id").references(() => sponsorRelationships.id),
  senderId: integer("sender_id").references(() => users.id),
  content: text("content").notNull(),
  aiEnhanced: boolean("ai_enhanced").default(false),
  aiSuggestion: text("ai_suggestion"),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  mood: integer("mood").notNull(),
  gratitudeList: text("gratitude_list").array(),
  challengesFaced: text("challenges_faced"),
  copingStrategies: text("coping_strategies"),
  nextSteps: text("next_steps"),
  aiInsights: text("ai_insights")
});

export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  messageId: integer("message_id").references(() => messages.id),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  context: jsonb("context"),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true 
});

export const insertSponsorRelationshipSchema = createInsertSchema(sponsorRelationships).omit({
  id: true,
  endDate: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});

export const insertProgressSchema = createInsertSchema(progressEntries).omit({
  id: true
});

export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({
  id: true,
  timestamp: true
});

// Types
export type User = typeof users.$inferSelect;
export type SponsorRelationship = typeof sponsorRelationships.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ProgressEntry = typeof progressEntries.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSponsorRelationship = z.infer<typeof insertSponsorRelationshipSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;