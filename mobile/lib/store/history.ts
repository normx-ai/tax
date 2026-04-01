/**
 * Store historique des consultations recentes
 * Persiste les 10 derniers articles consultes
 * Web: localStorage, Mobile: AsyncStorage
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
  // Mobile: utiliser AsyncStorage
  return require("@react-native-async-storage/async-storage").default;
});

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.article !== item.article || i.code !== item.code);
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
