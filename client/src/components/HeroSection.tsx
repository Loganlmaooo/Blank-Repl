import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLiveStreamer, StreamerInfo } from "@/lib/twitch";
import { cn } from "@/lib/utils";
import { useGlowEffect, useMagneticEffect, useTypewriterEffect, useAdvancedParticles } from "@/lib/animation";
import { Skeleton } from "@/components/ui/skeleton"; // Added import for Skeleton component

export default function HeroSection() {
  const [parent, setParent] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  useGlowEffect(cardRef, '#ffd700');
  useMagneticEffect(cardRef, 0.5);
  useTypewriterEffect(titleRef, "Welcome to RENNSZ", 100);
  useAdvancedParticles('gold');

  useEffect(() => {
    // Get the current domain for the Twitch embed
    const domain = window.location.hostname;
    setParent(domain);
  }, []);

  const { data: liveStreamer, isLoading } = useQuery({
    queryKey: ["/api/twitch/live"],
    queryFn: () => getLiveStreamer(),
  });

  const [activeStreamer, setActiveStreamer] = useState<"main" | "gaming">("main");

  // Switch between streams
  const switchStream = () => {
    setActiveStreamer(prev => prev === "main" ? "gaming" : "main");
  };

  const getStreamUrl = (): string => {
    if (isLoading) return "";

    const channel = activeStreamer === "main" ? "rennsz" : "rennszino";
    return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=false`;
  };

  return (
    <section id="hero" className="py-10 md:py-16 animate-fadeIn">
      <div className="container mx-auto px-4">
        <div className="glass-gold rounded-xl overflow-hidden p-1 hover-gold shimmer-border">
          <div className="bg-black-900 rounded-lg overflow-hidden">
            <div className="aspect-video relative">
              {/* Live Stream Embed */}
              {parent && (
                <iframe 
                  src={getStreamUrl()}
                  height="100%" 
                  width="100%" 
                  title={`${activeStreamer === "main" ? "RENNSZ" : "RENNSZINO"} Twitch Stream`}
                  allowFullScreen={true}
                  className="border-0 absolute inset-0"
                ></iframe>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black-900">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading stream...</p>
                  </div>
                </div>
              )}

              {/* Offline State */}
              {!isLoading && !liveStreamer && (
                <div className="absolute inset-0 flex items-center justify-center bg-black-900">
                  <div className="text-center">
                    <i className="fas fa-video text-6xl text-gray-700 mb-4"></i>
                    <h3 className="text-2xl font-bold text-white mb-2">Currently Offline</h3>
                    <p className="text-gray-400">Check back later or watch recent videos</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black-800 gap-4">
              <div className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full overflow-hidden flex-shrink-0",
                  "flex items-center justify-center bg-zinc-800"
                )}>
                  <img 
                    src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=96&q=80" 
                    alt={activeStreamer === "main" ? "RENNSZ" : "RENNSZINO"} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-white">
                    {activeStreamer === "main" ? "RENNSZ" : "RENNSZINO"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {activeStreamer === "main" ? "IRL Streamer" : "Gaming/Chilling"}
                  </p>
                </div>
              </div>

              <div className="flex w-full sm:w-auto space-x-2">
                <a 
                  href={activeStreamer === "main" ? "https://www.twitch.tv/rennsz" : "https://www.twitch.tv/rennszino"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-grow sm:flex-grow-0 text-center px-4 py-2 rounded-md bg-[#6441A4] text-white font-bold hover:bg-opacity-90 transition"
                >
                  <i className="fab fa-twitch mr-1"></i> <span className="hidden xs:inline">Watch on</span> Twitch
                </a>
                <button 
                  onClick={switchStream} 
                  className="px-3 py-2 rounded-md bg-zinc-700 text-primary border border-primary/30 hover:bg-zinc-600 transition"
                  aria-label="Switch Stream"
                >
                  <i className="fas fa-exchange-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}