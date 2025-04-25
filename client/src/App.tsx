import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { sendPageViewLog, sendErrorLog, sendPerformanceLog } from "@/lib/discord";

function Router() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Track page views with device info
    const deviceInfo = `
      Screen: ${window.innerWidth}x${window.innerHeight},
      UA: ${navigator.userAgent.substring(0, 100)}
    `;
    
    // Map path to page name for more readable logging
    const pageName = location === "/" ? "Home Page" : location;
    
    // Send page view to Discord webhook
    sendPageViewLog(pageName, deviceInfo);
    
    // Log performance data
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      sendPerformanceLog("Page Load Time", Math.round(navigationEntry.loadEventEnd - navigationEntry.startTime));
    }
    
    // Track any errors that occur on the page
    const handleError = (event: ErrorEvent) => {
      sendErrorLog("Client-side Error", event.message, event.error?.stack);
    };
    
    window.addEventListener("error", handleError);
    
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [location]);
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { theme } = useTheme();
  
  useEffect(() => {
    document.documentElement.className = theme.darkMode ? 'dark' : '';
  }, [theme.darkMode]);

  if (theme?.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
        <div className="max-w-md w-full text-center glass-gold p-8 rounded-lg">
          <h1 className="text-2xl font-bold mb-4 text-primary">🚧 Under Maintenance 🚧</h1>
          <p className="text-muted-foreground">{theme.maintenanceMessage || "Site is under maintenance. Please check back later."}</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={`min-h-screen ${theme.cssClass}`}>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
