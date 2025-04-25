import {
  users,
  type User,
  type InsertUser,
  announcements,
  type Announcement,
  type InsertAnnouncement,
  streamSettings,
  type StreamSettings,
  type InsertStreamSettings,
  themeSettings,
  type ThemeSettings,
  type InsertThemeSettings,
  type CustomTheme,
  systemLogs,
  type SystemLog,
  type InsertSystemLog,
  webhookSettings,
  type WebhookSettings,
  type InsertWebhookSettings
} from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';
import { Client } from '@replit/object-storage';
import { sendWebhookMessage } from './discord';

// Initialize storage
const DATA_DIR = '.data';

// Create data directory if it doesn't exist
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR);
  }
}

// Helper to read/write JSON files
async function readJsonFile(filename: string) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error(`Error reading ${filename}:`, err);
    return null;
  }
}

async function writeJsonFile(filename: string, data: any) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const jsonData = data || {};
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    // Create backup
    const backupFilename = `backup_${filename}_${Date.now()}.json`;
    const backupPath = path.join(DATA_DIR, backupFilename);
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2));

    // Update last backup time and send webhook
    const webhookSettingsPath = path.join(DATA_DIR, 'webhookSettings.json');
    const webhookSettings = await readJsonFile('webhookSettings.json') || {};
    const backupTime = new Date().toISOString();
    webhookSettings.lastBackup = backupTime;
    await fs.writeFile(webhookSettingsPath, JSON.stringify(webhookSettings, null, 2));

    // Send backup webhook
    await sendWebhookMessage({
      embeds: [{
        title: "System Backup Complete",
        description: `Backup created: ${filename}`,
        color: 0x00FF00,
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

// Storage implementation
export class FileStorage implements IStorage {
  private users: Map<number, any>;
  private announcements: Map<number, any>;
  private logs: any[];
  private streamSettingsData: StreamSettings | undefined;
  private themeSettingsData: ThemeSettings | undefined;
  private webhookSettingsData: WebhookSettings | undefined;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.announcements = new Map();
    this.logs = [];
    this.currentId = {};
    this.streamSettingsData = {};
    this.themeSettingsData = {};
    this.webhookSettingsData = {};
    this.loadData();

    // Setup automated backups and data reloading every 5 minutes
    setInterval(() => {
      Promise.all([
        this.saveData().catch(err => {
          console.error("Automated backup failed:", err);
        }),
        this.loadData().catch(err => {
          console.error("Data reload failed:", err);
        })
      ]);
    }, 5 * 60 * 1000);
  }

  private async loadData() {
    await ensureDataDir();

    // Load all data from files
    const [users, announcements, logs, streamSettings, themeSettings, webhookSettings] = await Promise.all([
      readJsonFile('users.json'),
      readJsonFile('announcements.json'),
      readJsonFile('logs.json'),
      readJsonFile('streamSettings.json'),
      readJsonFile('themeSettings.json'),
      readJsonFile('webhookSettings.json')
    ]);

    if (users) {
      this.users = new Map(Object.entries(users));
      this.currentId.users = Math.max(...Array.from(this.users.keys())) + 1;
    }

    if (announcements) {
      this.announcements = new Map(Object.entries(announcements));
      this.currentId.announcements = Math.max(...Array.from(this.announcements.keys())) + 1;
    }

    if (logs) {
      this.logs = logs;
      this.currentId.logs = logs.length + 1;
    }

    if (streamSettings) {
      this.streamSettingsData = streamSettings;
    }

    if (themeSettings) {
      this.themeSettingsData = themeSettings;
    }

    if (webhookSettings) {
      this.webhookSettingsData = webhookSettings;
    }


    // Initialize with default admin if no users exist
    if (this.users.size === 0) {
      await this.createUser({
        username: "admin",
        password: "Rennsz5842"
      });
    }
  }

  private async saveData() {
    await Promise.all([
      writeJsonFile('users.json', Object.fromEntries(this.users)),
      writeJsonFile('announcements.json', Object.fromEntries(this.announcements)),
      writeJsonFile('logs.json', this.logs),
      writeJsonFile('streamSettings.json', this.streamSettingsData),
      writeJsonFile('themeSettings.json', this.themeSettingsData),
      writeJsonFile('webhookSettings.json', this.webhookSettingsData)
    ]);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentId.users || 1;
    this.currentId.users = id + 1;
    const user = { ...userData, id };
    this.users.set(id, user);
    await this.saveData();
    return user;
  }

  // Announcement operations
  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentId.announcements || 1;
    this.currentId.announcements = id + 1;
    const announcement = { ...data, id, createdAt: new Date() };
    this.announcements.set(id, announcement);
    await this.saveData();
    return announcement;
  }

  async updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement> {
    const announcement = this.announcements.get(id);
    if (!announcement) throw new Error('Announcement not found');
    const updated = { ...announcement, ...data };
    this.announcements.set(id, updated);
    await this.saveData();
    return updated;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    this.announcements.delete(id);
    await this.saveData();
  }

  // Stream operations
  async getStreamerStatus(channel: string): Promise<any> {
    // Mock implementation for demo purposes
    const isMainChannel = channel.toLowerCase() === "rennsz";
    const isGamingChannel = channel.toLowerCase() === "rennszino";

    // For a real implementation, this would call the Twitch API
    if (isMainChannel) {
      const isLive = Math.random() > 0.5; // Randomly determine if live for demo

      return {
        name: "RENNSZ",
        login: "rennsz",
        url: "https://www.twitch.tv/rennsz",
        isLive,
        profileImage: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80",
        ...(isLive ? {
          title: "IRL Tokyo Exploration!",
          game: "Just Chatting",
          viewers: Math.floor(Math.random() * 2000) + 500,
          startedAt: new Date(Date.now() - Math.floor(Math.random() * 10800000)),
          thumbnail: "https://images.unsplash.com/photo-1502519144081-acca18599776?w=600&q=80",
        } : {})
      };
    } else if (isGamingChannel) {
      const isLive = Math.random() > 0.7; // Less chance to be live

      return {
        name: "RENNSZINO",
        login: "rennszino",
        url: "https://www.twitch.tv/rennszino",
        isLive,
        profileImage: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80",
        ...(isLive ? {
          title: "Gaming Chill Stream",
          game: "Cyberpunk 2077",
          viewers: Math.floor(Math.random() * 1000) + 200,
          startedAt: new Date(Date.now() - Math.floor(Math.random() * 7200000)),
          thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
        } : {})
      };
    }

    return {
      isLive: false,
      name: channel,
      login: channel,
      url: `https://www.twitch.tv/${channel}`,
    };
  }

  async getAllStreamersStatus(): Promise<any> {
    const [main, gaming] = await Promise.all([
      this.getStreamerStatus("rennsz"),
      this.getStreamerStatus("rennszino"),
    ]);

    return { main, gaming };
  }

  async getLiveStreamer(): Promise<any> {
    const { main, gaming } = await this.getAllStreamersStatus();

    if (main.isLive) return main;
    if (gaming.isLive) return gaming;

    return null;
  }

  async getStreamSettings(): Promise<StreamSettings | undefined> {
    return this.streamSettingsData;
  }

  async updateStreamSettings(data: Partial<InsertStreamSettings>): Promise<StreamSettings> {
    this.streamSettingsData = {
      ...this.streamSettingsData,
      ...data,
      updatedAt: new Date()
    };
    await this.saveData();
    return this.streamSettingsData;
  }

  async getCurrentViewers(): Promise<{ viewers: number } | undefined> {
    // Mock implementation
    return { viewers: Math.floor(Math.random() * 2000) + 500 };
  }

  async getViewerMetrics(): Promise<any[]> {
    // Mock implementation - 7 days of viewer data
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        viewers: Math.floor(Math.random() * 2000) + 500,
      });
    }

    return data;
  }

  // Theme operations
  async getThemeSettings(): Promise<ThemeSettings | undefined> {
    return this.themeSettingsData;
  }

  async updateThemeSettings(data: Partial<InsertThemeSettings>): Promise<ThemeSettings> {
    this.themeSettingsData = {
      ...this.themeSettingsData,
      ...data,
      updatedAt: new Date()
    };
    await this.saveData();
    return this.themeSettingsData;
  }

  // System logs and webhooks
  async createSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const id = this.currentId.logs || 1;
    this.currentId.logs = id + 1;
    const log = { ...insertLog, id, timestamp: new Date() };
    this.logs.push(log);
    if (this.logs.length > 1000) this.logs = this.logs.slice(-1000);
    await this.saveData();
    return log;
  }

  async getSystemLogs(limit: number = 100): Promise<SystemLog[]> {
    return this.logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getRecentActivityLogs(limit: number = 10): Promise<SystemLog[]> {
    return this.logs
      .filter(log => log.level !== "error" || log.source !== "system") // Filter out system errors
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getWebhookSettings(): Promise<WebhookSettings | undefined> {
    return this.webhookSettingsData;
  }

  async updateWebhookSettings(data: InsertWebhookSettings): Promise<WebhookSettings> {
    this.webhookSettingsData = {
      ...this.webhookSettingsData,
      ...data,
      updatedAt: new Date()
    };
    await this.saveData();
    return this.webhookSettingsData;
  }

  // Stats and metrics
  async getWebsiteVisits(): Promise<{ visits: number } | undefined> {
    // Mock implementation
    return { visits: Math.floor(Math.random() * 10000) + 5000 };
  }
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Announcement operations
  getAllAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  // Stream operations
  getStreamerStatus(channel: string): Promise<any>;
  getAllStreamersStatus(): Promise<any>;
  getLiveStreamer(): Promise<any>;
  getStreamSettings(): Promise<StreamSettings | undefined>;
  updateStreamSettings(data: Partial<InsertStreamSettings>): Promise<StreamSettings>;
  getCurrentViewers(): Promise<{ viewers: number } | undefined>;
  getViewerMetrics(): Promise<any[]>;

  // Theme operations
  getThemeSettings(): Promise<ThemeSettings | undefined>;
  updateThemeSettings(data: Partial<InsertThemeSettings>): Promise<ThemeSettings>;

  // System logs and webhooks
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  getRecentActivityLogs(limit?: number): Promise<SystemLog[]>;
  getWebhookSettings(): Promise<WebhookSettings | undefined>;
  updateWebhookSettings(data: InsertWebhookSettings): Promise<WebhookSettings>;

  // Stats and metrics
  getWebsiteVisits(): Promise<{ visits: number } | undefined>;
}

export const storage = new FileStorage();