import { View, Text, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import LandingPage from "@/components/landing/LandingPage";

const PRIMARY = "#D4A843";
const DARK = "#1A3A5C";
const BG_WARM = "#faf8f5";

export default function AuthScreen() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Sur web, si pas de ?code= dans l'URL, on reste sur la landing
    // Le bouton "Connexion" redirigera vers Keycloak
  }, [isAuthenticated, isLoading]);

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

  // Sur web : afficher la landing complète
  if (Platform.OS === "web") {
    return <LandingPage />;
  }

  // Sur mobile : ecran simplifie avec boutons
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG_WARM }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
      {/* Logo */}
      <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Text style={{ fontFamily: fonts.black, fontWeight: fontWeights.black, fontSize: 28, color: DARK }}>N</Text>
      </View>

      <Text style={{ fontSize: 32, fontFamily: fonts.black, fontWeight: fontWeights.black, color: DARK, textAlign: "center", marginBottom: 8 }}>
        NORMX <Text style={{ color: PRIMARY }}>Tax</Text>
      </Text>

      <Text style={{ fontSize: 14, fontFamily: fonts.medium, fontWeight: fontWeights.medium, color: PRIMARY, textAlign: "center", marginBottom: 24 }}>
        La fiscalité augmentée par l'IA
      </Text>

      <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 24, fontFamily: fonts.regular, marginBottom: 40, maxWidth: 320 }}>
        Simulateurs fiscaux et sociaux, assistant IA et +2 200 articles indexés du Code fiscal et social du Congo.
      </Text>

      {/* Stats */}
      <View style={{ flexDirection: "row", backgroundColor: DARK, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 12, width: "100%", maxWidth: 360, marginBottom: 40 }}>
        {[
          { value: "+2 200", label: "Articles" },
          { value: "16", label: "Simulateurs" },
          { value: "IA", label: "Assistant" },
        ].map((s, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", borderRightWidth: i < 2 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.15)" }}>
            <Text style={{ fontSize: 18, fontFamily: fonts.black, fontWeight: fontWeights.black, color: PRIMARY }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, fontFamily: fonts.medium }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Boutons */}
      <TouchableOpacity onPress={login} style={{ backgroundColor: PRIMARY, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: "100%", maxWidth: 360, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Text style={{ color: DARK, fontSize: 16, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Se connecter</Text>
        <Ionicons name="arrow-forward" size={18} color={DARK} />
      </TouchableOpacity>

      <TouchableOpacity onPress={login} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", backgroundColor: "#ffffff", width: "100%", maxWidth: 360, alignItems: "center" }}>
        <Text style={{ color: DARK, fontSize: 16, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>Créer un compte</Text>
      </TouchableOpacity>

      <Text style={{ color: "#9ca3af", fontSize: 12, fontFamily: fonts.regular, marginTop: 24, textAlign: "center" }}>
        Connexion sécurisée via NORMX AI
      </Text>

      {/* Features */}
      <View style={{ marginTop: 40, width: "100%", maxWidth: 360 }}>
        {[
          { icon: "calculator-outline" as const, text: "16 simulateurs fiscaux conformes CGI 2026" },
          { icon: "chatbubbles-outline" as const, text: "Assistant IA fiscal et social" },
          { icon: "calendar-outline" as const, text: "Calendrier des échéances avec alertes" },
          { icon: "shield-checkmark-outline" as const, text: "Données chiffrées, authentification MFA" },
        ].map((f, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(212,168,67,0.1)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={f.icon} size={18} color={PRIMARY} />
            </View>
            <Text style={{ fontSize: 14, color: DARK, fontFamily: fonts.regular, flex: 1 }}>{f.text}</Text>
          </View>
        ))}
      </View>

      <Text style={{ color: "#9ca3af", fontSize: 11, fontFamily: fonts.regular, marginTop: 32, textAlign: "center" }}>
        © 2026 NORMX AI SAS — Creil, France
      </Text>
    </ScrollView>
  );
}
