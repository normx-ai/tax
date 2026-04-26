import { useFavoritesStore } from "@/lib/store/favorites";
import HomeCards from "@/components/mobile/HomeCards";

export default function Dashboard() {
  const favoriteIds = useFavoritesStore((s) => s.articleIds);
  return <HomeCards favoritesCount={favoriteIds.length} />;
}
