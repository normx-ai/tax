/**
 * Auth Screen — Redirect vers Keycloak
 * Remplace les anciens ecrans email/password/OTP/MFA
 */

import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import AuthLogo from "@/components/auth/AuthLogo";

const BG = "#1A3A5C";
const GOLD = "#D4A843";

export default function LoginKeycloak() {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Si deja authentifie, ne rien faire (le layout redirigera)
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG }}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={{ color: "#fff", marginTop: 16, fontFamily: fonts.medium, fontSize: 14 }}>
          Connexion en cours...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <AuthLogo />

      <Text style={{
        color: "#fff",
        fontSize: 28,
        fontFamily: fonts.bold,
        fontWeight: fontWeights.bold,
        marginTop: 32,
        marginBottom: 8,
        textAlign: "center",
      }}>
        NORMX Tax
      </Text>

      <Text style={{
        color: "rgba(255,255,255,0.7)",
        fontSize: 15,
        fontFamily: fonts.regular,
        textAlign: "center",
        marginBottom: 40,
        maxWidth: 320,
        lineHeight: 22,
      }}>
        Fiscalite, simulateurs et assistant IA pour le Code General des Impots du Congo
      </Text>

      <TouchableOpacity
        onPress={login}
        style={{
          backgroundColor: GOLD,
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 12,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <Text style={{
          color: BG,
          fontSize: 16,
          fontFamily: fonts.bold,
          fontWeight: fontWeights.bold,
          textAlign: "center",
        }}>
          Se connecter
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={login}
        style={{
          marginTop: 16,
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.2)",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <Text style={{
          color: "#fff",
          fontSize: 16,
          fontFamily: fonts.medium,
          textAlign: "center",
        }}>
          Creer un compte
        </Text>
      </TouchableOpacity>

      <Text style={{
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        fontFamily: fonts.regular,
        marginTop: 32,
        textAlign: "center",
      }}>
        Connexion securisee via NORMX AI
      </Text>
    </View>
  );
}
