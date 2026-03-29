/**
 * Store historique des consultations récentes
 * Persiste les 10 derniers articles consultés en localStorage
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";

export interface HistoryItem {
  article: string;
  titre: string;
  code: "cgi" | "social";
  timestamp: number;
}

interface HistoryState {
  items: HistoryItem[];
  addItem: (item: Omit<HistoryItem, "timestamp">) => void;
  clear: () => void;
}

const MAX_ITEMS = 10;

const storage = createJSONStorage(() => {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage;
  }
  return {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
});

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // Retirer le doublon si existant
          const filtered = state.items.filter((i) => i.article !== item.article || i.code !== item.code);
          // Ajouter en tête
          const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
          return { items: updated };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "normx-tax-history",
      storage,
    }
  )
);
