
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
    analytics: false,
    ddosProtection: false,
    twoFactor: false,
    contentVersioning: false,
    backupRestore: false
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
              <h3 className="font-semibold">Performance</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Priority Support</h4>
                  <p className="text-sm text-muted-foreground">Get faster response times and dedicated support</p>
                </div>
                <Switch checked={features.prioritySupport} onCheckedChange={() => toggleFeature('prioritySupport')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Higher Rate Limits</h4>
                  <p className="text-sm text-muted-foreground">Increased API and request limits</p>
                </div>
                <Switch checked={features.highRateLimits} onCheckedChange={() => toggleFeature('highRateLimits')} />
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
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">Enhanced account security</p>
                </div>
                <Switch checked={features.twoFactor} onCheckedChange={() => toggleFeature('twoFactor')} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Content</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Content Versioning</h4>
                  <p className="text-sm text-muted-foreground">Track and restore content versions</p>
                </div>
                <Switch checked={features.contentVersioning} onCheckedChange={() => toggleFeature('contentVersioning')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Backup & Restore</h4>
                  <p className="text-sm text-muted-foreground">Automated backups and restore capabilities</p>
                </div>
                <Switch checked={features.backupRestore} onCheckedChange={() => toggleFeature('backupRestore')} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
