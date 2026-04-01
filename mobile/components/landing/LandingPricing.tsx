import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

interface Props {
  isMobile: boolean;
}

const PLANS = [
  {
    name: "Decouverte",
    tag: "FREE",
    price: "0",
    period: "7 jours d'essai",
    color: "#6b7280",
    features: [
      "10 credits (IA + recherche)",
      "3 audits de documents",
      "3 simulateurs (ITS, TVA, IS)",
      "CGI + Code Social en lecture",
    ],
  },
  {
    name: "Starter",
    tag: "STARTER",
    price: "150€",
    period: "par an (~98 000 FCFA)",
    color: "#3b82f6",
    features: [
      "80 credits/mois",
      "26 audits/mois",
      "16 simulateurs complets",
      "CGI + Code Social illimite",
      "Calendrier fiscal + alertes",
      "Historique et favoris",
    ],
  },
  {
    name: "Pro",
    tag: "PRO",
    price: "300€",
    period: "par an (~197 000 FCFA)",
    color: "#0F2A42",
    popular: true,
    features: [
      "150 credits/mois",
      "50 audits/mois",
      "16 simulateurs complets",
      "Organisation et equipes",
      "Analytics et audit trail",
      "Support prioritaire",
    ],
  },
];

export default function LandingPricing({ isMobile }: Props) {
  const { t } = useTranslation();

  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 24, backgroundColor: "#ffffff" }}>
      <Text
        style={{
          fontFamily: fonts.headingBlack,
          fontWeight: fontWeights.headingBlack,
          fontSize: isMobile ? 26 : 40,
          color: "#0F2A42",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Tarifs simples, credits flexibles
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: "#5a6a7a",
          fontSize: 17,
          fontFamily: fonts.light,
          fontWeight: fontWeights.light,
          marginBottom: 12,
        }}
      >
        1 credit = 1 question IA — 1 audit = 3 credits
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: "#5a6a7a",
          fontSize: 14,
          fontFamily: fonts.light,
          fontWeight: fontWeights.light,
          marginBottom: 40,
        }}
      >
        Packs credits disponibles : 30 (8 EUR) · 80 (18 EUR) · 200 (35 EUR)
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 16,
          maxWidth: 1200,
          alignSelf: "center",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {PLANS.map((plan) => (
          <View
            key={plan.tag}
            style={{
              width: isMobile ? "100%" : "48%",
              maxWidth: isMobile ? undefined : 280,
              flexGrow: isMobile ? undefined : 1,
              borderRadius: 16,
              borderWidth: plan.popular ? 2 : 1,
              borderColor: plan.popular
                ? plan.color
                : "rgba(0,0,0,0.08)",
              backgroundColor: plan.popular
                ? "rgba(139,92,246,0.04)"
                : "#f8f9fa",
              padding: 28,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {plan.popular && (
              <View
                style={{
                  position: "absolute",
                  top: 14,
                  right: -28,
                  backgroundColor: plan.color,
                  paddingVertical: 4,
                  paddingHorizontal: 32,
                  transform: [{ rotate: "45deg" }],
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontWeight: fontWeights.bold,
                    fontSize: 11,
                    color: "#fff",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {t("landing.pricingPopular")}
                </Text>
              </View>
            )}

            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontWeight: fontWeights.semiBold,
                fontSize: 15,
                color: plan.color,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 12,
              }}
            >
              {plan.name}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 4 }}>
              <Text
                style={{
                  fontFamily: fonts.headingBlack,
                  fontWeight: fontWeights.headingBlack,
                  fontSize: 38,
                  color: "#0F2A42",
                }}
              >
                {plan.price}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontWeight: fontWeights.regular,
                fontSize: 15,
                color: "#5a6a7a",
                marginBottom: 20,
              }}
            >
              {plan.period}
            </Text>

            {plan.features.map((feat, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={plan.color}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontWeight: fontWeights.regular,
                    fontSize: 15,
                    color: "#5a6a7a",
                    flex: 1,
                  }}
                >
                  {feat}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: plan.popular ? plan.color : "rgba(26,58,92,0.06)",
                borderWidth: plan.popular ? 0 : 1,
                borderColor: "rgba(0,0,0,0.08)",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontWeight: fontWeights.bold,
                  fontSize: 16,
                  color: plan.popular ? "#fff" : "#0F2A42",
                }}
              >
                {plan.tag === "FREE" ? "Essayer gratuitement" : "Commencer"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
