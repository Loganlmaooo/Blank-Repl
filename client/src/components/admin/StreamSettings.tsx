import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAllStreamersStatus, StreamerInfo } from "@/lib/twitch";
import { sendAdminActionLog } from "@/lib/discord";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate, timeAgo } from "@/lib/utils";

export default function StreamSettings() {
  const [featuredStream, setFeaturedStream] = useState<string>("auto");
  const [customEmbedUrl, setCustomEmbedUrl] = useState<string>("");
  const [scheduleImage, setScheduleImage] = useState<File | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch current stream settings
  const { data: streamSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/stream-settings'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stream-settings");
      return res.json();
    },
  });
  
  // Fetch streamers status
  const { data: streamers, isLoading: streamersLoading } = useQuery({
    queryKey: ['/api/twitch/streamers'],
    queryFn: getAllStreamersStatus,
  });
  
  // Update featured stream mutation
  const updateFeaturedStreamMutation = useMutation({
    mutationFn: async (data: { featured: string; customUrl?: string }) => {
      const res = await apiRequest("POST", "/api/admin/stream-settings/featured", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Stream Settings Updated",
        description: "Featured stream has been updated successfully",
        variant: "default",
      });
      sendAdminActionLog(
        "Update Featured Stream", 
        `Changed featured stream to: ${variables.featured}${variables.customUrl ? ' (custom URL)' : ''}`
      );
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stream-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update featured stream: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Upload schedule image mutation
  const uploadScheduleImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("scheduleImage", file);
      
      const res = await fetch("/api/admin/stream-settings/schedule-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Image Uploaded",
        description: "Schedule image has been uploaded successfully",
        variant: "default",
      });
      sendAdminActionLog("Upload Schedule Image", "Updated stream schedule image");
      setScheduleImage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stream-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: `Failed to upload schedule image: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Update featured stream
  const handleUpdateFeaturedStream = () => {
    const data: { featured: string; customUrl?: string } = {
      featured: featuredStream,
    };
    
    if (featuredStream === "custom" && customEmbedUrl) {
      data.customUrl = customEmbedUrl;
    }
    
    updateFeaturedStreamMutation.mutate(data);
  };
  
  // Handle schedule image upload
  const handleScheduleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScheduleImage(e.target.files[0]);
    }
  };
  
  // Upload schedule image
  const uploadScheduleImage = () => {
    if (scheduleImage) {
      uploadScheduleImageMutation.mutate(scheduleImage);
    }
  };
  
  // Initialize form data if available
  useState(() => {
    if (streamSettings) {
      setFeaturedStream(streamSettings.featuredStream || "auto");
      if (streamSettings.customEmbedUrl) {
        setCustomEmbedUrl(streamSettings.customEmbedUrl);
      }
    }
  });
  
  // Format streamer duration
  const formatStreamDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(((now.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffInHours}h ${diffInMinutes}m`;
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary">Stream Settings</h2>
      
      {/* Featured Stream */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">Featured Stream</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="featuredStream" className="text-gray-300">Select Featured Stream</Label>
              <Select 
                value={featuredStream} 
                onValueChange={setFeaturedStream}
                disabled={updateFeaturedStreamMutation.isPending}
              >
                <SelectTrigger id="featuredStream" className="bg-zinc-900 border-primary/30 text-white focus:border-primary">
                  <SelectValue placeholder="Select Featured Stream" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-primary/30">
                  <SelectItem value="auto">Auto Detect Live Stream</SelectItem>
                  <SelectItem value="main">Main Channel (IRL)</SelectItem>
                  <SelectItem value="gaming">Gaming Channel</SelectItem>
                  <SelectItem value="custom">Custom Embed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {featuredStream === "custom" && (
              <div>
                <Label htmlFor="customEmbedUrl" className="text-gray-300">Custom Embed URL</Label>
                <Input
                  id="customEmbedUrl"
                  value={customEmbedUrl}
                  onChange={(e) => setCustomEmbedUrl(e.target.value)}
                  className="bg-zinc-900 border-primary/30 text-white focus:border-primary"
                  placeholder="https://player.twitch.tv/?channel=..."
                  disabled={updateFeaturedStreamMutation.isPending}
                />
              </div>
            )}
            
            <div>
              <Button
                onClick={handleUpdateFeaturedStream}
                className="gold-gradient text-black font-bold hover:opacity-90"
                disabled={updateFeaturedStreamMutation.isPending}
              >
                {updateFeaturedStreamMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Updating...
                  </span>
                ) : (
                  "Update Featured Stream"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stream Information */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">Stream Information</h3>
          
          {streamersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Channel */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-primary/20">
                <h4 className="font-bold flex items-center">
                  <i className="fas fa-video text-[#6441A4] mr-2"></i> Main Channel (IRL)
                </h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={streamers?.main.isLive ? "text-green-500 font-semibold" : "text-gray-500 font-semibold"}>
                      {streamers?.main.isLive ? "LIVE" : "OFFLINE"}
                    </span>
                  </div>
                  {streamers?.main.isLive && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Viewers:</span>
                        <span>{streamers?.main.viewers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stream Title:</span>
                        <span>{streamers?.main.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Started:</span>
                        <span>{streamers?.main.startedAt ? timeAgo(streamers.main.startedAt) : "Unknown"}</span>
                      </div>
                      {streamers?.main.game && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Game/Category:</span>
                          <span>{streamers.main.game}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Gaming Channel */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-primary/20">
                <h4 className="font-bold flex items-center">
                  <i className="fas fa-gamepad text-[#6441A4] mr-2"></i> Gaming Channel
                </h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={streamers?.gaming.isLive ? "text-green-500 font-semibold" : "text-gray-500 font-semibold"}>
                      {streamers?.gaming.isLive ? "LIVE" : "OFFLINE"}
                    </span>
                  </div>
                  {streamers?.gaming.isLive ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Viewers:</span>
                        <span>{streamers?.gaming.viewers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stream Title:</span>
                        <span>{streamers?.gaming.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Started:</span>
                        <span>{streamers?.gaming.startedAt ? timeAgo(streamers.gaming.startedAt) : "Unknown"}</span>
                      </div>
                      {streamers?.gaming.game && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Game/Category:</span>
                          <span>{streamers.gaming.game}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Live:</span>
                      <span>{streamSettings?.lastGameStream || "Unknown"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Schedule Settings */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-bold mb-4">Schedule Settings</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scheduleImage" className="text-gray-300">Upload Stream Schedule Image</Label>
                <div className="flex items-center mt-2">
                  <input 
                    type="file" 
                    id="scheduleImage" 
                    className="hidden" 
                    onChange={handleScheduleImageUpload}
                    accept="image/*"
                  />
                  <Label 
                    htmlFor="scheduleImage" 
                    className="px-4 py-2 rounded-md bg-zinc-800 text-primary border border-primary/30 cursor-pointer hover:bg-zinc-700 transition"
                  >
                    Choose File
                  </Label>
                  <span className="ml-3 text-sm text-gray-400">
                    {scheduleImage ? scheduleImage.name : "No file chosen"}
                  </span>
                </div>
                
                {scheduleImage && (
                  <div className="mt-3">
                    <Button
                      onClick={uploadScheduleImage}
                      className="gold-gradient text-black font-bold hover:opacity-90"
                      disabled={uploadScheduleImageMutation.isPending}
                    >
                      {uploadScheduleImageMutation.isPending ? (
                        <span className="flex items-center">
                          <i className="fas fa-circle-notch fa-spin mr-2"></i>
                          Uploading...
                        </span>
                      ) : (
                        "Upload Schedule Image"
                      )}
                    </Button>
                  </div>
                )}
                
                {streamSettings?.scheduleImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Current Schedule Image:</p>
                    <div className="bg-zinc-900 p-2 rounded border border-primary/20">
                      <img 
                        src={streamSettings.scheduleImageUrl} 
                        alt="Stream Schedule" 
                        className="max-h-60 rounded mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
