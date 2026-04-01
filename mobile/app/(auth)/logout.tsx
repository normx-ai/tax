import { View, Text, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function LogoutScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { colors } = useTheme();

  useEffect(() => {
    logout();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.headerBg }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: "#fff", marginTop: 16, fontSize: 14 }}>Deconnexion...</Text>
    </View>
  );
}
