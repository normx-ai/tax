import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

interface Props {
  isMobile: boolean;
  loaded: boolean;
}

const FEATURE_ICONS: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; descKey: string; color: string }[] = [
  { icon: "document-text-outline", titleKey: "landing.feat1Title", descKey: "landing.feat1Desc", color: "#00815d" },
  { icon: "book-outline", titleKey: "landing.feat2Title", descKey: "landing.feat2Desc", color: "#2563eb" },
  { icon: "mic-outline", titleKey: "landing.feat3Title", descKey: "landing.feat3Desc", color: "#9333ea" },
  { icon: "calculator-outline", titleKey: "landing.feat4Title", descKey: "landing.feat4Desc", color: "#ea580c" },
  { icon: "chatbubbles-outline", titleKey: "landing.feat5Title", descKey: "landing.feat5Desc", color: "#0891b2" },
  { icon: "calendar-outline", titleKey: "landing.feat6Title", descKey: "landing.feat6Desc", color: "#dc2626" },
  { icon: "people-outline", titleKey: "landing.feat7Title", descKey: "landing.feat7Desc", color: "#4f46e5" },
  { icon: "moon-outline", titleKey: "landing.feat8Title", descKey: "landing.feat8Desc", color: "#7c3aed" },
  { icon: "cloud-offline-outline", titleKey: "landing.feat9Title", descKey: "landing.feat9Desc", color: "#059669" },
  { icon: "phone-portrait-outline", titleKey: "landing.feat10Title", descKey: "landing.feat10Desc", color: "#d97706" },
];

export default function LandingFeatures({ isMobile, loaded }: Props) {
  const { t } = useTranslation();
  const { isTablet } = useResponsive();
  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <View style={{ maxWidth: 1060, alignSelf: "center", width: "100%", paddingHorizontal: 24, paddingBottom: 60, backgroundColor: "#ffffff" }}>
      <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: isMobile ? 28 : 36, color: "#0F2A42", textAlign: "center", marginBottom: 8 }}>
        {t("landing.featuresTitle")}
      </Text>
      <Text style={{ fontSize: isMobile ? 14 : 16, color: "#5a6a7a", textAlign: "center", fontFamily: fonts.light, fontWeight: fontWeights.light, marginBottom: 36 }}>
        {t("landing.featuresSubtitle")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
        {FEATURE_ICONS.map((feat, i) => (
          <View
            key={i}
            style={{
              width: cols === 1 ? "100%" : cols === 2 ? "47%" : "30%",
              flexGrow: 1,
              backgroundColor: "#f8f9fa",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              borderRadius: 16,
              padding: isMobile ? 22 : 28,
              opacity: loaded ? 1 : 0,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${feat.color}15`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name={feat.icon} size={22} color={feat.color} />
            </View>
            <Text style={{ fontSize: 17, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#0F2A42", marginBottom: 6 }}>
              {t(feat.titleKey)}
            </Text>
            <Text style={{ fontSize: 15, color: "#5a6a7a", lineHeight: 20, fontFamily: fonts.light, fontWeight: fontWeights.light }}>
              {t(feat.descKey)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
