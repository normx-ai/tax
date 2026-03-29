import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useAuthStore } from "@/lib/store/auth";

const PRIMARY = "#D4A843";
const DARK = "#1A3A5C";
const TEXT_SEC = "#6b7280";

interface Props {
  isMobile: boolean;
  onScrollTo?: (section: string) => void;
}

export default function LandingHeader({ isMobile, onScrollTo }: Props) {
  const login = useAuthStore((s) => s.login);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 64,
        paddingHorizontal: 24,
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.08)",
        backgroundColor: "rgba(255,255,255,0.92)",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: PRIMARY,
          }}
        >
          <Text style={{ fontFamily: fonts.black, fontWeight: fontWeights.black, fontSize: 16, color: DARK }}>
            N
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 20, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: DARK, lineHeight: 22 }}>
            NORMX <Text style={{ color: PRIMARY }}>Tax</Text>
          </Text>
          <Text style={{ fontSize: 11, color: TEXT_SEC, fontFamily: fonts.regular, lineHeight: 14 }}>
            La fiscalité augmentée par l'IA
          </Text>
        </View>
      </View>

      {/* Navigation */}
      {!isMobile && (
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <TouchableOpacity onPress={() => onScrollTo?.("features")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Fonctionnalités
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onScrollTo?.("tarifs")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Tarifs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onScrollTo?.("contact")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Contact
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CTA → Keycloak */}
      <TouchableOpacity
        onPress={login}
        style={{
          paddingVertical: 9,
          paddingHorizontal: isMobile ? 16 : 22,
          borderRadius: 8,
          backgroundColor: DARK,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {isMobile ? (
          <Ionicons name="log-in-outline" size={20} color="#ffffff" />
        ) : (
          <Text style={{ color: "#ffffff", fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 14 }}>
            Connexion
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
