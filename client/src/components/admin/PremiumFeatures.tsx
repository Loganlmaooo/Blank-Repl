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
    socialIntegration: false
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
                  <p className="text-sm text-muted-foreground">1000 requests per minute + no artificial delays</p>
                </div>
                <Switch checked={features.highRateLimits} onCheckedChange={() => toggleFeature('highRateLimits')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Early Access</h4>
                  <p className="text-sm text-muted-foreground">Get early access to new features and updates</p>
                </div>
                <Switch checked={features.earlyAccess} onCheckedChange={() => toggleFeature('earlyAccess')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Social Integration</h4>
                  <p className="text-sm text-muted-foreground">Advanced social media integration features</p>
                </div>
                <Switch checked={features.socialIntegration} onCheckedChange={() => toggleFeature('socialIntegration')} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}