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
    <View style={{ alignItems: "center", paddingTop: isMobile ? 60 : 100, paddingBottom: 60, paddingHorizontal: 24, backgroundColor: BG_WARM }}>
      {/* Badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: "rgba(212,168,67,0.1)",
          borderRadius: 100,
          paddingVertical: 8,
          paddingHorizontal: 20,
          marginBottom: 32,
        }}
      >
        <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: PRIMARY, letterSpacing: 0.5 }}>
          La fiscalité augmentée par l'IA
        </Text>
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: fonts.black,
          fontWeight: fontWeights.black,
          fontSize: isMobile ? 30 : 52,
          color: DARK,
          textAlign: "center",
          lineHeight: isMobile ? 36 : 60,
          marginBottom: 20,
          letterSpacing: -0.5,
        }}
      >
        {"Simulez vos impôts,\naccédez au "}
        <Text style={{ color: PRIMARY }}>code fiscal et social</Text>
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          fontSize: isMobile ? 15 : 18,
          color: TEXT_SEC,
          maxWidth: 560,
          textAlign: "center",
          lineHeight: isMobile ? 24 : 30,
          fontFamily: fonts.regular,
          fontWeight: fontWeights.regular,
          marginBottom: 36,
        }}
      >
        Simulateurs fiscaux et sociaux, assistant IA et +2 200 articles indexés — Code Général des Impôts et Code Social du Congo à portée de main.
      </Text>

      {/* CTA buttons */}
      <View style={{ flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: "center", marginBottom: 48 }}>
        <TouchableOpacity
          onPress={login}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 10,
            backgroundColor: PRIMARY,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: DARK, fontSize: 16, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
            Se connecter →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={register}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: "rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        >
          <Text style={{ color: DARK, fontSize: 16, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
            Créer un compte
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View
        style={{
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
        }}
      >
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

      {/* Screenshot app */}
      {!isMobile && (
        <View style={{ marginTop: 48, width: "100%", maxWidth: 900, alignSelf: "center" }}>
          <View style={{
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            padding: 6,
            paddingBottom: 0,
            borderWidth: 2,
            borderColor: "#2a2a2a",
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#3a3a3a", alignSelf: "center", marginBottom: 4 }} />
            <Image
              source={require("@/assets/princ_normx_tax.png")}
              style={{ width: "100%", height: 450, borderRadius: 4 }}
              resizeMode="cover"
            />
          </View>
          <View style={{ height: 12, backgroundColor: "#c8c8c8", borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
            <View style={{ width: 80, height: 4, backgroundColor: "#9a9a9a", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignSelf: "center" }} />
          </View>
        </View>
      )}
    </View>
  );
}
