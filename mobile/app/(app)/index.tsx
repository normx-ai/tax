import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useMemo } from "react";
import { router, type Href } from "expo-router";
import { useAuthStore } from "@/lib/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import HomeCards from "@/components/mobile/HomeCards";
import { getEcheancesDuMois, getNomMois, type EcheanceFiscale } from "@/lib/services/calendrier-fiscal";
import { useActiveCode, type CodeId } from "@/lib/context/ActiveCodeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const CODE_CARDS: { id: CodeId; icon: keyof typeof Ionicons.glyphMap; label: string; description: string; color: string; available: boolean }[] = [
  { id: "cgi", icon: "book-outline", label: "Code Général des Impôts", description: "CGI 2026 — République du Congo", color: "#D4A843", available: true },
  { id: "social", icon: "people-outline", label: "Code Social", description: "Travail & Sécurité sociale — 2026", color: "#0F2A42", available: true },
];

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return `☀️ ${t("dashboard.greeting.morning")}`;
  if (h < 18) return `🌅 ${t("dashboard.greeting.afternoon")}`;
  return `🌙 ${t("dashboard.greeting.evening")}`;
}

const STATS = [
  { labelKey: "dashboard.stats.articles", value: "2 181", icon: "document-text-outline" as const, color: "#00815d" },
  { labelKey: "dashboard.stats.simulators", value: "16", icon: "calculator-outline" as const, color: "#4f46e5" },
  { labelKey: "dashboard.stats.tfnc", value: "64", icon: "library-outline" as const, color: "#d97706" },
  { labelKey: "dashboard.stats.edition", value: "2026", icon: "calendar-outline" as const, color: "#9333ea" },
];


export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { setActiveCode } = useActiveCode();

  const handleCodeSelect = (code: CodeId) => {
    setActiveCode(code);
    router.push("/(app)/code" as Href);
  };

  // Échéances du mois en cours — dynamique
  const now = new Date();
  const moisActuel = now.getMonth();
  const jourActuel = now.getDate();
  const nomMois = getNomMois(moisActuel);

  const echeancesMoisCourant = useMemo(() => {
    return getEcheancesDuMois(moisActuel);
  }, [moisActuel]);

  const QUICK_ACTIONS = useMemo(() => [
    {
      label: t("dashboard.actions.consultCgi"),
      desc: t("dashboard.actions.consultCgiDesc"),
      icon: "book-outline" as const,
      color: "#00815d",
      route: "/(app)/code",
    },
    {
      label: t("dashboard.actions.simulate"),
      desc: t("dashboard.actions.simulateDesc"),
      icon: "calculator-outline" as const,
      color: "#4f46e5",
      route: "/(app)/simulateur",
    },
    {
      label: t("dashboard.actions.chatAi"),
      desc: t("dashboard.actions.chatAiDesc"),
      icon: "chatbubbles-outline" as const,
      color: "#0284c7",
      route: "/(app)/chat",
    },
    {
      label: t("dashboard.actions.auditFacture"),
      desc: t("dashboard.actions.auditFactureDesc"),
      icon: "scan-outline" as const,
      color: "#dc2626",
      route: "/(app)/audit-facture",
    },
  ], [t]);


  // Sur mobile : affichage HomeCards (disposition proposée)
  if (isMobile) {
    return <HomeCards favoritesCount={0} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Bienvenue */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "400", color: colors.text }}>
            {getGreeting(t)}, {user?.prenom || t("dashboard.user")} !
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 2 }}>
            {t("dashboard.subtitle")}
          </Text>
        </View>

        {/* Stats cards — grille 2x2 */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {STATS.map((s) => (
              <View
                key={s.labelKey}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  backgroundColor: colors.card,
                  
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    
                    backgroundColor: `${s.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{s.value}</Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{t(s.labelKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 10 }}>{t("dashboard.quickActions")}</Text>
          <View
            style={{
              backgroundColor: colors.card,
              
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {QUICK_ACTIONS.map((a, i) => {
              const disabled = !a.route;
              return (
                <TouchableOpacity
                  key={a.label}
                  onPress={() => a.route && router.push(a.route as Href)}
                  disabled={disabled}
                  accessibilityLabel={a.label}
                  accessibilityRole="button"
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderBottomWidth: i < QUICK_ACTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.background,
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      
                      backgroundColor: `${a.color}15`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={a.icon} size={20} color={a.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: disabled ? colors.textMuted : colors.text }}>
                      {a.label}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textMuted }}>{a.desc}</Text>
                  </View>
                  {disabled ? (
                    <View style={{ backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted }}>{t("common.comingSoon")}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.disabled} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Échéances fiscales du mois */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{t("dashboard.fiscalDeadlines")}</Text>
            </View>
            <View style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>{nomMois} 2026</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {echeancesMoisCourant.map((e: EcheanceFiscale) => {
              const estPasse = e.jour < jourActuel;
              const estAujourdhui = e.jour === jourActuel;
              return (
                <View
                  key={`${e.jour}-${e.label}`}
                  style={{
                    width: "31.5%",
                    backgroundColor: estAujourdhui ? `${colors.primary}10` : colors.card,
                    borderWidth: 1,
                    borderColor: estAujourdhui ? colors.primary : colors.border,
                    padding: 10,
                    opacity: estPasse ? 0.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: estAujourdhui ? colors.primary : estPasse ? colors.disabled : `${colors.primary}15`,
                      alignItems: "center", justifyContent: "center", marginRight: 8,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: estAujourdhui ? "#fff" : estPasse ? colors.textMuted : colors.primary }}>{e.jour}</Text>
                    </View>
                    <Ionicons name={e.icon as keyof typeof Ionicons.glyphMap} size={16} color={estPasse ? colors.disabled : colors.primary} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: estPasse ? colors.textMuted : colors.text }} numberOfLines={2}>{e.label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
            {echeancesMoisCourant.length} {t("dashboard.obligationsThisMonth")}
          </Text>
        </View>

        {/* Footer */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>{t("dashboard.footer")}</Text>
          <Text style={{ fontSize: 13, color: colors.disabled, marginTop: 1 }}>NORMX AI</Text>
        </View>
      </ScrollView>
    </View>
  );
}
