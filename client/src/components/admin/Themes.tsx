import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { sendAdminActionLog } from "@/lib/discord";
import { THEMES, ThemeName, Theme, createCustomTheme, applyTheme } from "@/lib/theme";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function Themes() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("default");
  const [particleEffect, setParticleEffect] = useState("none");
  const [themeUsageStats, setThemeUsageStats] = useState<{
    name: string;
    usage: number;
    avgDuration: number;
  }[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    fps: number;
    memory: number;
    loadTime: number;
  }>({ fps: 60, memory: 0, loadTime: 0 });

  useEffect(() => {
    // Simulate fetching theme analytics
    setThemeUsageStats([
      { name: "default", usage: 45, avgDuration: 120 },
      { name: "christmas", usage: 15, avgDuration: 60 },
      { name: "halloween", usage: 20, avgDuration: 90 },
      { name: "custom", usage: 20, avgDuration: 180 }
    ]);

    // Monitor performance
    const updatePerformance = () => {
      setPerformanceMetrics({
        fps: Math.round(performance.now() / 1000),
        memory: performance.memory?.usedJSHeapSize || 0,
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
      });
    };

    const interval = setInterval(updatePerformance, 1000);
    return () => clearInterval(interval);
  }, []); // Added state for particle effect

  // Custom theme colors
  const [primaryColor, setPrimaryColor] = useState("#D4AF37");
  const [secondaryColor, setSecondaryColor] = useState("#2A2A2A");
  const [accentColor, setAccentColor] = useState("#D4AF37");
  const [backgroundColor, setBackgroundColor] = useState("#121212");
  const [textColor, setTextColor] = useState("#FFFFFF");

  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ThemeName | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { theme, updateTheme } = useTheme();

  // Fetch current theme settings
  const { data: themeSettings, isLoading: themeLoading } = useQuery({
    queryKey: ['/api/admin/theme-settings'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/theme-settings");
      return res.json();
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (data: { theme: ThemeName }) => {
      const res = await apiRequest("POST", "/api/admin/theme-settings", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Theme Updated",
        description: "The site theme has been updated successfully",
        variant: "default",
      });
      sendAdminActionLog("Update Theme", `Changed theme to: ${variables.theme}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/theme-settings'] });

      // Apply the theme in the frontend
      if (variables.theme !== "custom") {
        updateTheme(THEMES[variables.theme]);
      }
    },
    onError: (error) => {
      toast({
        title: "Theme Update Failed",
        description: `Failed to update theme: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Save custom theme mutation
  const saveCustomThemeMutation = useMutation({
    mutationFn: async (data: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/theme-settings/custom", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Custom Theme Saved",
        description: "Your custom theme has been saved and applied",
        variant: "default",
      });
      sendAdminActionLog("Save Custom Theme", "Created and applied a custom theme");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/theme-settings'] });

      // Apply custom theme in frontend
      const customTheme = createCustomTheme({
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: backgroundColor,
          text: textColor,
        }
      });

      updateTheme(customTheme);
      setSelectedTheme("custom");
    },
    onError: (error) => {
      toast({
        title: "Custom Theme Save Failed",
        description: `Failed to save custom theme: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Upload background image mutation
  const uploadBackgroundMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("backgroundImage", file);

      const res = await fetch("/api/admin/theme-settings/background", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Background Uploaded",
        description: "The background image has been uploaded and applied",
        variant: "default",
      });
      sendAdminActionLog("Upload Background", "Updated site background image");
      setBackgroundImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/theme-settings'] });

      // Update theme with new background
      updateTheme({
        ...theme,
        backgroundImage: data.backgroundUrl
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: `Failed to upload background image: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Initialize form with current theme settings
  useEffect(() => {
    if (themeSettings) {
      setSelectedTheme(themeSettings.currentTheme || "default");

      if (themeSettings.customTheme) {
        setPrimaryColor(themeSettings.customTheme.primaryColor || "#D4AF37");
        setSecondaryColor(themeSettings.customTheme.secondaryColor || "#2A2A2A");
        setAccentColor(themeSettings.customTheme.accentColor || "#D4AF37");
        setBackgroundColor(themeSettings.customTheme.backgroundColor || "#121212");
        setTextColor(themeSettings.customTheme.textColor || "#FFFFFF");
      }
    }
  }, [themeSettings]);

  // Apply theme
  const handleApplyTheme = () => {
    updateThemeMutation.mutate({ theme: selectedTheme });
  };

  // Save custom theme
  const handleSaveCustomTheme = () => {
    saveCustomThemeMutation.mutate({
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
    });
  };

  // Handle background image upload
  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackgroundImageFile(e.target.files[0]);
    }
  };

  // Upload background image
  const uploadBackgroundImage = () => {
    if (backgroundImageFile) {
      uploadBackgroundMutation.mutate(backgroundImageFile);
    }
  };

  // Show theme preview
  const handlePreviewTheme = (themeName: ThemeName) => {
    setPreviewTheme(themeName);

    // Update preview in the UI (this would be more complex in a real implementation)
    if (themeName === "custom") {
      const customPreview = createCustomTheme({
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          background: backgroundColor,
          text: textColor,
        }
      });

      // This would update a preview component in a real implementation
      console.log("Previewing custom theme:", customPreview);
    } else if (themeName in THEMES) {
      // This would update a preview component in a real implementation
      console.log("Previewing theme:", THEMES[themeName as keyof typeof THEMES]);
    }
  };

  const handleParticlePreview = (effect: string) => {
    //Implementation for previewing particle effects.  This is a placeholder.
    console.log("Previewing particle effect:", effect);
  };


  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary">Theme Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Active Theme */}
        <Card className="glass">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-4">Active Theme</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="themeSelect" className="text-gray-300">Select Theme</Label>
                <Select
                  value={selectedTheme}
                  onValueChange={(value: ThemeName) => {
                    setSelectedTheme(value);
                    handlePreviewTheme(value);
                  }}
                >
                  <SelectTrigger id="themeSelect" className="bg-zinc-900 border-primary/30 text-white focus:border-primary">
                    <SelectValue placeholder="Select Theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-primary/30">
                    <SelectItem value="default">Default (Black & Gold)</SelectItem>
                    <SelectItem value="christmas">Christmas</SelectItem>
                    <SelectItem value="halloween">Halloween</SelectItem>
                    <SelectItem value="valentines">Valentine's Day</SelectItem>
                    <SelectItem value="newyear">New Year</SelectItem>
                    <SelectItem value="stpatrick">St. Patrick's Day</SelectItem>
                    <SelectItem value="easter">Easter</SelectItem>
                    <Select>
  <SelectTrigger>
    <SelectValue placeholder="Select theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="custom">Custom Theme</SelectItem>
  </SelectContent>
</Select>
                  </SelectContent>
                </Select>

                <div className="mt-4">
                  <Label htmlFor="particleEffect">Particle Effect</Label>
                  <Select
                    value={particleEffect}
                    onValueChange={(value) => {
                      setParticleEffect(value);
                      handleParticlePreview(value);
                    }}
                  >
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="dust">Dust</SelectItem>
                    <SelectItem value="shimmer">Shimmer</SelectItem>
                    <SelectItem value="sparkle">Sparkle</SelectItem>
                    <SelectItem value="snow">Snow</SelectItem>
                    <SelectItem value="fireworks">Fireworks</SelectItem>
                    <SelectItem value="hearts">Hearts</SelectItem>
                    <SelectItem value="clovers">Clovers</SelectItem>
                    <SelectItem value="eggs">Easter Eggs</SelectItem>
                    <SelectItem value="bats">Bats</SelectItem>
                  </Select>
                </div>
              </div>
              <div>
                <Button
                  onClick={handleApplyTheme}
                  className="gold-gradient text-black font-bold hover:opacity-90"
                  disabled={updateThemeMutation.isPending}
                >
                  {updateThemeMutation.isPending ? (
                    <span className="flex items-center">
                      <i className="fas fa-circle-notch fa-spin mr-2"></i>
                      Applying...
                    </span>
                  ) : (
                    "Apply Theme"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Preview */}
        <Card className="glass">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-4">Theme Preview</h3>
            <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden">
              {previewTheme ? (
                <div className={`w-full h-full flex items-center justify-center theme-${previewTheme}`}>
                  <div className="text-center">
                    <div className="p-4 glass-gold rounded-lg mb-2">
                      <h4 className="text-primary font-bold">Sample Header</h4>
                      <p className="text-sm">This is how text will appear</p>
                    </div>
                    <button className="gold-gradient text-black px-4 py-2 rounded-md font-bold">
                      Sample Button
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <i className="fas fa-paint-brush text-4xl text-primary mb-2"></i>
                  <p className="text-gray-400">Select a theme to preview</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Theme Settings */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">Custom Theme Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="primaryColor" className="text-gray-300">Primary Color</Label>
              <div className="flex">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded-l-md border-0"
                />
                <Input
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="bg-zinc-900 border-primary/30 text-white rounded-l-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor" className="text-gray-300">Accent Color</Label>
              <div className="flex">
                <input
                  type="color"
                  id="accentColor"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="w-12 h-10 rounded-l-md border-0"
                />
                <Input
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="bg-zinc-900 border-primary/30 text-white rounded-l-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="textColor" className="text-gray-300">Text Color</Label>
              <div className="flex">
                <input
                  type="color"
                  id="textColor"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="w-12 h-10 rounded-l-md border-0"
                />
                <Input
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="bg-zinc-900 border-primary/30 text-white rounded-l-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor" className="text-gray-300">Secondary Color</Label>
              <div className="flex">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 rounded-l-md border-0"
                />
                <Input
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="bg-zinc-900 border-primary/30 text-white rounded-l-none focus:border-primary"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="backgroundColor" className="text-gray-300">Background Color</Label>
              <div className="flex">
                <input
                  type="color"
                  id="backgroundColor"
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  className="w-12 h-10 rounded-l-md border-0"
                />
                <Input
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  className="bg-zinc-900 border-primary/30 text-white rounded-l-none focus:border-primary"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="backgroundImage" className="text-gray-300">Background Image</Label>
              <div className="flex items-center mt-2">
                <input
                  type="file"
                  id="backgroundImage"
                  className="hidden"
                  onChange={handleBackgroundImageChange}
                  accept="image/*"
                />
                <Label
                  htmlFor="backgroundImage"
                  className="px-4 py-2 rounded-md bg-zinc-800 text-primary border border-primary/30 cursor-pointer hover:bg-zinc-700 transition"
                >
                  Choose File
                </Label>
                <span className="ml-3 text-sm text-gray-400">
                  {backgroundImageFile ? backgroundImageFile.name : "No file chosen"}
                </span>
              </div>

              {backgroundImageFile && (
                <div className="mt-3">
                  <Button
                    onClick={uploadBackgroundImage}
                    className="gold-gradient text-black font-bold hover:opacity-90"
                    disabled={uploadBackgroundMutation.isPending}
                  >
                    {uploadBackgroundMutation.isPending ? (
                      <span className="flex items-center">
                        <i className="fas fa-circle-notch fa-spin mr-2"></i>
                        Uploading...
                      </span>
                    ) : (
                      "Upload Background"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-2">
              <Button
                onClick={() => {
                  handlePreviewTheme("custom");
                  handleSaveCustomTheme();
                }}
                className="gold-gradient text-black font-bold hover:opacity-90"
                disabled={saveCustomThemeMutation.isPending}
              >
                {saveCustomThemeMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Saving...
                  </span>
                ) : (
                  "Save Custom Theme"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}