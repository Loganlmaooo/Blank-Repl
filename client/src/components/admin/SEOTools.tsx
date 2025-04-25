
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SEOTools() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const { toast } = useToast();
  
  const handleAnalyze = async () => {
    try {
      const response = await fetch(`/api/admin/seo/analyze?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.success) {
        setTitle(data.meta.title || "");
        setDescription(data.meta.description || "");
        setKeywords(data.meta.keywords || "");
        
        toast({
          title: "Analysis Complete",
          description: "Page metadata has been analyzed",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze page metadata",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch("/api/admin/seo/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, keywords }),
      });
      
      if (response.ok) {
        toast({
          title: "SEO Updated",
          description: "Meta tags have been updated successfully",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update meta tags",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary">SEO Tools</h2>
      
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page URL</Label>
              <div className="flex space-x-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter page URL to analyze"
                  className="bg-zinc-900/50"
                />
                <Button 
                  onClick={handleAnalyze}
                  className="gold-gradient text-black font-bold hover:opacity-90"
                >
                  Analyze
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meta title"
                className="bg-zinc-900/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter meta description"
                className="bg-zinc-900/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Keywords</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter keywords (comma-separated)"
                className="bg-zinc-900/50"
              />
            </div>

            <Button
              onClick={handleUpdate}
              className="w-full gold-gradient text-black font-bold hover:opacity-90"
            >
              Update Meta Tags
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
