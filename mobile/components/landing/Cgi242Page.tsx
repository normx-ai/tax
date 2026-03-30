import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";
const BG = "#0F2A42";

const CODE_OPTIONS = [
  { id: "cgi", icon: "book-outline" as const, label: "Code Général des Impôts", desc: "CGI 242 — Édition 2026", available: true },
  { id: "social", icon: "people-outline" as const, label: "Code Social", desc: "Travail & Sécurité sociale", available: true },
  { id: "hydrocarbures", icon: "flame-outline" as const, label: "Code des Hydrocarbures", desc: "Loi n°2024-28", available: false },
  { id: "douanier", icon: "shield-checkmark-outline" as const, label: "Code Douanier", desc: "CEMAC", available: false },
];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; descKey: string; color: string }[] = [
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

export default function Cgi242Page() {
  const { t } = useTranslation();
  const { isMobile, isTablet } = useResponsive();
  const [codeDropdownOpen, setCodeDropdownOpen] = useState(false);

  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  const stats = [
    { value: "3 703", label: t("landing.statsArticles") },
    { value: "16", label: t("landing.statsSimulators") },
    { value: "64", label: t("landing.statsTexts") },
    { value: "2026", label: t("landing.statsEdition") },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* Header — bleu */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 20,
          paddingHorizontal: isMobile ? 16 : 32,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          backgroundColor: BG,
          zIndex: 100,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.replace("/")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.5)" />
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.black, fontWeight: fontWeights.black, fontSize: 16, color: BG }}>N</Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#e8e6e1" }}>
              NORMX <Text style={{ color: GOLD }}>Tax</Text>
            </Text>
          </TouchableOpacity>

          {/* Dropdown codes */}
          {!isMobile && (
            <View style={{ marginLeft: 16 }}>
              <TouchableOpacity
                onPress={() => setCodeDropdownOpen(!codeDropdownOpen)}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Ionicons name="book-outline" size={15} color={GOLD} />
                <Text style={{ color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 14, marginLeft: 6 }}>
                  Codes
                </Text>
                <Ionicons name="chevron-down" size={14} color={GOLD} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              {codeDropdownOpen && (
                <View style={{ position: "absolute", top: 38, left: 0, zIndex: 9999, backgroundColor: "#12121a", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, minWidth: 300, padding: 6, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }}>
                  {CODE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { setCodeDropdownOpen(false); if (opt.available) router.push("/(auth)"); }}
                      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, opacity: opt.available ? 1 : 0.5 }}
                    >
                      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: "rgba(200,160,60,0.1)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={opt.icon} size={16} color={GOLD} />
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 14, color: "#e8e6e1" }}>
                          {opt.label}
                        </Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{opt.desc}</Text>
                      </View>
                      {!opt.available && (
                        <View style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>Bientôt</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: isMobile ? 8 : 16, alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.push("/(auth)")} style={{ padding: 8 }}>
            <Text style={{ fontSize: 15, color: "#b0b0b8", fontFamily: fonts.medium, fontWeight: fontWeights.medium }}>{t("landing.login")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={{ paddingVertical: 9, paddingHorizontal: 22, borderRadius: 8, backgroundColor: GOLD }}
          >
            <Text style={{ color: BG, fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 15 }}>Essai gratuit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero — blanc */}
      <View style={{ alignItems: "center", paddingTop: isMobile ? 60 : 90, paddingBottom: 50, paddingHorizontal: 24, backgroundColor: "#ffffff" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(26,58,92,0.06)",
            borderWidth: 1,
            borderColor: "rgba(26,58,92,0.12)",
            borderRadius: 100,
            paddingVertical: 7,
            paddingHorizontal: 18,
            marginBottom: 28,
          }}
        >
          <Text style={{ fontSize: 26 }}>🇨🇬</Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: BG }}>
            Congo-Brazzaville — Édition 2026
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.headingBlack,
            fontWeight: fontWeights.headingBlack,
            fontSize: isMobile ? 32 : 56,
            color: BG,
            textAlign: "center",
            lineHeight: isMobile ? 38 : 64,
            marginBottom: 20,
          }}
        >
          {t("landing.heroTitle")}{"\n"}
          <Text style={{ color: GOLD }}>{t("landing.heroTitleAccent")}</Text>
        </Text>

        <Text
          style={{
            fontSize: isMobile ? 15 : 19,
            color: "#5a6a7a",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: isMobile ? 24 : 31,
            fontFamily: fonts.light,
            fontWeight: fontWeights.light,
            marginBottom: 44,
          }}
        >
          {t("landing.heroSubtitle")}
        </Text>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: isMobile ? 24 : 56,
            flexWrap: "wrap",
            marginBottom: 50,
          }}
        >
          {stats.map((stat, i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: isMobile ? 28 : 40, fontFamily: fonts.black, fontWeight: fontWeights.black, color: BG }}>
                {stat.value}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#5a6a7a",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginTop: 5,
                  fontFamily: fonts.medium,
                  fontWeight: fontWeights.medium,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={{ flexDirection: isMobile ? "column" : "row", gap: 14, alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={{ paddingVertical: 15, paddingHorizontal: 38, borderRadius: 12, backgroundColor: BG }}
          >
            <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: fonts.extraBold, fontWeight: fontWeights.extraBold }}>
              {t("landing.heroCtaPrimary")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)")}
            style={{ paddingVertical: 13, paddingHorizontal: 38, borderRadius: 12, borderWidth: 1, borderColor: "rgba(26,58,92,0.2)" }}
          >
            <Text style={{ color: BG, fontSize: 18, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              {t("landing.login")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features — blanc */}
      <View style={{ maxWidth: 1060, alignSelf: "center", width: "100%", paddingHorizontal: 24, paddingBottom: 60, backgroundColor: "#ffffff" }}>
        <Text
          style={{
            fontFamily: fonts.headingBlack,
            fontWeight: fontWeights.headingBlack,
            fontSize: isMobile ? 28 : 36,
            color: BG,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {t("landing.featuresTitle")}
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 14 : 16,
            color: "#5a6a7a",
            textAlign: "center",
            fontFamily: fonts.light,
            fontWeight: fontWeights.light,
            marginBottom: 36,
          }}
        >
          {t("landing.featuresSubtitle")}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          {FEATURES.map((feat, i) => (
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
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: feat.color + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons name={feat.icon} size={24} color={feat.color} />
              </View>
              <Text style={{ fontSize: 18, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: BG, marginBottom: 6 }}>
                {t(feat.titleKey)}
              </Text>
              <Text style={{ fontSize: 15, color: "#5a6a7a", lineHeight: 20, fontFamily: fonts.light, fontWeight: fontWeights.light }}>
                {t(feat.descKey)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA final — blanc */}
      <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 24, backgroundColor: "#ffffff" }}>
        <Text
          style={{
            fontFamily: fonts.headingBlack,
            fontWeight: fontWeights.headingBlack,
            fontSize: 38,
            color: BG,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {t("landing.ctaTitle")}
        </Text>
        <Text style={{ color: "#5a6a7a", fontSize: 17, fontFamily: fonts.light, fontWeight: fontWeights.light, marginBottom: 28 }}>
          7 jours gratuits — Aucune carte bancaire requise
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/register")}
          style={{ paddingVertical: 15, paddingHorizontal: 38, borderRadius: 12, backgroundColor: BG }}
        >
          <Text style={{ color: "#ffffff", fontSize: 18, fontFamily: fonts.extraBold, fontWeight: fontWeights.extraBold }}>
            {t("landing.ctaButton")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer — bleu */}
      <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", backgroundColor: BG, paddingVertical: 28, paddingHorizontal: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: fonts.regular }}>
          {t("landing.copyright")}
        </Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6, fontFamily: fonts.regular }}>
          {"Propulsé par "}
          <Text style={{ color: GOLD, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>NORMX AI</Text>
          {" — Marque déposée INPI n°5146181"}
        </Text>
      </View>
    </ScrollView>
  );
}
