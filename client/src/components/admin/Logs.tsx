import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { sendAdminActionLog, testDiscordWebhook } from "@/lib/discord";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: number;
  level: "info" | "warning" | "error";
  message: string;
  timestamp: string;
  source: string;
}

interface WebhookSettings {
  url: string;
  logLevel: "info" | "warning" | "error";
  realTimeLogging: boolean;
}

export default function Logs() {
  const [webhookUrl, setWebhookUrl] = useState("https://discord.com/api/webhooks/1360625407740612771/2NBUC4S-X55I6FgdE-FMOwJWJ-XHRGtG_o2Q23EuU_XHzJKmy4xjx6IEsVpjYUxuQt4Z");
  const [logLevel, setLogLevel] = useState<"info" | "warning" | "error">("info");
  const [realTimeLogging, setRealTimeLogging] = useState(true);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/logs'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/logs");
      return res.json();
    },
    refetchInterval: realTimeLogging ? 5000 : false,
  });
  
  // Fetch webhook settings
  const { data: webhookSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/webhook-settings'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/webhook-settings");
      return res.json();
    },
  });
  
  // Save webhook settings mutation
  const saveWebhookSettingsMutation = useMutation({
    mutationFn: async (data: WebhookSettings) => {
      const res = await apiRequest("POST", "/api/admin/webhook-settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Webhook settings have been saved successfully",
        variant: "default",
      });
      sendAdminActionLog("Update Webhook Settings", "Updated Discord webhook configuration");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/webhook-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: `Failed to save webhook settings: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: testDiscordWebhook,
    onSuccess: () => {
      toast({
        title: "Webhook Test Successful",
        description: "Test message sent to Discord webhook",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Webhook Test Failed",
        description: `Failed to send test message: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Initialize form with webhook settings
  useEffect(() => {
    if (webhookSettings) {
      setWebhookUrl(webhookSettings.url || "");
      setLogLevel(webhookSettings.logLevel || "info");
      setRealTimeLogging(webhookSettings.realTimeLogging !== false);
    }
  }, [webhookSettings]);
  
  // Scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Save webhook settings
  const handleSaveWebhookSettings = () => {
    saveWebhookSettingsMutation.mutate({
      url: webhookUrl,
      logLevel,
      realTimeLogging,
    });
  };
  
  // Test webhook
  const handleTestWebhook = () => {
    testWebhookMutation.mutate();
  };
  
  // Get log entry class based on level
  const getLogEntryClass = (level: string) => {
    const classes: Record<string, string> = {
      info: "text-blue-400",
      warning: "text-yellow-400",
      error: "text-red-400",
    };
    
    return classes[level] || "text-gray-400";
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'short',
      timeStyle: 'medium'
    });
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary">System Logs</h2>
      
      {/* Activity Logs */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Activity Logs</h3>
            <div className="flex space-x-2">
              <Select 
                value={logLevel} 
                onValueChange={(value: "info" | "warning" | "error") => setLogLevel(value)}
              >
                <SelectTrigger className="w-32 h-8 text-xs bg-zinc-900 border-primary/30">
                  <SelectValue placeholder="Log Level" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-primary/30">
                  <SelectItem value="info">All Logs</SelectItem>
                  <SelectItem value="warning">Warnings & Errors</SelectItem>
                  <SelectItem value="error">Errors Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline" 
                size="sm"
                className="border-primary/30 text-primary h-8"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] })}
              >
                <i className="fas fa-sync-alt mr-1"></i> Refresh
              </Button>
            </div>
          </div>
          
          <div 
            ref={logContainerRef}
            className="bg-zinc-900 font-mono text-sm p-4 rounded-lg h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto"
          >
            {logsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-info-circle text-2xl mb-2"></i>
                <p>No logs available</p>
              </div>
            ) : (
              logs.map((log: LogEntry) => (
                <div key={log.id} className={getLogEntryClass(log.level)}>
                  [{formatTimestamp(log.timestamp)}] {log.level.toUpperCase()}: {log.message}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 text-gray-400 text-xs flex justify-between items-center">
            <span>
              <i className="fas fa-info-circle mr-1"></i>
              Showing {logs.length} log entries
            </span>
            <div className="flex items-center space-x-2">
              <Switch
                id="realTimeLogging"
                checked={realTimeLogging}
                onCheckedChange={setRealTimeLogging}
              />
              <Label htmlFor="realTimeLogging" className="text-xs">
                Real-time updates
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Webhook Settings */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">Webhook Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl" className="text-gray-300">Discord Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-zinc-900 border-primary/30 text-white focus:border-primary"
                disabled={saveWebhookSettingsMutation.isPending}
              />
              <p className="text-xs text-gray-400 mt-1">
                <i className="fas fa-info-circle mr-1"></i>
                All system logs will be sent to this Discord webhook
              </p>
            </div>
            
            <div>
              <Label htmlFor="logLevelSelect" className="text-gray-300">Log Level</Label>
              <Select 
                value={logLevel} 
                onValueChange={(value: "info" | "warning" | "error") => setLogLevel(value)}
                disabled={saveWebhookSettingsMutation.isPending}
              >
                <SelectTrigger id="logLevelSelect" className="bg-zinc-900 border-primary/30 text-white focus:border-primary">
                  <SelectValue placeholder="Select Log Level" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-primary/30">
                  <SelectItem value="info">Info (All logs)</SelectItem>
                  <SelectItem value="warning">Warning (Warnings and Errors only)</SelectItem>
                  <SelectItem value="error">Error (Errors only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="realTimeWebhookLogging"
                checked={realTimeLogging}
                onCheckedChange={setRealTimeLogging}
                disabled={saveWebhookSettingsMutation.isPending}
              />
              <Label htmlFor="realTimeWebhookLogging" className="text-gray-300">
                Enable real-time logging
              </Label>
            </div>
            
            <div className="pt-2 flex space-x-2">
              <Button
                onClick={handleSaveWebhookSettings}
                className="gold-gradient text-black font-bold hover:opacity-90"
                disabled={saveWebhookSettingsMutation.isPending}
              >
                {saveWebhookSettingsMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Saving...
                  </span>
                ) : (
                  "Save Webhook Settings"
                )}
              </Button>
              
              <Button
                onClick={handleTestWebhook}
                className="bg-[#6441A4]/80 text-white font-bold hover:bg-[#6441A4] transition"
                disabled={testWebhookMutation.isPending}
              >
                {testWebhookMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Testing...
                  </span>
                ) : (
                  "Test Webhook"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* System Backups */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">System Backups</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-zinc-900 p-4 rounded-lg border border-primary/20">
              <h4 className="text-sm text-gray-400 mb-1">Last Backup</h4>
              <p className="text-lg font-semibold">
                {settingsLoading ? "Loading..." : (webhookSettings?.lastBackup || "Never")}
              </p>
            </div>
            
            <div className="bg-zinc-900 p-4 rounded-lg border border-primary/20">
              <h4 className="text-sm text-gray-400 mb-1">Backup Frequency</h4>
              <p className="text-lg font-semibold">Every 5 minutes</p>
            </div>
            
            <div className="bg-zinc-900 p-4 rounded-lg border border-primary/20">
              <h4 className="text-sm text-gray-400 mb-1">Backup Status</h4>
              <p className="text-lg font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Active
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              className="bg-primary/20 text-primary hover:bg-primary/30 transition"
              onClick={() => {
                toast({
                  title: "Manual Backup Started",
                  description: "A manual backup has been initiated",
                  variant: "default",
                });
                sendAdminActionLog("Manual Backup", "Initiated a manual system backup");
              }}
            >
              <i className="fas fa-download mr-2"></i> Manual Backup
            </Button>
            
            <Button
              variant="outline"
              className="border-primary/30 text-primary"
              onClick={() => {
                toast({
                  title: "Backup Settings",
                  description: "Backup configuration screen would open here",
                  variant: "default",
                });
              }}
            >
              <i className="fas fa-cog mr-2"></i> Backup Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
