import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { discordWebhook, sendWebhookMessage } from "./discord";
import { 
  insertUserSchema, 
  insertAnnouncementSchema, 
  insertStreamSettingsSchema,
  insertThemeSettingsSchema,
  insertSystemLogSchema, 
  insertWebhookSettingsSchema,
  customThemeSchema
} from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
    username: string;
    isPremium?: boolean; // Added isPremium to session
  }
}

// Initialize session store
const MemoryStoreSession = MemoryStore(session);
const sessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // Prune expired sessions every 24h
});

// Helper to require authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.isAuthenticated || !req.session.username) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

// Helper to log action
async function logAction(level: 'info' | 'warning' | 'error', message: string, source: string = 'system') {
  try {
    await storage.createSystemLog({
      level,
      message,
      source,
    });

    // Send to Discord webhook if enabled
    const webhookSettings = await storage.getWebhookSettings();
    if (webhookSettings && webhookSettings.url) {
      const shouldSend = level === 'error' || 
        (level === 'warning' && webhookSettings.logLevel !== 'error') ||
        (level === 'info' && webhookSettings.logLevel === 'info');

      if (shouldSend && webhookSettings.realTimeLogging) {
        await sendWebhookMessage({
          title: `${level.toUpperCase()}: ${source}`,
          description: message,
          color: level === 'info' ? 0x0099FF : level === 'warning' ? 0xFFCC00 : 0xFF0000,
        });
      }
    }
  } catch (error) {
    console.error("Error logging action:", error);
  }
}

