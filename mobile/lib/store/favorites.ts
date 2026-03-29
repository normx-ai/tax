import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";

interface FavoritesState {
  articleIds: string[];
  isFavorite: (articleId: string) => boolean;
  toggleFavorite: (articleId: string) => void;
}

const storage = createJSONStorage(() => {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage;
  }
  // Mobile : AsyncStorage
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  return AsyncStorage;
});

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      articleIds: [],
      isFavorite: (articleId: string) => get().articleIds.includes(articleId),
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
      storage,
    }
  )
);
