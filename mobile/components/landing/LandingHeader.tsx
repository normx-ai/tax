import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useAuthStore } from "@/lib/store/auth";

const PRIMARY = "#D4A843";
const DARK = "#1A3A5C";

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
        paddingVertical: 16,
        paddingHorizontal: isMobile ? 16 : 32,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.06)",
        backgroundColor: "rgba(255,255,255,0.95)",
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
        <Text style={{ fontSize: 22, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: DARK }}>
          NORMX <Text style={{ color: PRIMARY }}>Tax</Text>
        </Text>
      </View>

      {/* Navigation */}
      {!isMobile && (
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <TouchableOpacity onPress={() => onScrollTo?.("produits")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Produits
            </Text>
          </TouchableOpacity>
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
            Démarrer maintenant
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
