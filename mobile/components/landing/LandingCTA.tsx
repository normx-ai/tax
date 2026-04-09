import { View, Text, TouchableOpacity } from "react-native";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useAuthStore } from "@/lib/store/auth";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";

export default function LandingCTA() {
  const login = useAuthStore((s) => s.login);

  return (
    <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 16, backgroundColor: "#faf8f5" }}>
      <View style={{
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        borderRadius: 20,
        padding: 48,
        maxWidth: 700,
        width: "100%",
        alignItems: "center",
      }}>
        <Text style={{
          fontFamily: fonts.bold,
          fontWeight: fontWeights.bold,
          fontSize: 28,
          color: DARK,
          textAlign: "center",
          marginBottom: 12,
        }}>
          Prêt à simplifier votre fiscalité et votre gestion sociale ?
        </Text>
        <Text style={{
          color: "#6b7280",
          fontSize: 16,
          fontFamily: fonts.regular,
          fontWeight: fontWeights.regular,
          marginBottom: 28,
          textAlign: "center",
        }}>
          Accédez au Code fiscal et social du Congo, simulez vos impôts et cotisations, posez vos questions à l'IA.
        </Text>
        <TouchableOpacity
          onPress={login}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 10,
            backgroundColor: PRIMARY,
          }}
        >
          <Text style={{
            color: DARK,
            fontSize: 16,
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
          }}>
            Se connecter →
          </Text>
        </TouchableOpacity>
        <Text style={{
          marginTop: 16,
          fontSize: 13,
          color: "#9ca3af",
          fontFamily: fonts.regular,
        }}>
          Connexion sécurisée via NORMX AI
        </Text>
      </View>
    </View>
  );
}
