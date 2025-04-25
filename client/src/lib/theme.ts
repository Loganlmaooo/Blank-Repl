export type ThemeName = 
  | "default" 
  | "christmas" 
  | "halloween" 
  | "valentines" 
  | "newyear" 
  | "stpatrick" 
  | "easter" 
  | "custom";

export interface Theme {
  name: ThemeName;
  label: string;
  darkMode: boolean;
  cssClass: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  backgroundImage?: string;
  particleEffect?: string;
  specialEffects?: string[];
}

export const THEMES: Record<Exclude<ThemeName, "custom">, Theme> = {
  default: {
    name: "default",
    label: "Default (Black & Gold)",
    darkMode: true,
    cssClass: "theme-default",
    colors: {
      primary: "#D4AF37",
      secondary: "#2A2A2A",
      accent: "#D4AF37",
      background: "#121212",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: "none",
    specialEffects: []
  },
  christmas: {
    name: "christmas",
    label: "Christmas",
    darkMode: true,
    cssClass: "theme-christmas",
    colors: {
      primary: "#C81E1C",
      secondary: "#0F8A5F",
      accent: "#D4AF37",
      background: "#1A2639",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: "snow",
    specialEffects: ["snowfall", "twinkling"]
  },
  halloween: {
    name: "halloween",
    label: "Halloween",
    darkMode: true,
    cssClass: "theme-halloween",
    colors: {
      primary: "#FF6D00",
      secondary: "#562E81",
      accent: "#2F9B4A",
      background: "#1D1135",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1604214330106-a70e03a7a32f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: "bats",
    specialEffects: ["fog", "spiderwebs"]
  },
  valentines: {
    name: "valentines",
    label: "Valentine's Day",
    darkMode: true,
    cssClass: "theme-valentines",
    colors: {
      primary: "#E91E63",
      secondary: "#B71C1C",
      accent: "#D4AF37",
      background: "#1E1013",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1549740425-5e9ed4d8cd34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: "hearts",
    specialEffects: ["floating-hearts", "glow"]
  },
  newyear: {
    name: "newyear",
    label: "New Year",
    darkMode: true,
    cssClass: "theme-newyear",
    colors: {
      primary: "#D4AF37",
      secondary: "#1976D2",
      accent: "#9C27B0",
      background: "#0F1A2A",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1546271276-4f6c170e8e16?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: "fireworks",
    specialEffects: ["confetti", "fireworks"]
  },
  stpatrick: {
    name: "stpatrick",
    label: "St. Patrick's Day",
    darkMode: true,
    cssClass: "theme-stpatrick",
    colors: {
      primary: "#2E7D32",
      secondary: "#D4AF37",
      accent: "#FF6D00",
      background: "#0E1A15",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1521438687440-b6be2b6ca733?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: "clovers",
    specialEffects: ["rainbow", "luck"]
  },
  easter: {
    name: "easter",
    label: "Easter",
    darkMode: true,
    cssClass: "theme-easter",
    colors: {
      primary: "#BA68C8",
      secondary: "#81C784",
      accent: "#4FC3F7",
      background: "#0F172A",
      text: "#FFFFFF"
    },
    backgroundImage: "https://images.unsplash.com/photo-1557408939-0b19bcc37149?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    particleEffect: null,
    specialEffects: []
  }
};

export function getThemeCssVars(theme: Theme): Record<string, string> {
  const { colors } = theme;

  return {
    "--primary-color": colors.primary,
    "--secondary-color": colors.secondary,
    "--accent-color": colors.accent,
    "--background-color": colors.background,
    "--text-color": colors.text,
  };
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('transition', 'all 0.5s ease-in-out');
  const cssVars = getThemeCssVars(theme);

  // Apply CSS variables
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply CSS class
  if (theme.cssClass) {
    document.body.className = theme.cssClass;
  }

  // Apply background image
  if (theme.backgroundImage) {
    document.body.style.backgroundImage = `url(${theme.backgroundImage})`;
  }

  // Apply dark mode
  root.classList.toggle("dark", theme.darkMode);
}

export function createCustomTheme(options: Partial<Theme>): Theme {
  return {
    name: "custom",
    label: "Custom Theme",
    darkMode: true,
    cssClass: "theme-custom",
    colors: {
      primary: "#D4AF37",
      secondary: "#2A2A2A",
      accent: "#D4AF37",
      background: "#121212",
      text: "#FFFFFF"
    },
    specialEffects: ["glassReflection"],
    ...options
  };
}