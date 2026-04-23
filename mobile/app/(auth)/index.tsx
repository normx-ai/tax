import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Image } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";
const BG_WARM = "#faf8f5";

export default function AuthScreen() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const { router } = require("expo-router");
      router.replace("/(app)");
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG_WARM }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ color: DARK, marginTop: 16, fontFamily: fonts.medium, fontSize: 14 }}>
          Connexion en cours...
        </Text>
      </View>
    );
  }

  // Sur web : le landing HTML est servi par nginx, on redirige vers Keycloak
  if (Platform.OS === "web") {
    login();
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG_WARM }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ color: DARK, marginTop: 16, fontFamily: fonts.medium, fontSize: 14 }}>
          Redirection...
        </Text>
      </View>
    );
  }

  // Mobile : ecran simple avec logo + boutons
  return (
    <View style={{ flex: 1, backgroundColor: BG_WARM, justifyContent: "center", alignItems: "center", padding: 32 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View style={{ backgroundColor: "#fff", padding: 6 }}>
          <Image
            source={require("@/assets/logo-horizontal.png")}
            style={{ width: 200, height: 40, resizeMode: "contain" }}
          />
        </View>
        <Text style={{ fontSize: 24, fontFamily: fonts.medium, fontWeight: fontWeights.medium, color: PRIMARY }}>
          Tax
        </Text>
      </View>

      <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 24, fontFamily: fonts.regular, marginBottom: 40, maxWidth: 320 }}>
        Code fiscal et social du Congo-Brazzaville
      </Text>

      <TouchableOpacity onPress={login} style={{ backgroundColor: PRIMARY, paddingVertical: 16, paddingHorizontal: 32, width: "100%", maxWidth: 360, alignItems: "center" }}>
        <Text style={{ color: DARK, fontSize: 16, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={register} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", backgroundColor: "#ffffff", width: "100%", maxWidth: 360, alignItems: "center" }}>
        <Text style={{ color: DARK, fontSize: 16, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>Créer un compte</Text>
      </TouchableOpacity>
    </View>
  );
}
