
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PremiumFeatures() {
  const [features, setFeatures] = useState({
    prioritySupport: false,
    highRateLimits: false,
    earlyAccess: false,
    autoPosting: false,
    socialAnalytics: false,
    socialWidgets: false,
    crossPlatformPosting: false,
    ddosProtection: false,
    ipWhitelisting: false,
    twoFactor: false
  });
  
  const { toast } = useToast();

  const toggleFeature = async (feature: string) => {
    try {
      const newValue = !features[feature as keyof typeof features];
      await apiRequest("POST", "/api/admin/premium/features", {
        feature,
        enabled: newValue
      });
      
      setFeatures(prev => ({
        ...prev,
        [feature]: newValue
      }));

      toast({
        title: "Feature Updated",
        description: `${feature} has been ${newValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Premium Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Social Media Integration</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-Posting</h4>
                  <p className="text-sm text-muted-foreground">Schedule and automate posts across platforms</p>
                </div>
                <Switch checked={features.autoPosting} onCheckedChange={() => toggleFeature('autoPosting')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Social Analytics</h4>
                  <p className="text-sm text-muted-foreground">Advanced metrics and engagement tracking</p>
                </div>
                <Switch checked={features.socialAnalytics} onCheckedChange={() => toggleFeature('socialAnalytics')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Custom Widgets</h4>
                  <p className="text-sm text-muted-foreground">Embed customizable social media feeds</p>
                </div>
                <Switch checked={features.socialWidgets} onCheckedChange={() => toggleFeature('socialWidgets')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Cross-Platform Posting</h4>
                  <p className="text-sm text-muted-foreground">Post to multiple platforms simultaneously</p>
                </div>
                <Switch checked={features.crossPlatformPosting} onCheckedChange={() => toggleFeature('crossPlatformPosting')} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Security</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">DDoS Protection</h4>
                  <p className="text-sm text-muted-foreground">Advanced protection against DDoS attacks</p>
                </div>
                <Switch checked={features.ddosProtection} onCheckedChange={() => toggleFeature('ddosProtection')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">IP Whitelisting</h4>
                  <p className="text-sm text-muted-foreground">Restrict access to trusted IP addresses</p>
                </div>
                <Switch checked={features.ipWhitelisting} onCheckedChange={() => toggleFeature('ipWhitelisting')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">Enhanced account security</p>
                </div>
                <Switch checked={features.twoFactor} onCheckedChange={() => toggleFeature('twoFactor')} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
