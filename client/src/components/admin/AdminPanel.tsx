import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = lazy(() => import("./Dashboard"));
const Announcements = lazy(() => import("./Announcements"));
const StreamSettings = lazy(() => import("./StreamSettings"));
const Themes = lazy(() => import("./Themes"));
const Logs = lazy(() => import("./Logs"));
const AIEnhancer = lazy(() => import("./AIEnhancer"));
const SEOTools = lazy(() => import("./SEOTools"));
const MaintenanceMode = lazy(() => import("./MaintenanceMode"));
const Analytics = lazy(() => import("./Analytics"));
const Security = lazy(() => import("./Security"));
const Customization = lazy(() => import("./Customization"));
const PremiumFeatures = lazy(() => import("./PremiumFeatures"));

const LoadingFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

import WebsiteContent from "./WebsiteContent";
import { sendAdminActionLog } from "@/lib/discord";

type AdminTab = "dashboard" | "announcements" | "streams" | "themes" | "logs" | "ai-enhancement" | "seo" | "maintenance" | "security" | "analytics" | "customization";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout, isLoggedIn } = useAdmin();

  // Verify admin session is still valid
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth');
        const data = await res.json();
        if (!data.authenticated) {
          logout();
        }
      } catch (err) {
        setError("Failed to verify admin session");
        console.error(err);
      }
    };

    const interval = setInterval(checkAuth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (!isLoggedIn) return null;
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-red-900/50 p-4 rounded-lg text-white">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    sendAdminActionLog("Tab Navigation", `Navigated to ${tab} tab`);
  };

  const handleLogout = () => {
    logout();
    sendAdminActionLog("Logout", "Admin logged out");
  };

  useEffect(() => {
    // Prevent body scrolling when admin panel is open
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 animate-fadeIn">
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-zinc-900 border-b border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-primary">ADMIN PANEL</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-primary hover:bg-zinc-800 p-2 rounded"
                aria-label="Toggle sidebar"
              >
                <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-primary p-2"
                aria-label="Close admin panel"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>

          {/* Mobile Tab Selector */}
          <div className="mt-4 flex overflow-x-auto pb-2 hide-scrollbar px-4">
            <button 
              onClick={() => handleTabChange("dashboard")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "dashboard" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-tachometer-alt mr-1"></i> Dashboard
            </button>
            <button 
              onClick={() => handleTabChange("announcements")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "announcements" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-bullhorn mr-1"></i> Announcements
            </button>
            <button 
              onClick={() => handleTabChange("streams")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "streams" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-video mr-1"></i> Streams
            </button>
            <button 
              onClick={() => handleTabChange("themes")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "themes" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-paint-brush mr-1"></i> Themes
            </button>
            <button 
              onClick={() => handleTabChange("logs")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "logs" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-list mr-1"></i> Logs
            </button>
            <button 
              onClick={() => handleTabChange("ai-enhancement")} 
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "ai-enhancement" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-robot mr-1"></i> AI Enhancement
            </button>
            <button 
              onClick={() => handleTabChange("maintenance")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1 mr-2 rounded text-sm 
                ${activeTab === "maintenance" ? "bg-primary text-black" : "bg-zinc-800/50 text-white"}`}
            >
              <i className="fas fa-tools mr-1"></i> Maintenance
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className={`
          hidden md:block w-64 bg-zinc-900 border-r border-primary/20 flex-shrink-0
        `}>
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primary">ADMIN PANEL</h2>
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-primary"
                aria-label="Close admin panel"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleTabChange("announcements")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "announcements" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-bullhorn mr-2"></i> Announcements
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("streams")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "streams" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-video mr-2"></i> Stream Settings
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("themes")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "themes" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-paint-brush mr-2"></i> Themes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("logs")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "logs" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-list mr-2"></i> Logs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("ai-enhancement")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "ai-enhancement" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-robot mr-2"></i> AI Enhancement
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("seo")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "seo" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-search mr-2"></i> SEO Tools
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("security")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "security" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-shield-alt mr-2"></i> Security
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("maintenance")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "maintenance" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-tools mr-2"></i> Maintenance
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("analytics")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "analytics" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-chart-line mr-2"></i> Analytics
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange("customization")}
                  className={`w-full text-left py-2 px-3 rounded hover:bg-zinc-800 text-primary hover-gold ${
                    activeTab === "customization" ? "nav-active bg-zinc-800" : ""
                  }`}
                >
                  <i className="fas fa-paint-brush mr-2"></i> Customization
                </button>
              </li>
              <li className="pt-4 mt-4 border-t border-primary/20">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left py-2 px-3 rounded hover:bg-red-900/50 text-red-400"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i> Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-grow bg-zinc-950 p-4 md:p-6 overflow-y-auto">
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "announcements" && <Announcements />}
            {activeTab === "streams" && <StreamSettings />}
            {activeTab === "themes" && <Themes />}
            {activeTab === "logs" && <Logs />}
            {activeTab === "ai-enhancement" && <AIEnhancer />}
            {activeTab === "seo" && <SEOTools />}
            {activeTab === "security" && <Security />}
            {activeTab === "maintenance" && <MaintenanceMode />}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "customization" && <Customization />}
          </Suspense>
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin text-primary">
                <i className="fas fa-circle-notch fa-2x"></i>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}