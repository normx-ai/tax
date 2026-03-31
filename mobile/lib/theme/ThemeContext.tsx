import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { lightColors, darkColors, type ThemeColors } from "./colors";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = "cgi242_theme_v2";

async function loadTheme(): Promise<ThemeMode | null> {
  try {
    if (Platform.OS === "web") {
      return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || null;
    }
    const { getItemAsync } = await import("expo-secure-store");
    return (await getItemAsync(STORAGE_KEY)) as ThemeMode | null;
  } catch {
    return null;
  }
}

async function saveTheme(mode: ThemeMode): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(STORAGE_KEY, mode);
      return;
    }
    const { setItemAsync } = await import("expo-secure-store");
    await setItemAsync(STORAGE_KEY, mode);
  } catch {
    // Échec sauvegarde thème — non bloquant
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    loadTheme().then((saved) => {
      if (saved) setModeState(saved);
    });
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    saveTheme(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      saveTheme(next);
      return next;
    });
  }, []);

  const colors = mode === "light" ? lightColors : darkColors;
  const value = useMemo(() => ({ mode, colors, toggleTheme, setTheme }), [mode, colors, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
