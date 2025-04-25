
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function Security() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">IP Whitelisting</h3>
                <p className="text-sm text-muted-foreground">Restrict access by IP</p>
              </div>
              <Switch />
            </div>
            <Button className="w-full">Update Security Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
