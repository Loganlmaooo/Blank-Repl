// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import fs from "fs/promises";
import path from "path";

// server/discord.ts
import fetch from "cross-fetch";
import { z } from "zod";
var DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z";
var embedSchema = z.object({
  title: z.string().optional(),
  description: z.string(),
  color: z.number().optional(),
  fields: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      inline: z.boolean().optional()
    })
  ).optional(),
  footer: z.object({
    text: z.string(),
    icon_url: z.string().optional()
  }).optional(),
  timestamp: z.string().optional(),
  thumbnail: z.object({
    url: z.string()
  }).optional(),
  author: z.object({
    name: z.string(),
    icon_url: z.string().optional(),
    url: z.string().optional()
  }).optional()
});
var webhookMessageSchema = z.object({
  content: z.string().optional(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
  embeds: z.array(embedSchema).optional()
});
var discordWebhook = {
  url: DISCORD_WEBHOOK_URL,
  username: "RENNSZ Website",
  avatar_url: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80"
};
async function sendWebhookMessage(message) {
  try {
    let webhookUrl;
    if ("webhookUrl" in message && message.webhookUrl) {
      webhookUrl = message.webhookUrl;
      const { webhookUrl: _, ...restMessage } = message;
      message = restMessage;
    } else {
      const webhookSettings2 = await storage.getWebhookSettings();
      webhookUrl = webhookSettings2?.url || discordWebhook.url;
    }
    let webhookMessage;
    if ("description" in message) {
      webhookMessage = {
        username: discordWebhook.username,
        avatar_url: discordWebhook.avatar_url,
        embeds: [message]
      };
    } else {
      webhookMessage = {
        username: discordWebhook.username,
        avatar_url: discordWebhook.avatar_url,
        ...message
      };
    }
    try {
      webhookMessageSchema.parse(webhookMessage);
    } catch (error) {
      console.error("Invalid webhook message format:", error);
      return false;
    }
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webhookMessage)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord webhook error (${response.status}): ${errorText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send Discord webhook message:", error);
    return false;
  }
}

// server/storage.ts
var DATA_DIR = ".data";
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR);
  }
}
async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return null;
    }
    console.error(`Error reading ${filename}:`, err);
    return null;
  }
}
async function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const jsonData = data || {};
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    const backupFilename = `backup_${filename}_${Date.now()}.json`;
    const backupPath = path.join(DATA_DIR, backupFilename);
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
    const webhookSettingsPath = path.join(DATA_DIR, "webhookSettings.json");
    const webhookSettings2 = await readJsonFile("webhookSettings.json") || {};
    const backupTime = (/* @__PURE__ */ new Date()).toISOString();
    webhookSettings2.lastBackup = backupTime;
    await fs.writeFile(webhookSettingsPath, JSON.stringify(webhookSettings2, null, 2));
    await sendWebhookMessage({
      embeds: [{
        title: "System Backup Complete",
        description: `Backup created: ${filename}`,
        color: 65280,
        fields: [
          {
            name: "Backup Time",
            value: backupTime,
            inline: true
          },
          {
            name: "Size",
            value: `${(JSON.stringify(data).length / 1024).toFixed(2)} KB`,
            inline: true
          }
        ],
        timestamp: backupTime
      }]
    });
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    throw err;
  }
}
var FileStorage = class {
  users;
  announcements;
  logs;
  streamSettingsData;
  themeSettingsData;
  webhookSettingsData;
  currentId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.announcements = /* @__PURE__ */ new Map();
    this.logs = [];
    this.currentId = {};
    this.streamSettingsData = {};
    this.themeSettingsData = {};
    this.webhookSettingsData = {};
    this.loadData();
    setInterval(() => {
      Promise.all([
        this.saveData().catch((err) => {
          console.error("Automated backup failed:", err);
        }),
        this.loadData().catch((err) => {
          console.error("Data reload failed:", err);
        })
      ]);
    }, 5 * 60 * 1e3);
  }
  async loadData() {
    await ensureDataDir();
    const [users2, announcements2, logs, streamSettings2, themeSettings2, webhookSettings2] = await Promise.all([
      readJsonFile("users.json"),
      readJsonFile("announcements.json"),
      readJsonFile("logs.json"),
      readJsonFile("streamSettings.json"),
      readJsonFile("themeSettings.json"),
      readJsonFile("webhookSettings.json")
    ]);
    if (users2) {
      this.users = new Map(Object.entries(users2));
      this.currentId.users = Math.max(...Array.from(this.users.keys())) + 1;
    }
    if (announcements2) {
      this.announcements = new Map(Object.entries(announcements2));
      this.currentId.announcements = Math.max(...Array.from(this.announcements.keys())) + 1;
    }
    if (logs) {
      this.logs = logs;
      this.currentId.logs = logs.length + 1;
    }
    if (streamSettings2) {
      this.streamSettingsData = streamSettings2;
    }
    if (themeSettings2) {
      this.themeSettingsData = themeSettings2;
    }
    if (webhookSettings2) {
      this.webhookSettingsData = webhookSettings2;
    }
    if (this.users.size === 0) {
      await this.createUser({
        username: "admin",
        password: "Rennsz5842"
      });
    }
  }
  async saveData() {
    await Promise.all([
      writeJsonFile("users.json", Object.fromEntries(this.users)),
      writeJsonFile("announcements.json", Object.fromEntries(this.announcements)),
      writeJsonFile("logs.json", this.logs),
      writeJsonFile("streamSettings.json", this.streamSettingsData),
      writeJsonFile("themeSettings.json", this.themeSettingsData),
      writeJsonFile("webhookSettings.json", this.webhookSettingsData)
    ]);
  }
  // User operations
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  async createUser(userData) {
    const id = this.currentId.users || 1;
    this.currentId.users = id + 1;
    const user = { ...userData, id };
    this.users.set(id, user);
    await this.saveData();
    return user;
  }
  // Announcement operations
  async getAllAnnouncements() {
    return Array.from(this.announcements.values()).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  async getAnnouncement(id) {
    return this.announcements.get(id);
  }
  async createAnnouncement(data) {
    const id = this.currentId.announcements || 1;
    this.currentId.announcements = id + 1;
    const announcement = { ...data, id, createdAt: /* @__PURE__ */ new Date() };
    this.announcements.set(id, announcement);
    await this.saveData();
    return announcement;
  }
  async updateAnnouncement(id, data) {
    const announcement = this.announcements.get(id);
    if (!announcement) throw new Error("Announcement not found");
    const updated = { ...announcement, ...data };
    this.announcements.set(id, updated);
    await this.saveData();
    return updated;
  }
  async deleteAnnouncement(id) {
    this.announcements.delete(id);
    await this.saveData();
  }
  // Stream operations
  async getStreamerStatus(channel) {
    const isMainChannel = channel.toLowerCase() === "rennsz";
    const isGamingChannel = channel.toLowerCase() === "rennszino";
    if (isMainChannel) {
      const isLive = Math.random() > 0.5;
      return {
        name: "RENNSZ",
        login: "rennsz",
        url: "https://www.twitch.tv/rennsz",
        isLive,
        profileImage: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80",
        ...isLive ? {
          title: "IRL Tokyo Exploration!",
          game: "Just Chatting",
          viewers: Math.floor(Math.random() * 2e3) + 500,
          startedAt: new Date(Date.now() - Math.floor(Math.random() * 108e5)),
          thumbnail: "https://images.unsplash.com/photo-1502519144081-acca18599776?w=600&q=80"
        } : {}
      };
    } else if (isGamingChannel) {
      const isLive = Math.random() > 0.7;
      return {
        name: "RENNSZINO",
        login: "rennszino",
        url: "https://www.twitch.tv/rennszino",
        isLive,
        profileImage: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80",
        ...isLive ? {
          title: "Gaming Chill Stream",
          game: "Cyberpunk 2077",
          viewers: Math.floor(Math.random() * 1e3) + 200,
          startedAt: new Date(Date.now() - Math.floor(Math.random() * 72e5)),
          thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80"
        } : {}
      };
    }
    return {
      isLive: false,
      name: channel,
      login: channel,
      url: `https://www.twitch.tv/${channel}`
    };
  }
  async getAllStreamersStatus() {
    const [main, gaming] = await Promise.all([
      this.getStreamerStatus("rennsz"),
      this.getStreamerStatus("rennszino")
    ]);
    return { main, gaming };
  }
  async getLiveStreamer() {
    const { main, gaming } = await this.getAllStreamersStatus();
    if (main.isLive) return main;
    if (gaming.isLive) return gaming;
    return null;
  }
  async getStreamSettings() {
    return this.streamSettingsData;
  }
  async updateStreamSettings(data) {
    this.streamSettingsData = {
      ...this.streamSettingsData,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.saveData();
    return this.streamSettingsData;
  }
  async getCurrentViewers() {
    return { viewers: Math.floor(Math.random() * 2e3) + 500 };
  }
  async getViewerMetrics() {
    const today = /* @__PURE__ */ new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        viewers: Math.floor(Math.random() * 2e3) + 500
      });
    }
    return data;
  }
  // Theme operations
  async getThemeSettings() {
    return this.themeSettingsData;
  }
  async updateThemeSettings(data) {
    this.themeSettingsData = {
      ...this.themeSettingsData,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.saveData();
    return this.themeSettingsData;
  }
  // System logs and webhooks
  async createSystemLog(insertLog) {
    const id = this.currentId.logs || 1;
    this.currentId.logs = id + 1;
    const log2 = { ...insertLog, id, timestamp: /* @__PURE__ */ new Date() };
    this.logs.push(log2);
    if (this.logs.length > 1e3) this.logs = this.logs.slice(-1e3);
    await this.saveData();
    return log2;
  }
  async getSystemLogs(limit = 100) {
    return this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }
  async getRecentActivityLogs(limit = 10) {
    return this.logs.filter((log2) => log2.level !== "error" || log2.source !== "system").sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }
  async getWebhookSettings() {
    return this.webhookSettingsData;
  }
  async updateWebhookSettings(data) {
    this.webhookSettingsData = {
      ...this.webhookSettingsData,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.saveData();
    return this.webhookSettingsData;
  }
  // Stats and metrics
  async getWebsiteVisits() {
    return { visits: Math.floor(Math.random() * 1e4) + 5e3 };
  }
};
var storage = new FileStorage();

// server/routes.ts
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// shared/schema.ts
import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z as z2 } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  category: true,
  isPinned: true
});
var streamSettings = pgTable("stream_settings", {
  id: serial("id").primaryKey(),
  featuredStream: text("featured_stream").notNull().default("auto"),
  customEmbedUrl: text("custom_embed_url"),
  scheduleImageUrl: text("schedule_image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertStreamSettingsSchema = createInsertSchema(streamSettings).pick({
  featuredStream: true,
  customEmbedUrl: true,
  scheduleImageUrl: true
});
var themeSettings = pgTable("theme_settings", {
  id: serial("id").primaryKey(),
  currentTheme: text("current_theme").notNull().default("default"),
  customTheme: jsonb("custom_theme"),
  backgroundImageUrl: text("background_image_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var customThemeSchema = z2.object({
  primaryColor: z2.string().optional(),
  secondaryColor: z2.string().optional(),
  accentColor: z2.string().optional(),
  backgroundColor: z2.string().optional(),
  textColor: z2.string().optional(),
  backgroundImage: z2.string().optional()
});
var insertThemeSettingsSchema = createInsertSchema(themeSettings).pick({
  currentTheme: true
}).extend({
  customTheme: customThemeSchema.optional()
});
var systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  source: text("source").notNull().default("system"),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});
var insertSystemLogSchema = createInsertSchema(systemLogs).pick({
  level: true,
  message: true,
  source: true
});
var webhookSettings = pgTable("webhook_settings", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  logLevel: text("log_level").notNull().default("info"),
  realTimeLogging: boolean("real_time_logging").notNull().default(true),
  lastBackup: timestamp("last_backup"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertWebhookSettingsSchema = createInsertSchema(webhookSettings).pick({
  url: true,
  logLevel: true,
  realTimeLogging: true
});
var maintenanceMode = pgTable("maintenance_mode", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  message: text("message")
});
var insertMaintenanceModeSchema = createInsertSchema(maintenanceMode).pick({
  enabled: true,
  message: true
});

// server/routes.ts
var MemoryStoreSession = MemoryStore(session);
var sessionStore = new MemoryStoreSession({
  checkPeriod: 864e5
  // Prune expired sessions every 24h
});
function requireAuth(req, res, next) {
  if (!req.session.isAuthenticated || !req.session.username) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}
async function logAction(level, message, source = "system") {
  try {
    await storage.createSystemLog({
      level,
      message,
      source
    });
    const webhookSettings2 = await storage.getWebhookSettings();
    if (webhookSettings2 && webhookSettings2.url) {
      const shouldSend = level === "error" || level === "warning" && webhookSettings2.logLevel !== "error" || level === "info" && webhookSettings2.logLevel === "info";
      if (shouldSend && webhookSettings2.realTimeLogging) {
        await sendWebhookMessage({
          title: `${level.toUpperCase()}: ${source}`,
          description: message,
          color: level === "info" ? 39423 : level === "warning" ? 16763904 : 16711680
        });
      }
    }
  } catch (error) {
    console.error("Error logging action:", error);
  }
}
async function initializeDatabase() {
  try {
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      await storage.createUser({
        username: "admin",
        password: "Rennsz5842"
        // In a real app, this would be hashed
      });
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
async function registerRoutes(app2) {
  app2.use(
    session({
      secret: "RENNSZ-premium-website-secret",
      resave: true,
      saveUninitialized: true,
      store: sessionStore,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1e3,
        // 24 hours
        sameSite: "lax"
      }
    })
  );
  await initializeDatabase();
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        req.session.isAuthenticated = true;
        req.session.username = user.username;
        await logAction("info", `Admin login successful: ${username}`, "auth");
        res.json({ success: true });
      } else {
        await logAction("warning", `Failed login attempt: ${username}`, "auth");
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      await logAction("error", `Login error: ${error}`, "auth");
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  app2.post("/api/admin/logout", (req, res) => {
    if (req.session.username) {
      logAction("info", `Admin logout: ${req.session.username}`, "auth");
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ success: false, message: "Logout failed" });
      } else {
        res.json({ success: true });
      }
    });
  });
  app2.get("/api/admin/check-auth", (req, res) => {
    res.json({ authenticated: req.session.isAuthenticated || false });
  });
  app2.get("/api/announcements", async (req, res) => {
    try {
      const announcements2 = await storage.getAllAnnouncements();
      res.json(announcements2);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      await logAction("error", `Error fetching announcements: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  app2.post("/api/announcements", requireAuth, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      await logAction("info", `New announcement created: ${announcement.title}`, "admin");
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      await logAction("error", `Error creating announcement: ${error}`, "api");
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });
  app2.patch("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid announcement ID" });
      }
      const existingAnnouncement = await storage.getAnnouncement(id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      const updatedAnnouncement = await storage.updateAnnouncement(id, updateData);
      await logAction("info", `Announcement updated: ID ${id}`, "admin");
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      await logAction("error", `Error updating announcement: ${error}`, "api");
      res.status(400).json({ message: "Failed to update announcement" });
    }
  });
  app2.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid announcement ID" });
      }
      const existingAnnouncement = await storage.getAnnouncement(id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      await storage.deleteAnnouncement(id);
      await logAction("info", `Announcement deleted: ID ${id}`, "admin");
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      await logAction("error", `Error deleting announcement: ${error}`, "api");
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });
  app2.get("/api/twitch/live", async (req, res) => {
    try {
      const liveStream = await storage.getLiveStreamer();
      res.json(liveStream);
    } catch (error) {
      console.error("Error fetching live streamer:", error);
      await logAction("error", `Error fetching live streamer: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch live streamer" });
    }
  });
  app2.get("/api/twitch/streamers", async (req, res) => {
    try {
      const streamers = await storage.getAllStreamersStatus();
      res.json(streamers);
    } catch (error) {
      console.error("Error fetching streamers status:", error);
      await logAction("error", `Error fetching streamers status: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch streamers status" });
    }
  });
  app2.get("/api/twitch/streams/:channel", async (req, res) => {
    try {
      const { channel } = req.params;
      const streamer = await storage.getStreamerStatus(channel);
      res.json(streamer);
    } catch (error) {
      console.error(`Error fetching ${req.params.channel} stream:`, error);
      await logAction("error", `Error fetching stream data: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch stream data" });
    }
  });
  app2.get("/api/admin/stream-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getStreamSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching stream settings:", error);
      await logAction("error", `Error fetching stream settings: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch stream settings" });
    }
  });
  app2.post("/api/admin/stream-settings/featured", requireAuth, async (req, res) => {
    try {
      const { featured, customUrl } = req.body;
      if (!featured) {
        return res.status(400).json({ message: "Featured stream type is required" });
      }
      const updateData = {
        featuredStream: featured
      };
      if (featured === "custom" && customUrl) {
        updateData.customEmbedUrl = customUrl;
      }
      const settings = await storage.updateStreamSettings(updateData);
      await logAction("info", `Stream settings updated: featured=${featured}`, "admin");
      res.json(settings);
    } catch (error) {
      console.error("Error updating stream settings:", error);
      await logAction("error", `Error updating stream settings: ${error}`, "api");
      res.status(400).json({ message: "Failed to update stream settings" });
    }
  });
  app2.get("/api/theme", async (req, res) => {
    try {
      const settings = await storage.getThemeSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching theme settings:", error);
      await logAction("error", `Error fetching theme settings: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch theme settings" });
    }
  });
  app2.post("/api/theme", async (req, res) => {
    try {
      const { theme, customTheme } = req.body;
      if (!theme) {
        return res.status(400).json({ message: "Theme name is required" });
      }
      let updateData = {
        currentTheme: theme
      };
      if (theme === "custom" && customTheme) {
        const validatedCustomTheme = customThemeSchema.parse(customTheme);
        updateData.customTheme = validatedCustomTheme;
      }
      const settings = await storage.updateThemeSettings(updateData);
      await logAction("info", `Theme updated: ${theme}`, "system");
      res.json(settings);
    } catch (error) {
      console.error("Error updating theme:", error);
      await logAction("error", `Error updating theme: ${error}`, "api");
      res.status(400).json({ message: "Failed to update theme" });
    }
  });
  app2.get("/api/admin/theme-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getThemeSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin theme settings:", error);
      await logAction("error", `Error fetching admin theme settings: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch theme settings" });
    }
  });
  app2.post("/api/admin/theme-settings", requireAuth, async (req, res) => {
    try {
      const { theme, maintenanceMode: maintenanceMode2, maintenanceMessage } = req.body;
      if (!theme) {
        return res.status(400).json({ message: "Theme name is required" });
      }
      const updateData = {
        currentTheme: theme,
        maintenanceMode: maintenanceMode2 || false,
        maintenanceMessage: maintenanceMessage || "Site is under maintenance. Please check back later."
      };
      const settings = await storage.updateThemeSettings(updateData);
      await logAction("info", `Admin updated theme: ${theme}`, "admin");
      res.json(settings);
    } catch (error) {
      console.error("Error updating admin theme settings:", error);
      await logAction("error", `Error updating admin theme settings: ${error}`, "api");
      res.status(400).json({ message: "Failed to update theme settings" });
    }
  });
  app2.post("/api/admin/theme-settings/custom", requireAuth, async (req, res) => {
    try {
      const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor } = req.body;
      const customTheme = customThemeSchema.parse({
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor
      });
      const updateData = {
        currentTheme: "custom",
        customTheme
      };
      const settings = await storage.updateThemeSettings(updateData);
      await logAction("info", "Custom theme created and applied", "admin");
      res.json(settings);
    } catch (error) {
      console.error("Error updating custom theme:", error);
      await logAction("error", `Error updating custom theme: ${error}`, "api");
      res.status(400).json({ message: "Failed to update custom theme" });
    }
  });
  app2.get("/api/admin/logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getSystemLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });
  app2.post("/api/discord/log", requireAuth, async (req, res) => {
    try {
      const { embeds } = req.body;
      if (!embeds || !Array.isArray(embeds)) {
        return res.status(400).json({ message: "Invalid webhook data" });
      }
      await sendWebhookMessage({
        embeds
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending webhook:", error);
      res.status(500).json({ message: "Failed to send webhook" });
    }
  });
  app2.get("/api/admin/webhook-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getWebhookSettings();
      res.json(settings || {
        url: "https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z",
        logLevel: "info",
        realTimeLogging: true
      });
    } catch (error) {
      console.error("Error fetching webhook settings:", error);
      res.status(500).json({ message: "Failed to fetch webhook settings" });
    }
  });
  app2.get("/api/admin/seo/meta", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getMetaTags();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching meta tags:", error);
      res.status(500).json({ message: "Failed to fetch meta tags" });
    }
  });
  app2.post("/api/admin/seo/meta", requireAuth, async (req, res) => {
    try {
      const { title, description, keywords } = req.body;
      const settings = await storage.updateMetaTags({ title, description, keywords });
      await logAction("info", "Updated SEO meta tags", "admin");
      res.json(settings);
    } catch (error) {
      console.error("Error updating meta tags:", error);
      res.status(500).json({ message: "Failed to update meta tags" });
    }
  });
  app2.post("/api/admin/webhook-settings", requireAuth, async (req, res) => {
    try {
      const { url, logLevel, realTimeLogging } = req.body;
      if (!url) {
        return res.status(400).json({ message: "Webhook URL is required" });
      }
      const settingsData = insertWebhookSettingsSchema.parse({
        url,
        logLevel: logLevel || "info",
        realTimeLogging: realTimeLogging !== false
      });
      const settings = await storage.updateWebhookSettings(settingsData);
      await logAction("info", "Webhook settings updated", "admin");
      res.json(settings);
    } catch (error) {
      console.error("Error updating webhook settings:", error);
      await logAction("error", `Error updating webhook settings: ${error}`, "api");
      res.status(400).json({ message: "Failed to update webhook settings" });
    }
  });
  app2.post("/api/discord/log", express.json(), async (req, res) => {
    try {
      console.log("Discord webhook request received:", req.body);
      const { title, description, color, platform, action } = req.body;
      let embeds = [];
      if (title && description) {
        embeds = [{ title, description, color: color || 65280 }];
      } else if (platform && action) {
        embeds = [{
          title: `Social Media Interaction: ${platform}`,
          description: `User ${action}`,
          color: platform === "Discord" ? 5793266 : platform === "Twitter" ? 1942002 : platform === "Instagram" ? 14757996 : 65280
        }];
      } else {
        return res.status(400).json({ message: "Invalid webhook data format" });
      }
      const logMessage = embeds[0].title || "Discord webhook log";
      await logAction("info", logMessage, "webhook");
      const webhookSettings2 = await storage.getWebhookSettings();
      if (!webhookSettings2 || !webhookSettings2.url) {
        console.log("No webhook URL configured, using fallback");
        const success = await sendWebhookMessage({
          embeds,
          webhookUrl: "https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z"
        });
        if (success) {
          res.json({ success: true, message: "Webhook sent successfully" });
        } else {
          res.status(500).json({ success: false, message: "Failed to send webhook" });
        }
      } else {
        const success = await sendWebhookMessage({ embeds });
        if (success) {
          res.json({ success: true, message: "Webhook sent successfully" });
        } else {
          res.status(500).json({ success: false, message: "Failed to send webhook" });
        }
      }
    } catch (error) {
      console.error("Error sending Discord webhook:", error);
      await logAction("error", `Error sending Discord webhook: ${error}`, "api");
      res.status(500).json({ message: "Failed to send webhook" });
    }
  });
  app2.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const [announcements2, viewerData, visitData] = await Promise.all([
        storage.getAllAnnouncements(),
        storage.getCurrentViewers(),
        storage.getWebsiteVisits()
      ]);
      res.json({
        announcements: announcements2.length,
        viewers: viewerData?.viewers || 0,
        visits: visitData?.visits || 0
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  app2.get("/api/admin/activity", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getRecentActivityLogs();
      const activityItems = logs.map((log2, index) => ({
        id: log2.id || index,
        type: log2.level,
        description: log2.message,
        timestamp: timeAgo(log2.timestamp),
        icon: getLogIcon(log2.level, log2.source)
      }));
      res.json(activityItems);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });
  app2.get("/api/admin/metrics/viewers", requireAuth, async (req, res) => {
    try {
      const viewerData = await storage.getViewerMetrics();
      res.json(viewerData);
    } catch (error) {
      console.error("Error fetching viewer metrics:", error);
      res.status(500).json({ message: "Failed to fetch viewer metrics" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function timeAgo(date) {
  const now = /* @__PURE__ */ new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1e3);
  if (diffInSeconds < 60) {
    return "Just now";
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
  return past.toLocaleDateString();
}
function getLogIcon(level, source) {
  if (source === "auth") return "user-shield";
  if (source === "admin") return "user-edit";
  if (source === "backup") return "database";
  switch (level) {
    case "info":
      return "info-circle";
    case "warning":
      return "exclamation-triangle";
    case "error":
      return "exclamation-circle";
    default:
      return "info-circle";
  }
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client/src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/sitemap.ts
async function setupSitemap(app2) {
  app2.get("/sitemap.xml", async (req, res) => {
    const baseUrl = `https://${req.headers.host}`;
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/streams</loc>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/announcements</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  await setupSitemap(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
