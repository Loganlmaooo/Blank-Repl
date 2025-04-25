
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Customization() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Website Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Primary Color</label>
              <Input type="color" className="h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Font Family</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="opensans">Open Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Save Customization</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
