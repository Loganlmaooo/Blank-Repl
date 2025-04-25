import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true, 
  category: true,
  isPinned: true,
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// Stream settings table
export const streamSettings = pgTable("stream_settings", {
  id: serial("id").primaryKey(),
  featuredStream: text("featured_stream").notNull().default("auto"),
  customEmbedUrl: text("custom_embed_url"),
  scheduleImageUrl: text("schedule_image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStreamSettingsSchema = createInsertSchema(streamSettings).pick({
  featuredStream: true,
  customEmbedUrl: true,
  scheduleImageUrl: true,
});

export type InsertStreamSettings = z.infer<typeof insertStreamSettingsSchema>;
export type StreamSettings = typeof streamSettings.$inferSelect;

// Theme settings table
export const themeSettings = pgTable("theme_settings", {
  id: serial("id").primaryKey(),
  currentTheme: text("current_theme").notNull().default("default"),
  customTheme: jsonb("custom_theme"),
  backgroundImageUrl: text("background_image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customThemeSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  backgroundImage: z.string().optional(),
});

export const insertThemeSettingsSchema = createInsertSchema(themeSettings).pick({
  currentTheme: true,
}).extend({
  customTheme: customThemeSchema.optional(),
});

export type InsertThemeSettings = z.infer<typeof insertThemeSettingsSchema>;
export type ThemeSettings = typeof themeSettings.$inferSelect;
export type CustomTheme = z.infer<typeof customThemeSchema>;

// System logs table
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  source: text("source").notNull().default("system"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).pick({
  level: true,
  message: true,
  source: true,
});

export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// Webhook settings table
export const webhookSettings = pgTable("webhook_settings", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  logLevel: text("log_level").notNull().default("info"),
  realTimeLogging: boolean("real_time_logging").notNull().default(true),
  lastBackup: timestamp("last_backup"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWebhookSettingsSchema = createInsertSchema(webhookSettings).pick({
  url: true,
  logLevel: true,
  realTimeLogging: true,
});

export type InsertWebhookSettings = z.infer<typeof insertWebhookSettingsSchema>;
export type WebhookSettings = typeof webhookSettings.$inferSelect;

// Maintenance Mode table
export const maintenanceMode = pgTable("maintenance_mode", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  message: text("message"),
});

export const insertMaintenanceModeSchema = createInsertSchema(maintenanceMode).pick({
  enabled: true,
  message: true,
});

export type InsertMaintenanceMode = z.infer<typeof insertMaintenanceModeSchema>;
export type MaintenanceMode = typeof maintenanceMode.$inferSelect;