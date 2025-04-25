
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

export default function WebsiteContent() {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");

  const updateContent = async () => {
    await apiRequest("POST", "/api/admin/content", {
      hero: { title: heroTitle, description: heroDescription }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Website Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Hero Title</label>
              <Input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Enter hero title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hero Description</label>
              <Textarea
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Enter hero description"
              />
            </div>
            <Button onClick={updateContent}>Update Content</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
