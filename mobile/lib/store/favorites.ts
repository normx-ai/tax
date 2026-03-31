import { create } from "zustand";
import { api } from "@/lib/api/client";

interface FavoritesState {
  articleIds: string[];
  loaded: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (articleId: string) => Promise<void>;
  isFavorite: (articleId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  articleIds: [],
  loaded: false,

  loadFavorites: async () => {
    try {
      const { data } = await api.get<{ favorites: string[] }>("/favorites");
      set({ articleIds: data.favorites, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggleFavorite: async (articleId: string) => {
    const current = get().articleIds;
    const isFav = current.includes(articleId);

    // Optimistic update
    if (isFav) {
      set({ articleIds: current.filter((id) => id !== articleId) });
    } else {
      set({ articleIds: [...current, articleId] });
    }

    try {
      if (isFav) {
        await api.delete(`/favorites/${encodeURIComponent(articleId)}`);
      } else {
        await api.post(`/favorites/${encodeURIComponent(articleId)}`);
      }
    } catch {
      // Rollback on error
      set({ articleIds: current });
    }
  },

  isFavorite: (articleId: string) => get().articleIds.includes(articleId),
}));
