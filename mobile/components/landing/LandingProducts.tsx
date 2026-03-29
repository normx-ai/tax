import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

interface Props {
  isMobile: boolean;
}

const PRODUCTS = [
  {
    icon: "receipt-outline" as const,
    name: "NORMX Tax",
    desc: "Fiscalité & Code Général des Impôts. Simulateurs, assistant IA, calendrier fiscal.",
    color: GOLD,
    tag: "Disponible",
    tagColor: "#4ade80",
    available: true,
  },
  {
    icon: "calculator-outline" as const,
    name: "NORMX Compta",
    desc: "Comptabilité conforme aux normes OHADA, plan comptable SYSCOHADA révisé, états financiers.",
    color: "#3b82f6",
    tag: "Bientôt",
    tagColor: "#5a5a65",
    available: false,
  },
  {
    icon: "document-text-outline" as const,
    name: "NORMX Legal",
    desc: "Droit des affaires, actes uniformes OHADA, modèles de contrats et assistant juridique IA.",
    color: "#8b5cf6",
    tag: "Bientôt",
    tagColor: "#5a5a65",
    available: false,
  },
  {
    icon: "people-outline" as const,
    name: "NORMX Paie",
    desc: "Code du travail, simulation de bulletins de paie, cotisations sociales et assistant social IA.",
    color: "#f59e0b",
    tag: "Bientôt",
    tagColor: "#5a5a65",
    available: false,
  },
];

export default function LandingProducts({ isMobile }: Props) {
  const { isTablet } = useResponsive();
  const cols = isMobile ? 1 : isTablet ? 2 : 4;

  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 24, maxWidth: 1060, alignSelf: "center", width: "100%", backgroundColor: "#ffffff" }}>
      <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#0F2A42", textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
        Nos produits
      </Text>
      <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: isMobile ? 26 : 36, color: "#0F2A42", textAlign: "center", marginBottom: 8 }}>
        Une suite complète pour les professionnels
      </Text>
      <Text style={{ fontSize: 16, color: "#5a6a7a", textAlign: "center", fontFamily: fonts.light, fontWeight: fontWeights.light, marginBottom: 40 }}>
        Chaque module répond aux besoins des entreprises, cabinets et administrations en Afrique.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
        {PRODUCTS.map((product, i) => {
          const Card = product.available ? TouchableOpacity : View;
          return (
            <Card
              key={i}
              {...(product.available ? { onPress: () => router.push("/cgi242"), activeOpacity: 0.7 } : {})}
              style={{
                width: cols === 1 ? "100%" : cols === 2 ? "47%" : "22%",
                flexGrow: 1,
                backgroundColor: product.available ? "rgba(26,58,92,0.03)" : "#f8f9fa",
                borderWidth: product.available ? 2 : 1,
                borderColor: product.available ? "#0F2A42" : "rgba(0,0,0,0.08)",
                borderRadius: 16,
                padding: isMobile ? 22 : 28,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {product.available && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "#0F2A42" }} />
              )}
              <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: `${product.color}18`, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name={product.icon} size={24} color={product.color} />
              </View>
              <Text style={{ fontSize: 20, fontFamily: fonts.extraBold, fontWeight: fontWeights.extraBold, color: "#0F2A42", marginBottom: 8 }}>
                {product.name}
              </Text>
              <Text style={{ fontSize: 14, color: "#5a6a7a", lineHeight: 20, fontFamily: fonts.light, fontWeight: fontWeights.light, marginBottom: 16 }}>
                {product.desc}
              </Text>
              <View style={{ alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, backgroundColor: product.available ? "rgba(74,222,128,0.1)" : "rgba(0,0,0,0.04)" }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: product.tagColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {product.tag}
                </Text>
              </View>
              {product.available && (
                <Text style={{ marginTop: 12, fontSize: 14, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#0F2A42" }}>
                  Accéder →
                </Text>
              )}
            </Card>
          );
        })}
      </View>
    </View>
  );
}