// Initialize database with default admin user
async function initializeDatabase() {
  try {
    // Check if admin user exists
    const admin = await storage.getUserByUsername("admin");

    if (!admin) {
      // Create admin user
      await storage.createUser({
        username: "admin",
        password: "Rennsz5842" // In a real app, this would be hashed
      });
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: "RENNSZ-premium-website-secret",
      resave: true,
      saveUninitialized: true,
      store: sessionStore,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      },
    })
  );

  // Initialize database
  await initializeDatabase();

  // API Routes

  // Admin Authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Get user from database
      const user = await storage.getUserByUsername(username);

      if (user && user.password === password) { // In a real app, compare hashed passwords
        req.session.isAuthenticated = true;
        req.session.username = user.username;
        req.session.isPremium = true; // Set premium flag for admin

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

  app.post("/api/admin/logout", (req, res) => {
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

  app.get("/api/admin/check-auth", (req, res) => {
    res.json({ authenticated: req.session.isAuthenticated || false });
  });

  // Announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      await logAction("error", `Error fetching announcements: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", requireAuth, async (req, res) => {
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

  app.patch("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Validate id
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid announcement ID" });
      }

      // Get existing announcement
      const existingAnnouncement = await storage.getAnnouncement(id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Update announcement
      const updatedAnnouncement = await storage.updateAnnouncement(id, updateData);

      await logAction("info", `Announcement updated: ID ${id}`, "admin");

      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      await logAction("error", `Error updating announcement: ${error}`, "api");
      res.status(400).json({ message: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Validate id
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid announcement ID" });
      }

      // Check if announcement exists
      const existingAnnouncement = await storage.getAnnouncement(id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Delete announcement
      await storage.deleteAnnouncement(id);

      await logAction("info", `Announcement deleted: ID ${id}`, "admin");

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      await logAction("error", `Error deleting announcement: ${error}`, "api");
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Twitch streams
  app.get("/api/twitch/live", async (req, res) => {
    try {
      const liveStream = await storage.getLiveStreamer();
      res.json(liveStream);
    } catch (error) {
      console.error("Error fetching live streamer:", error);
      await logAction("error", `Error fetching live streamer: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch live streamer" });
    }
  });

  app.get("/api/twitch/streamers", async (req, res) => {
    try {
      const streamers = await storage.getAllStreamersStatus();
      res.json(streamers);
    } catch (error) {
      console.error("Error fetching streamers status:", error);
      await logAction("error", `Error fetching streamers status: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch streamers status" });
    }
  });

  app.get("/api/twitch/streams/:channel", async (req, res) => {
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

  // Stream settings
  app.get("/api/admin/stream-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getStreamSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching stream settings:", error);
      await logAction("error", `Error fetching stream settings: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch stream settings" });
    }
  });

  app.post("/api/admin/stream-settings/featured", requireAuth, async (req, res) => {
    try {
      const { featured, customUrl } = req.body;

      if (!featured) {
        return res.status(400).json({ message: "Featured stream type is required" });
      }

      const updateData: Partial<z.infer<typeof insertStreamSettingsSchema>> = {
        featuredStream: featured,
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

  // Theme settings
  app.get("/api/theme", async (req, res) => {
    try {
      const settings = await storage.getThemeSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching theme settings:", error);
      await logAction("error", `Error fetching theme settings: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch theme settings" });
    }
  });

  app.post("/api/theme", async (req, res) => {
    try {
      const { theme, customTheme } = req.body;

      if (!theme) {
        return res.status(400).json({ message: "Theme name is required" });
      }

      let updateData: Partial<z.infer<typeof insertThemeSettingsSchema>> = {
        currentTheme: theme,
      };

      // If custom theme, validate and include it
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

  app.get("/api/admin/theme-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getThemeSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin theme settings:", error);
      await logAction("error", `Error fetching admin theme settings: ${error}`, "api");
      res.status(500).json({ message: "Failed to fetch theme settings" });
    }
  });

  app.post("/api/admin/theme-settings", requireAuth, async (req, res) => {
    try {
      const { theme, maintenanceMode, maintenanceMessage } = req.body;

      if (!theme) {
        return res.status(400).json({ message: "Theme name is required" });
      }

      const updateData = {
        currentTheme: theme,
        maintenanceMode: maintenanceMode || false,
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

  app.post("/api/admin/theme-settings/custom", requireAuth, async (req, res) => {
    try {
      const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor } = req.body;

      const customTheme = customThemeSchema.parse({
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
      });

      const updateData = {
        currentTheme: "custom",
        customTheme,
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

  // Logs and webhooks
  app.get("/api/admin/logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getSystemLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  app.post("/api/discord/log", requireAuth, async (req, res) => {
    try {
      const { embeds } = req.body;

      if (!embeds || !Array.isArray(embeds)) {
        return res.status(400).json({ message: "Invalid webhook data" });
      }

      await sendWebhookMessage({
        embeds,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending webhook:", error);
      res.status(500).json({ message: "Failed to send webhook" });
    }
  });

  app.get("/api/admin/webhook-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getWebhookSettings();
      res.json(settings || {
        url: "https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z",
        logLevel: "info",
        realTimeLogging: true,
      });
    } catch (error) {
      console.error("Error fetching webhook settings:", error);
      res.status(500).json({ message: "Failed to fetch webhook settings" });
    }
  });

  app.get("/api/admin/seo/meta", requireAuth, async (req, res) => {
  try {
    const settings = await storage.getMetaTags();
    res.json(settings || {});
  } catch (error) {
    console.error("Error fetching meta tags:", error);
    res.status(500).json({ message: "Failed to fetch meta tags" });
  }
});

app.post("/api/admin/seo/meta", requireAuth, async (req, res) => {
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

app.post("/api/admin/webhook-settings", requireAuth, async (req, res) => {
    try {
      const { url, logLevel, realTimeLogging } = req.body;

      if (!url) {
        return res.status(400).json({ message: "Webhook URL is required" });
      }

      const settingsData = insertWebhookSettingsSchema.parse({
        url,
        logLevel: logLevel || "info",
        realTimeLogging: realTimeLogging !== false,
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

  // Discord webhook logging endpoint - public for client-side logging
  app.post("/api/discord/log", express.json(), async (req, res) => {
    try {
      console.log("Discord webhook request received:", req.body);
      const { title, description, color, platform, action } = req.body;

      // Create embeds from the simplified input
      let embeds = [];

      if (title && description) {
        // Direct embed format
        embeds = [{ title, description, color: color || 0x00ff00 }];
      } else if (platform && action) {
        // Social media interaction format
        embeds = [{
          title: `Social Media Interaction: ${platform}`,
          description: `User ${action}`,
          color: platform === 'Discord' ? 0x5865F2 : 
                 platform === 'Twitter' ? 0x1DA1F2 : 
                 platform === 'Instagram' ? 0xE1306C : 0x00ff00
        }];
      } else {
        return res.status(400).json({ message: "Invalid webhook data format" });
      }

      // Log the action to the system log first
      const logMessage = embeds[0].title || "Discord webhook log";
      await logAction("info", logMessage, "webhook");

      // Send the webhook to Discord
      const webhookSettings = await storage.getWebhookSettings();
      if (!webhookSettings || !webhookSettings.url) {
        console.log("No webhook URL configured, using fallback");
        // Fallback URL
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


  // Premium Features
  app.post("/api/admin/premium/features", requireAuth, async (req, res) => {
    try {
      const { feature, enabled } = req.body;

      // Log the premium feature change
      await logAction("info", `Premium feature ${feature} ${enabled ? 'enabled' : 'disabled'}`, "admin");

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating premium feature:", error);
      res.status(500).json({ message: "Failed to update premium feature" });
    }
  });

  // Admin stats and metrics
  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      // Get various stats for dashboard
      const [announcements, viewerData, visitData] = await Promise.all([
        storage.getAllAnnouncements(),
        storage.getCurrentViewers(),
        storage.getWebsiteVisits(),
      ]);

      res.json({
        announcements: announcements.length,
        viewers: viewerData?.viewers || 0,
        visits: visitData?.visits || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/activity", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getRecentActivityLogs();

      // Format the logs for the activity feed
      const activityItems = logs.map((log, index) => ({
        id: log.id || index,
        type: log.level,
        description: log.message,
        timestamp: timeAgo(log.timestamp),
        icon: getLogIcon(log.level, log.source),
      }));

      res.json(activityItems);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/admin/metrics/viewers", requireAuth, async (req, res) => {
    try {
      const viewerData = await storage.getViewerMetrics();
      res.json(viewerData);
    } catch (error) {
      console.error("Error fetching viewer metrics:", error);
      res.status(500).json({ message: "Failed to fetch viewer metrics" });
    }
  });

  app.use(async (req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    // Premium user detection (from session)
    const isPremium = req.session.isPremium;

    // Rate limiting
    const rateLimit = isPremium ? 1000 : 100; // requests per minute
    const requestDelay = isPremium ? 0 : 100; // artificial delay for non-premium

    if (!isPremium) {
      await new Promise(resolve => setTimeout(resolve, requestDelay));
    }

    res.on('finish', () => {
      const end = Date.now();
      const responseTime = end - start;
      console.log(`Request to ${path} took ${responseTime}ms`);
    });

    next();
  });


  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// Helper functions

function timeAgo(date: Date | string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return past.toLocaleDateString();
}

function getLogIcon(level: string, source: string) {
  if (source === 'auth') return 'user-shield';
  if (source === 'admin') return 'user-edit';
  if (source === 'backup') return 'database';

  switch (level) {
    case 'info': return 'info-circle';
    case 'warning': return 'exclamation-triangle';
    case 'error': return 'exclamation-circle';
    default: return 'info-circle';
  }
}