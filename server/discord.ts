// Using cross-fetch for HTTP requests
import fetch from "cross-fetch";
import { z } from "zod";
import { storage } from "./storage";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z";

// Discord webhook message schema
const embedSchema = z.object({
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

type DiscordEmbed = z.infer<typeof embedSchema>;

const webhookMessageSchema = z.object({
  content: z.string().optional(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
  embeds: z.array(embedSchema).optional(),
});

type WebhookMessage = z.infer<typeof webhookMessageSchema>;

// Initialize webhook client
export const discordWebhook = {
  url: DISCORD_WEBHOOK_URL,
  username: "RENNSZ Website",
  avatar_url: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80",
};

/**
 * Sends a message to the Discord webhook
 */
export async function sendWebhookMessage(
  message: WebhookMessage | DiscordEmbed | { embeds: DiscordEmbed[], webhookUrl?: string }
): Promise<boolean> {
  try {
    // Check if message contains a direct webhookUrl
    let webhookUrl: string;
    
    if ('webhookUrl' in message && message.webhookUrl) {
      webhookUrl = message.webhookUrl;
      // Remove webhookUrl from message to avoid sending it to Discord
      const { webhookUrl: _, ...restMessage } = message;
      message = restMessage as any;
    } else {
      // Get webhook settings from storage
      const webhookSettings = await storage.getWebhookSettings();
      webhookUrl = webhookSettings?.url || discordWebhook.url;
    }
    
    // If we have a direct embed object, wrap it in a webhook message
    let webhookMessage: WebhookMessage;
    if ("description" in message) {
      webhookMessage = {
        username: discordWebhook.username,
        avatar_url: discordWebhook.avatar_url,
        embeds: [message as DiscordEmbed],
      };
    } else {
      webhookMessage = {
        username: discordWebhook.username,
        avatar_url: discordWebhook.avatar_url,
        ...message,
      };
    }
    
    // Validate message
    try {
      webhookMessageSchema.parse(webhookMessage);
    } catch (error) {
      console.error("Invalid webhook message format:", error);
      return false;
    }
    
    // Send message to Discord
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookMessage),
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

/**
 * Send a system backup log to Discord
 */
export async function sendBackupLog(
  success: boolean,
  details: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: success ? "System Backup Successful" : "System Backup Failed",
    description: details,
    color: success ? 0x00FF00 : 0xFF0000,
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website Backup System",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Send a site traffic log to Discord
 */
export async function sendTrafficLog(
  stats: { visits: number; viewers: number; duration: string }
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: "Traffic Report",
    description: "Latest website traffic statistics",
    color: 0x0099FF,
    fields: [
      {
        name: "Website Visits",
        value: stats.visits.toString(),
        inline: true,
      },
      {
        name: "Stream Viewers",
        value: stats.viewers.toString(),
        inline: true,
      },
      {
        name: "Average Session",
        value: stats.duration,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website Analytics",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Send a theme change log to Discord
 */
export async function sendThemeChangeLog(
  theme: string,
  changedBy: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: "Theme Changed",
    description: `Website theme has been updated to **${theme}**`,
    color: 0xD4AF37,
    fields: [
      {
        name: "Changed By",
        value: changedBy,
      },
      {
        name: "Timestamp",
        value: new Date().toLocaleString(),
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website Appearance System",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Send a system error log to Discord
 */
export async function sendErrorLog(
  error: Error,
  context: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: "System Error",
    description: `An error occurred in the ${context}`,
    color: 0xFF0000,
    fields: [
      {
        name: "Error Message",
        value: error.message,
      },
      {
        name: "Stack Trace",
        value: error.stack ? error.stack.substring(0, 1000) : "No stack trace available",
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website Error Monitoring",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Send a stream status change log to Discord
 */
export async function sendStreamStatusLog(
  channel: string,
  isLive: boolean,
  viewers?: number,
  title?: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: isLive ? "🔴 Stream Online" : "⚫ Stream Offline",
    description: `Channel: **${channel}** is now ${isLive ? "LIVE" : "OFFLINE"}`,
    color: isLive ? 0xFF0000 : 0x808080,
    fields: [
      ...(isLive && viewers
        ? [
            {
              name: "Viewers",
              value: viewers.toString(),
              inline: true,
            },
          ]
        : []),
      ...(isLive && title
        ? [
            {
              name: "Title",
              value: title,
              inline: true,
            },
          ]
        : []),
      {
        name: "Timestamp",
        value: new Date().toLocaleString(),
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Stream Monitoring",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Send an announcement log to Discord
 */
export async function sendAnnouncementLog(
  title: string,
  content: string,
  category: string,
  isPinned: boolean
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: `New ${isPinned ? "Pinned " : ""}Announcement`,
    description: title,
    color: categoryColor(category),
    fields: [
      {
        name: "Content",
        value: content.length > 1000 ? content.substring(0, 997) + "..." : content,
      },
      {
        name: "Category",
        value: category,
        inline: true,
      },
      {
        name: "Status",
        value: isPinned ? "📌 Pinned" : "Regular",
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website Announcements",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Get color for announcement category
 */
function categoryColor(category: string): number {
  switch (category.toLowerCase()) {
    case "event":
      return 0xD4AF37; // Gold
    case "important":
      return 0xFF0000; // Red
    case "stream":
      return 0x0099FF; // Blue
    case "general":
    default:
      return 0x9B59B6; // Purple
  }
}

/**
 * Send a security alert to Discord
 */
export async function sendSecurityAlert(
  action: string,
  ip: string,
  details: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: "⚠️ Security Alert",
    description: action,
    color: 0xFF4500, // Orange-red
    fields: [
      {
        name: "IP Address",
        value: ip,
        inline: true,
      },
      {
        name: "Details",
        value: details,
      },
      {
        name: "Timestamp",
        value: new Date().toLocaleString(),
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website Security System",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}

/**
 * Test the Discord webhook
 */
export async function testDiscordWebhook(): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: "🧪 Webhook Test",
    description: "This is a test message to verify the Discord webhook integration is working correctly.",
    color: 0xD4AF37,
    fields: [
      {
        name: "Status",
        value: "✅ Connected",
        inline: true,
      },
      {
        name: "Timestamp",
        value: new Date().toLocaleString(),
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "RENNSZ Website System",
    },
  };
  
  return sendWebhookMessage({ embeds: [embed] });
}
