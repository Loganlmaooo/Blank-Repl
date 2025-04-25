import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useGlowEffect } from '@/lib/animation'; // Added import for useGlowEffect

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useGlowEffect(modalRef, '#ffd700');

  useEffect(() => {
    if (formRef.current) {
      formRef.current.style.transform = 'translateY(20px)';
      formRef.current.style.opacity = '0';
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.transform = 'translateY(0)';
          formRef.current.style.opacity = '1';
          formRef.current.style.transition = 'all 0.5s ease-out';
        }
      }, 100);
    }
  }, []);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Added rememberMe state
  const [showPassword, setShowPassword] = useState(false); // Added showPassword state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading..."); // Added loading text state
  const { login } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) {
      const texts = ["Authenticating...", "Verifying...", "Almost there..."];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[i % texts.length]);
        i++;
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);

      if (success) {
        if (rememberMe) {
          localStorage.setItem('adminUsername', username);
        } else {
          localStorage.removeItem('adminUsername');
        }
        toast({
          title: "Login Successful",
          description: "Welcome to the admin panel",
          variant: "default",
        });
        onClose();
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="glass-gold relative z-10 p-8 rounded-lg w-full max-w-md">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 text-primary">Admin Login</h2>
          <p className="text-gray-400 text-sm">Enter your credentials to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-900 border-primary/30 text-white focus:border-primary focus:ring-primary"
              placeholder="Enter username"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"} // Toggle password visibility
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-primary/30 text-white focus:border-primary focus:ring-primary"
              placeholder="Enter password"
              disabled={isLoading}
            />
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox 
                id="showPassword" 
                checked={showPassword} 
                onCheckedChange={() => setShowPassword(!showPassword)}
                className="border-primary/30"
              />
              <Label htmlFor="showPassword" className="text-sm text-gray-300 cursor-pointer">
                Show password
              </Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe} 
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-primary/30"
            />
            <Label htmlFor="rememberMe" className="text-sm text-gray-300 cursor-pointer">
              Remember me
            </Label>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-2 gold-gradient text-black font-bold hover:opacity-90 transition"
              disabled={isLoading}
            >
              {isLoading ? (
                loadingText
              ) : (
                "Login"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}