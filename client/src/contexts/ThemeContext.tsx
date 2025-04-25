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
              specialEffects: ["glassReflection"],
              particleEffect: data.customTheme.particleEffect
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
        applyEffects(newTheme);
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

const applyEffects = (theme: Theme) => {
  // Clean up existing effects
  const existingParticles = document.querySelectorAll('.particles-container');
  existingParticles.forEach(container => container.remove());

  if (!theme) return;

  // Clean up any existing particle effects
  const existingContainers = document.querySelectorAll('.particles-container');
  existingContainers.forEach(container => container.remove());

  // Only apply new effects if they are specifically enabled
  const particleEffect = theme.particleEffect || (theme.name === 'christmas' ? 'snow' : 
                                               theme.name === 'newyear' ? 'fireworks' :
                                               theme.name === 'valentines' ? 'hearts' :
                                               theme.name === 'stpatrick' ? 'clovers' :
                                               theme.name === 'easter' ? 'eggs' :
                                               theme.name === 'halloween' ? 'bats' : null);

  const n = particleEffect;
  if (n && n !== 'none' && n !== null) {
    switch (n) {
      case 'gold':
        createParticleEffect({
          count: 50,
          className: 'gold-particle',
          duration: 3000
        });
        break;
      case 'dust':
        createParticleEffect({
          count: 30,
          className: 'gold-dust',
          duration: 4000
        });
        break;
      case 'shimmer':
        createParticleEffect({
          count: 20,
          className: 'shimmer-particle',
          duration: 2000
        });
        break;
      case 'sparkle':
        createParticleEffect({
          count: 40,
          className: 'sparkle-particle',
          duration: 2500
        });
        break;
      case 'snow':
        createSnowEffect();
        break;
      case 'fireworks':
        createFireworksEffect();
        break;
      case 'hearts':
        createHeartsEffect();
        break;
      case 'clovers':
        createCloversEffect();
        break;
      case 'eggs':
        createEggsEffect();
        break;
      case 'bats':
        createBatsEffect();
        break;
    }
  }

  // Apply additional special effects
  theme.specialEffects.forEach(effect => {
    switch (effect) {
      case 'snow':
        createSnowEffect();
        break;
      case 'fireworks':
        createFireworksEffect();
        break;
      case 'hearts':
        createHeartsEffect();
        break;
      case 'clovers':
        createCloversEffect();
        break;
      case 'eggs':
        createEggsEffect();
        break;
      case 'bats':
        createBatsEffect();
        break;
      default:
        console.log(`Applying special effect: ${effect}`);
    }
  });
};

const createParticleEffect = (options: any) => {
  // Remove any existing particle containers
  const existingContainers = document.querySelectorAll('.particles-container');
  existingContainers.forEach(container => container.remove());

  const particles = document.createElement('div');
  particles.className = 'particles-container';
  document.body.appendChild(particles);

  const removeParticles = () => particles.remove();

  // Create particles
  for (let i = 0; i < options.count; i++) {
    const particle = document.createElement('div');
    particle.className = `particle ${options.className}`;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.animationDuration = `${options.duration + (Math.random() * 2000)}ms`;
    particle.style.animationDelay = `${Math.random() * 3000}ms`;
    particles.appendChild(particle);
  }

  return removeParticles;
};

const createSnowEffect = () => createParticleEffect({
  count: 50,
  className: 'snow-particle',
  duration: 3000
});

const createFireworksEffect = () => createParticleEffect({
  count: 30,
  className: 'firework-particle',
  duration: 2000
});

const createHeartsEffect = () => createParticleEffect({
  count: 20,
  className: 'heart-particle',
  duration: 4000
});

const createCloversEffect = () => createParticleEffect({
  count: 25,
  className: 'clover-particle',
  duration: 3500
});

const createEggsEffect = () => createParticleEffect({
  count: 15,
  className: 'egg-particle',
  duration: 4500
});

const createBatsEffect = () => createParticleEffect({
  count: 20,
  className: 'bat-particle',
  duration: 3000
});

// Create enhanced theme application function
const applyThemeWithEffects = (newTheme: Theme) => {
  applyTheme(newTheme);
  applyEffects(newTheme);
};