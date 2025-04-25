
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AIEnhancer() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("enhance");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAIAction = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/admin/ai/enhance", {
        prompt,
        mode,
        context: {
          codebase: "client",
          type: mode
        }
      });
      
      const data = await response.json();
      
      toast({
        title: "AI Response Received",
        description: data.message || "AI processing complete",
        variant: "default",
      });
      
      setPrompt("");
    } catch (error) {
      toast({
        title: "AI Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">AI Assistant</h3>
          <p className="text-gray-400 mb-4">
            Connect with an AI assistant to enhance your website or get recommendations.
          </p>
          
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="mb-4 bg-zinc-900 border-primary/30">
              <SelectValue placeholder="Select Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enhance">Code Enhancement</SelectItem>
              <SelectItem value="analyze">Code Analysis</SelectItem>
              <SelectItem value="suggest">Feature Suggestions</SelectItem>
              <SelectItem value="debug">Debug Assistant</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like the AI to help you with?"
            className="min-h-[100px] mb-4 bg-zinc-900 border-primary/30"
          />
          <Button
            onClick={handleAIAction}
            className="gold-gradient text-black font-bold hover:opacity-90"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <span className="flex items-center">
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
                Processing...
              </span>
            ) : (
              <>
                <i className="fas fa-robot mr-2"></i>
                Ask AI Assistant
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
