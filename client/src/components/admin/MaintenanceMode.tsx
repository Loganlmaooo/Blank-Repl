
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/ThemeContext";

export default function MaintenanceMode() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("Site is under maintenance. Please check back later.");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, updateTheme } = useTheme();

  // Fetch current theme settings
  const { data: settings } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/theme-settings");
      return res;
    },
  });

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.maintenanceMode || false);
      setMessage(settings.maintenanceMessage || "Site is under maintenance. Please check back later.");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/theme-settings", {
        theme: theme.name,
        maintenanceMode: isEnabled,
        maintenanceMessage: message || "Site is under maintenance. Please check back later.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      updateTheme({
        ...theme,
        maintenanceMode: isEnabled,
        maintenanceMessage: message || "Site is under maintenance. Please check back later.",
        maintenanceMode: isEnabled,
        maintenanceMessage: message,
      });
      toast({
        title: "Maintenance Mode Updated",
        description: isEnabled ? "Site is now in maintenance mode" : "Site is now live",
      });
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Maintenance Mode</h3>
              <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
            </div>
            <Switch 
              checked={isEnabled}
              onCheckedChange={(checked) => {
                setIsEnabled(checked);
                setMessage(message || "Site is under maintenance. Please check back later.");
              }}
            />
          </div>
          <div>
            <h3 className="font-medium mb-2">Maintenance Message</h3>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter maintenance message"
            />
          </div>
          <Button 
            onClick={handleSubmit}
            className="w-full"
          >
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
