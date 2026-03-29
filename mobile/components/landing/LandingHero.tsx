import { View, Text, TouchableOpacity, Image } from "react-native";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useAuthStore } from "@/lib/store/auth";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";
const TEXT_SEC = "#6b7280";
const BG_WARM = "#faf8f5";

interface Props {
  isMobile: boolean;
  loaded: boolean;
}

export default function LandingHero({ isMobile, loaded }: Props) {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const stats = [
    { value: "+2 200", label: "Articles de loi" },
    { value: "16", label: "Simulateurs fiscaux" },
    { value: "IA", label: "Assistant intelligent" },
    { value: "2", label: "Codes : CGI + Social" },
  ];

  return (
    <View style={{ paddingTop: isMobile ? 60 : 100, paddingBottom: 60, paddingHorizontal: 24, backgroundColor: BG_WARM }}>
      {/* Hero 2 colonnes */}
      <View style={{
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        gap: isMobile ? 40 : 60,
      }}>
        {/* Colonne gauche — MacBook screenshot */}
        {!isMobile && (
          <View style={{ flex: 1, maxWidth: 520 }}>
            <View style={{
              backgroundColor: "#222",
              borderRadius: 12,
              padding: 4,
              paddingBottom: 0,
              borderWidth: 2,
              borderColor: "#333",
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#444", alignSelf: "center", marginBottom: 3 }} />
              <Image
                source={require("@/assets/princ_normx_tax.png")}
                style={{ width: "100%", height: 300, borderRadius: 2 }}
                resizeMode="cover"
              />
            </View>
            <View style={{ height: 12, backgroundColor: "#c8c8c8", borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
              <View style={{ width: 80, height: 4, backgroundColor: "#9a9a9a", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignSelf: "center" }} />
            </View>
          </View>
        )}

        {/* Colonne droite — texte */}
        <View style={{ flex: 1 }}>
          {/* Badge */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(212,168,67,0.1)",
            borderRadius: 100,
            paddingVertical: 8,
            paddingHorizontal: 20,
            marginBottom: 24,
            alignSelf: isMobile ? "center" : "flex-start",
          }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: PRIMARY, letterSpacing: 0.5 }}>
              La fiscalité augmentée par l'IA
            </Text>
          </View>

          {/* Title */}
          <Text style={{
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
            fontSize: isMobile ? 30 : 44,
            color: DARK,
            textAlign: isMobile ? "center" : "left",
            lineHeight: isMobile ? 36 : 52,
            marginBottom: 16,
            letterSpacing: -0.5,
          }}>
            {"Simulez vos impôts,\naccédez au "}
            <Text style={{ color: PRIMARY }}>code fiscal et social</Text>
          </Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: isMobile ? 15 : 17,
            color: TEXT_SEC,
            maxWidth: 480,
            textAlign: isMobile ? "center" : "left",
            lineHeight: isMobile ? 24 : 28,
            fontFamily: fonts.regular,
            marginBottom: 32,
          }}>
            Simulateurs fiscaux et sociaux, assistant IA et +2 200 articles indexés — Code Général des Impôts et Code Social du Congo.
          </Text>

          {/* CTA buttons */}
          <View style={{ flexDirection: "row", gap: 12, alignItems: isMobile ? "center" : "flex-start", justifyContent: isMobile ? "center" : "flex-start", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={login}
              style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, backgroundColor: PRIMARY }}
            >
              <Text style={{ color: DARK, fontSize: 15, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
                Se connecter →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={register}
              style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }}
            >
              <Text style={{ color: DARK, fontSize: 15, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social proof */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Text style={{ fontSize: 13, color: TEXT_SEC }}>4.7/5</Text>
            <Text style={{ fontSize: 13, color: TEXT_SEC }}>Disponible sur Google Play</Text>
          </View>
        </View>

      </View>

      {/* Stats bar */}
      <View style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: isMobile ? 20 : 48,
        flexWrap: "wrap",
        backgroundColor: DARK,
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: isMobile ? 16 : 48,
        width: "100%",
        maxWidth: 800,
        alignSelf: "center",
        marginTop: 48,
      }}>
        {stats.map((stat, i) => (
          <View key={i} style={{ alignItems: "center", opacity: loaded ? 1 : 0 }}>
            <Text style={{ fontSize: isMobile ? 24 : 32, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: PRIMARY }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4, fontFamily: fonts.medium, fontWeight: fontWeights.medium }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
