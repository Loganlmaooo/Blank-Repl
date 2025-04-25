import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import AnnouncementsSection from "@/components/AnnouncementsSection";
import StreamsSection from "@/components/StreamsSection";
import SocialMediaSection from "@/components/SocialMediaSection";
import LoginModal from "@/components/LoginModal";
import AdminPanel from "@/components/admin/AdminPanel";
import { useAdmin } from "@/contexts/AdminContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremiumParticles, useParallax, useCustomCursor } from "@/lib/animation";

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, showAdminPanel } = useAdmin();
  const { theme } = useTheme();
  
  // Initialize premium effects
  usePremiumParticles();
  useParallax();
  useCustomCursor();
  
  useEffect(() => {
    // Add any special effects based on the current theme
    const specialEffects = theme.specialEffects || [];
    
    // This would initialize special effects in a real implementation
    console.log(`Applying special effects: ${specialEffects.join(", ")}`);
    
    return () => {
      // Cleanup effects
      console.log("Cleaning up special effects");
    };
  }, [theme]);
  
  const toggleLoginModal = () => {
    setIsLoginModalOpen(prev => !prev);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header onAdminClick={toggleLoginModal} />
      
      <main className="flex-grow">
        <HeroSection />
        <AnnouncementsSection />
        <StreamsSection />
        <SocialMediaSection />
      </main>
      
      <Footer />
      
      {isLoginModalOpen && !isLoggedIn && (
        <LoginModal onClose={toggleLoginModal} />
      )}
      
      {isLoggedIn && showAdminPanel && <AdminPanel />}
    </div>
  );
}
