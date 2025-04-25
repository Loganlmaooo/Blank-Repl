
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Security() {
  const [settings, setSettings] = useState({
    ddosProtection: false,
    ipWhitelisting: false,
    twoFactor: false,
  });
  
  const [ipList, setIpList] = useState("");
  const { toast } = useToast();

  const handleSettingChange = async (setting: string) => {
    try {
      const newValue = !settings[setting as keyof typeof settings];
      setSettings(prev => ({ ...prev, [setting]: newValue }));
      
      toast({
        title: "Security Setting Updated",
        description: `${setting} has been ${newValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security setting",
        variant: "destructive",
      });
    }
  };

  const handleIPListSave = () => {
    // Validate IP addresses
    const ips = ipList.split(',').map(ip => ip.trim());
    const validIPs = ips.every(ip => 
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)
    );

    if (!validIPs) {
      toast({
        title: "Invalid IP Addresses",
        description: "Please enter valid IP addresses",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "IP Whitelist Updated",
      description: "IP whitelist has been updated successfully",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">DDoS Protection</h3>
                  <p className="text-sm text-muted-foreground">Advanced protection against DDoS attacks</p>
                </div>
                <Switch 
                  checked={settings.ddosProtection}
                  onCheckedChange={() => handleSettingChange('ddosProtection')}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">IP Whitelisting</h3>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch 
                    checked={settings.ipWhitelisting}
                    onCheckedChange={() => handleSettingChange('ipWhitelisting')}
                  />
                </div>
                {settings.ipWhitelisting && (
                  <div className="space-y-2">
                    <Label htmlFor="ipList">Allowed IP Addresses (comma-separated)</Label>
                    <Input
                      id="ipList"
                      value={ipList}
                      onChange={(e) => setIpList(e.target.value)}
                      placeholder="192.168.1.1, 10.0.0.1"
                    />
                    <Button onClick={handleIPListSave} className="w-full">Save IP List</Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Enhance account security with 2FA</p>
                </div>
                <Switch 
                  checked={settings.twoFactor}
                  onCheckedChange={() => handleSettingChange('twoFactor')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
