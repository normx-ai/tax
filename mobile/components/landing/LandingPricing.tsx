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
    nameKey: "landing.pricingFree",
    tag: "FREE",
    price: "0",
    periodKey: "landing.pricingTrialPeriod",
    color: "#6b7280",
    featureKeys: [
      "landing.pricingFeat5q",
      "landing.pricingFeat3audit",
      "landing.pricingFeatCgiRead",
      "landing.pricingFeatAllSimTrial",
    ],
  },
  {
    nameKey: "landing.pricingStarter",
    tag: "STARTER",
    price: "69€",
    periodKey: "landing.pricingPerYear",
    color: "#3b82f6",
    featureKeys: [
      "landing.pricingFeat15q",
      "landing.pricingFeat10audit",
      "landing.pricingFeatCgiFull",
      "landing.pricingFeat5sim",
      "landing.pricingFeatHistory",
    ],
  },
  {
    nameKey: "landing.pricingProfessional",
    tag: "PROFESSIONAL",
    price: "149€",
    periodKey: "landing.pricingPerYear",
    color: "#0F2A42",
    popular: true,
    featureKeys: [
      "landing.pricingFeat30q",
      "landing.pricingFeat30audit",
      "landing.pricingFeatCgiFull",
      "landing.pricingFeatAllSim",
      "landing.pricingFeatHistory",
    ],
  },
  {
    nameKey: "landing.pricingTeam",
    tag: "TEAM",
    price: "299€",
    periodKey: "landing.pricingPerYear",
    color: "#8b5cf6",
    featureKeys: [
      "landing.pricingFeat200q",
      "landing.pricingFeat100audit",
      "landing.pricingFeatAllSim",
      "landing.pricingFeatOrg",
      "landing.pricingFeatAnalytics",
      "landing.pricingFeatPriority",
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
        {t("landing.pricingTitle")}
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: "#5a6a7a",
          fontSize: 17,
          fontFamily: fonts.light,
          fontWeight: fontWeights.light,
          marginBottom: 40,
        }}
      >
        {t("landing.pricingSubtitle")}
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
              {t(plan.nameKey)}
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
              {t(plan.periodKey)}
            </Text>

            {plan.featureKeys.map((featKey, idx) => (
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
                  {t(featKey)}
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
                {plan.tag === "FREE" ? t("landing.pricingTryFree") : t("landing.pricingStart")}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
