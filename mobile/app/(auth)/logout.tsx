import { View, Text, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";

export default function LogoutScreen() {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    logout();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F2A42" }}>
      <ActivityIndicator size="large" color="#D4A843" />
      <Text style={{ color: "#fff", marginTop: 16, fontSize: 14 }}>Deconnexion...</Text>
    </View>
  );
}
