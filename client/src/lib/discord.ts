import { apiRequest } from "./queryClient";

const WEBHOOK_URL = "https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z";

interface LogOptions {
  title?: string;
  description: string;
  color?: number; // Discord embed color
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: boolean;
}

export async function sendDiscordLog(options: LogOptions) {
  const { title, description, color = 0xD4AF37, fields, footer, timestamp } = options;
  
  try {
    // Using the simplified API format for Discord logging
    const payload = {
      title: title || "RENNSZ Website Log",
      description,
      color,
      fields,
      footer: footer || { 
        text: "RENNSZ Website Logs", 
        icon_url: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=48&h=48&q=80" 
      },
      timestamp: timestamp ? new Date().toISOString() : undefined,
    };
    
    // Send using the direct format expected by the server 
    // (which will be converted to embeds on the server side)
    const response = await fetch("/api/discord/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Discord log failed: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Failed to send Discord log:", error);
    return false;
  }
}

// Admin action logs
export async function sendAdminLoginLog(username: string, success: boolean) {
  return sendDiscordLog({
    title: success ? "Admin Login Successful" : "Admin Login Failed",
    description: `User ${username} ${success ? "logged in successfully" : "failed to log in"}`,
    color: success ? 0x00FF00 : 0xFF0000,
    timestamp: true,
  });
}

export async function sendAdminActionLog(action: string, details: string) {
  return sendDiscordLog({
    title: "Admin Action",
    description: `**${action}**\n${details}`,
    color: 0x0099FF,
    timestamp: true,
  });
}

// System logs
export async function sendSystemLog(type: "info" | "warning" | "error", message: string) {
  const colorMap = {
    info: 0x0099FF,
    warning: 0xFFCC00,
    error: 0xFF0000,
  };
  
  return sendDiscordLog({
    title: `System ${type.toUpperCase()}`,
    description: message,
    color: colorMap[type],
    timestamp: true,
  });
}

// Stream status logs
export async function sendStreamStatusLog(channelName: string, status: "live" | "offline") {
  return sendDiscordLog({
    title: `Stream Status Update`,
    description: `**${channelName}** is now **${status.toUpperCase()}**`,
    color: status === "live" ? 0xFF0000 : 0x808080,
    timestamp: true,
  });
}

// User activity logs
export async function sendUserActivityLog(activity: string, details: string = "") {
  return sendDiscordLog({
    title: "User Activity",
    description: `**${activity}**${details ? `\n${details}` : ""}`,
    color: 0x7289DA,
    timestamp: true,
  });
}

// Page navigation logs
export async function sendPageViewLog(page: string, deviceInfo: string = "") {
  return sendDiscordLog({
    title: "Page View",
    description: `User visited **${page}**`,
    fields: deviceInfo ? [{ name: "Device Info", value: deviceInfo }] : undefined,
    color: 0x43B581,
    timestamp: true,
  });
}

// Announcement interaction logs
export async function sendAnnouncementInteractionLog(action: "view" | "click", announcementId: number, title: string) {
  return sendDiscordLog({
    title: "Announcement Interaction",
    description: `User ${action === "view" ? "viewed" : "clicked"} announcement: **${title}**`,
    fields: [{ name: "Announcement ID", value: `#${announcementId}` }],
    color: 0xFAA61A,
    timestamp: true,
  });
}

// Theme change logs
export async function sendThemeChangeLog(oldTheme: string, newTheme: string) {
  return sendDiscordLog({
    title: "Theme Changed",
    description: `Theme changed from **${oldTheme}** to **${newTheme}**`,
    color: 0xF04747,
    timestamp: true,
  });
}

// Social media interaction logs
export async function sendSocialMediaInteractionLog(platform: string, action: string) {
  try {
    // Using the direct simplified format for social media interactions
    const response = await fetch("/api/discord/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        platform, 
        action 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Social media log failed: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("Failed to send social media interaction log:", error);
    // Fallback to traditional method if the simplified approach fails
    return sendDiscordLog({
      title: "Social Media Interaction",
      description: `User ${action} **${platform}**`,
      color: 0x593695,
      timestamp: true,
    });
  }
}

// Site performance logs
export async function sendPerformanceLog(metric: string, value: number, unit: string = "ms") {
  return sendDiscordLog({
    title: "Performance Metric",
    description: `**${metric}**: ${value}${unit}`,
    color: 0x747F8D,
    timestamp: true,
  });
}

// Error logs
export async function sendErrorLog(errorType: string, message: string, stackTrace?: string) {
  return sendDiscordLog({
    title: "Error Occurred",
    description: `**${errorType}**: ${message}`,
    fields: stackTrace ? [{ name: "Stack Trace", value: stackTrace.substring(0, 1000) }] : undefined,
    color: 0xF04747,
    timestamp: true,
  });
}

// Backup logs
export async function sendBackupLog(status: "success" | "failure", details: string = "") {
  return sendDiscordLog({
    title: `Backup ${status === "success" ? "Successful" : "Failed"}`,
    description: details || `Website backup ${status === "success" ? "completed successfully" : "failed"}`,
    color: status === "success" ? 0x43B581 : 0xF04747,
    timestamp: true,
  });
}

// Test webhook
export async function testDiscordWebhook() {
  return sendDiscordLog({
    title: "Webhook Test",
    description: "This is a test message to verify the Discord webhook integration is working correctly.",
    color: 0xD4AF37,
    timestamp: true,
  });
}
