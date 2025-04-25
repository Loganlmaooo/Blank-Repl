import { apiRequest } from "./queryClient";
import { sendStreamStatusLog } from "./discord";

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchChannel {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export interface StreamerInfo {
  name: string;
  url: string;
  isLive: boolean;
  title?: string;
  game?: string;
  viewers?: number;
  startedAt?: string;
  thumbnail?: string;
  profileImage?: string;
}

const STREAMERS = {
  main: {
    name: "RENNSZ",
    login: "rennsz",
    url: "https://www.twitch.tv/rennsz",
    description: "IRL Streamer",
  },
  gaming: {
    name: "RENNSZINO",
    login: "rennszino",
    url: "https://www.twitch.tv/rennszino",
    description: "Gaming/Chilling",
  },
};

export async function getStreamerStatus(streamer: "main" | "gaming"): Promise<StreamerInfo> {
  try {
    const streamerData = STREAMERS[streamer];
    const response = await apiRequest("GET", `/api/twitch/streams/${streamerData.login}`);
    const data = await response.json();
    
    if (data && data.isLive) {
      return {
        name: streamerData.name,
        url: streamerData.url,
        isLive: true,
        title: data.title,
        game: data.game,
        viewers: data.viewers,
        startedAt: data.startedAt,
        thumbnail: data.thumbnail,
        profileImage: data.profileImage,
      };
    }
    
    return {
      name: streamerData.name,
      url: streamerData.url,
      isLive: false,
      profileImage: data.profileImage,
    };
  } catch (error) {
    console.error(`Failed to fetch ${streamer} streamer status:`, error);
    return {
      name: STREAMERS[streamer].name,
      url: STREAMERS[streamer].url,
      isLive: false,
    };
  }
}

export async function getAllStreamersStatus(): Promise<Record<"main" | "gaming", StreamerInfo>> {
  const [main, gaming] = await Promise.all([
    getStreamerStatus("main"),
    getStreamerStatus("gaming"),
  ]);
  
  return { main, gaming };
}

export async function getLiveStreamer(): Promise<StreamerInfo | null> {
  const statuses = await getAllStreamersStatus();
  
  if (statuses.main.isLive) return statuses.main;
  if (statuses.gaming.isLive) return statuses.gaming;
  
  return null;
}

export async function getTwitchEmbedUrl(channel: string, parent: string): Promise<string> {
  return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=false`;
}

export function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}

export function getStreamDuration(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = new Date().getTime();
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  return `${hours}h ${minutes}m`;
}
