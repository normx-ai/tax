import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/store/auth";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  // Landing HTML statique servie par nginx — ici on redirige vers l'auth
  return <Redirect href="/(auth)" />;
}
