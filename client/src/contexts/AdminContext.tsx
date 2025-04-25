import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { sendAdminLoginLog } from "@/lib/discord";

interface AdminContextType {
  isLoggedIn: boolean;
  showAdminPanel: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleAdminPanel: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isLoggedIn: false,
  showAdminPanel: false,
  login: async () => false,
  logout: () => {},
  toggleAdminPanel: () => {},
});

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/check-auth");
        const data = await res.json();
        setIsLoggedIn(data.authenticated || false);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/admin/login", { username, password });
      const data = await res.json();

      if (data.success) {
        setIsLoggedIn(true);
        setShowAdminPanel(true);
        sendAdminLoginLog(username, true);
        return true;
      } else {
        sendAdminLoginLog(username, false);
        return false;
      }
    } catch (error) {
      sendAdminLoginLog(username, false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setShowAdminPanel(false);
    }
  };

  // Toggle admin panel visibility
  const toggleAdminPanel = () => {
    setShowAdminPanel(prev => !prev);
  };

  const value = {
    isLoggedIn,
    showAdminPanel,
    login,
    logout,
    toggleAdminPanel,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);