import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { THEMES, Theme, ThemeName, applyTheme } from "@/lib/theme";
import { apiRequest } from "@/lib/queryClient";

interface ThemeContextType {
  theme: Theme & {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
  };
  updateTheme: (newTheme: Theme) => void;
  availableThemes: Record<Exclude<ThemeName, "custom">, Theme>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: {
    ...THEMES.default,
    maintenanceMode: false,
    maintenanceMessage: "Site is under maintenance. Please check back later."
  },
  updateTheme: () => {},
  availableThemes: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('currentTheme');
    return {
      ...(savedTheme ? THEMES[savedTheme as keyof typeof THEMES] || THEMES.default : THEMES.default),
      maintenanceMode: false,
      maintenanceMessage: "Site is under maintenance. Please check back later."
    };
  });

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await apiRequest("GET", "/api/theme");
        const data = await res.json();

        if (data && data.theme) {
          const themeKey = data.theme as ThemeName;
          let newTheme: Theme;

          if (themeKey === "custom" && data.customTheme) {
            newTheme = {
              name: "custom",
              label: "Custom Theme",
              darkMode: true,
              cssClass: "theme-custom",
              colors: {
                primary: data.customTheme.primaryColor || "#D4AF37",
                secondary: data.customTheme.secondaryColor || "#2A2A2A",
                accent: data.customTheme.accentColor || "#D4AF37",
                background: data.customTheme.backgroundColor || "#121212",
                text: data.customTheme.textColor || "#FFFFFF",
              },
              backgroundImage: data.customTheme.backgroundImage,
              specialEffects: []
            };
          } else {
            newTheme = THEMES[themeKey] || THEMES.default;
          }

          const fullTheme = {
            ...newTheme,
            maintenanceMode: data.maintenanceMode,
            maintenanceMessage: data.maintenanceMessage
          };

          setTheme(fullTheme);
          applyTheme(newTheme);
        }
      } catch (error) {
        console.error("Error fetching theme:", error);
      }
    };

    fetchTheme();
    const pollInterval = setInterval(fetchTheme, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    const saveTheme = async () => {
      try {
        await apiRequest("POST", "/api/theme", { 
          theme: newTheme.name,
          customTheme: newTheme.name === "custom" ? {
            primaryColor: newTheme.colors.primary,
            secondaryColor: newTheme.colors.secondary,
            accentColor: newTheme.colors.accent,
            backgroundColor: newTheme.colors.background,
            textColor: newTheme.colors.text,
            backgroundImage: newTheme.backgroundImage,
          } : undefined,
          maintenanceMode: newTheme.maintenanceMode,
          maintenanceMessage: newTheme.maintenanceMessage,
        });

        setTheme(prev => ({ ...prev, ...newTheme }));
        applyTheme(newTheme);
        localStorage.setItem('currentTheme', newTheme.name);

      } catch (error) {
        console.error("Error saving theme:", error);
      }
    };

    saveTheme();
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, availableThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};