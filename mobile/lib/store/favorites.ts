import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";

interface FavoritesState {
  articleIds: string[];
  toggleFavorite: (articleId: string) => void;
}

const webStorage = {
  getItem: (name: string) => {
    const val = localStorage.getItem(name);
    return val ? JSON.parse(val) : null;
  },
  setItem: (name: string, value: unknown) => {
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      articleIds: [],
      toggleFavorite: (articleId: string) => {
        const current = get().articleIds;
        if (current.includes(articleId)) {
          set({ articleIds: current.filter((id) => id !== articleId) });
        } else {
          set({ articleIds: [...current, articleId] });
        }
      },
    }),
    {
      name: "cgi242-favorites",
      storage: Platform.OS === "web"
        ? createJSONStorage(() => webStorage)
        : createJSONStorage(() => require("@react-native-async-storage/async-storage").default),
    }
  )
);
