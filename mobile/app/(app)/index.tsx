import { View, Text, TouchableOpacity, ScrollView, Pressable } from "react-native";
import { useMemo, useState } from "react";
import { router, type Href } from "expo-router";
import { useAuthStore } from "@/lib/store/auth";
import { useHistoryStore } from "@/lib/store/history";
import { useFavoritesStore } from "@/lib/store/favorites";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import HomeCards from "@/components/mobile/HomeCards";
import { getEcheancesDuMois, getNomMois, getProchaineEcheance, type EcheanceFiscale } from "@/lib/services/calendrier-fiscal";
import { useActiveCode, type CodeId } from "@/lib/context/ActiveCodeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const CODE_CARDS: { id: CodeId; icon: keyof typeof Ionicons.glyphMap; label: string; description: string; color: string; available: boolean }[] = [
  { id: "cgi", icon: "book-outline", label: "Code Général des Impôts", description: "CGI 2026 — République du Congo", color: "#D4A843", available: true },
  { id: "social", icon: "people-outline", label: "Code Social", description: "Travail & Sécurité sociale — 2026", color: "#3b82f6", available: true },
];

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return `☀️ ${t("dashboard.greeting.morning")}`;
  if (h < 18) return `🌅 ${t("dashboard.greeting.afternoon")}`;
  return `🌙 ${t("dashboard.greeting.evening")}`;
}

const STATS = [
  { labelKey: "dashboard.stats.articles", value: "2 255", icon: "document-text-outline" as const, color: "#D4A843" },
  { labelKey: "dashboard.stats.socialArticles", value: "1 448", icon: "people-outline" as const, color: "#3b82f6" },
  { labelKey: "dashboard.stats.simulators", value: "16", icon: "calculator-outline" as const, color: "#4f46e5" },
  { labelKey: "dashboard.stats.edition", value: "2026", icon: "calendar-outline" as const, color: "#9333ea" },
];


export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { setActiveCode } = useActiveCode();
  const historyItems = useHistoryStore((s) => s.items);
  const favoriteIds = useFavoritesStore((s) => s.articleIds);

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

  const prochaineEcheance = useMemo(() => getProchaineEcheance(), []);

  const QUICK_ACTIONS = useMemo(() => [
    {
      label: t("dashboard.actions.consultCgi"),
      desc: t("dashboard.actions.consultCgiDesc"),
      icon: "book-outline" as const,
      color: "#D4A843",
      route: "/(app)/code",
      onPress: () => { setActiveCode("cgi"); router.push("/(app)/code" as Href); },
    },
    {
      label: t("dashboard.actions.consultSocial"),
      desc: t("dashboard.actions.consultSocialDesc"),
      icon: "people-outline" as const,
      color: "#3b82f6",
      route: "/(app)/code",
      onPress: () => { setActiveCode("social"); router.push("/(app)/code" as Href); },
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


  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  // Sur mobile : affichage HomeCards (disposition proposée)
  if (isMobile) {
    return <HomeCards favoritesCount={favoriteIds.length} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Actions rapides — horizontal en haut */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {QUICK_ACTIONS.map((a) => {
              const disabled = !a.route;
              return (
                <Pressable
                  key={a.label}
                  onPress={() => a.onPress ? a.onPress() : a.route && router.push(a.route as Href)}
                  disabled={disabled}
                  accessibilityLabel={a.label}
                  onHoverIn={() => setHoveredAction(a.label)}
                  onHoverOut={() => setHoveredAction((prev) => (prev === a.label ? null : prev))}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: disabled ? 0.5 : 1,
                    position: "relative",
                  }}
                >
                  <Ionicons name={a.icon} size={22} color={a.color} />
                  {hoveredAction === a.label && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: [{ translateX: -50 }],
                        marginTop: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: "#0f2a42",
                        minWidth: 100,
                        zIndex: 1000,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12, fontFamily: fonts.medium, fontWeight: fontWeights.medium, textAlign: "center" }} numberOfLines={1}>
                        {a.label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Bienvenue */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "400", color: colors.text }}>
            {getGreeting(t)}, {user?.prenom || t("dashboard.user")} !
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 2 }}>
            {t("dashboard.subtitle")}
          </Text>
        </View>

        {/* Alerte prochaine echeance */}
        {prochaineEcheance && (
          <TouchableOpacity
            onPress={() => router.push("/(app)/calendrier" as Href)}
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              padding: 12,
              backgroundColor: prochaineEcheance.joursRestants <= 3 ? "#fef2f2" : prochaineEcheance.joursRestants <= 7 ? "#fffbeb" : `${colors.primary}10`,
              borderLeftWidth: 4,
              borderLeftColor: prochaineEcheance.joursRestants <= 3 ? colors.danger : prochaineEcheance.joursRestants <= 7 ? colors.warning : colors.primary,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={prochaineEcheance.joursRestants <= 3 ? colors.danger : prochaineEcheance.joursRestants <= 7 ? colors.warning : colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }}>
                Prochaine échéance : {prochaineEcheance.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}

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
                  <Text style={{ fontSize: 22, fontWeight: "400", color: colors.text }}>{s.value}</Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{t(s.labelKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Dernières consultations */}
        {historyItems.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name="time-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, fontWeight: "500", color: colors.text }}>{t("dashboard.recentConsultations")}</Text>
            </View>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              {historyItems.slice(0, 5).map((item, i) => (
                <TouchableOpacity
                  key={`${item.code}-${item.article}-${i}`}
                  onPress={() => {
                    setActiveCode(item.code);
                    router.push("/(app)/code" as Href);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: i < Math.min(historyItems.length, 5) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    gap: 10,
                  }}
                >
                  <Ionicons name={item.code === "cgi" ? "book-outline" : "people-outline"} size={16} color={item.code === "cgi" ? "#D4A843" : "#3b82f6"} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }} numberOfLines={1}>{item.article}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{item.titre}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>
                    {new Date(item.timestamp).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Favoris */}
        {favoriteIds.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name="heart" size={15} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, fontWeight: "500", color: colors.text }}>Mes favoris</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>{favoriteIds.length}</Text>
            </View>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              {favoriteIds.slice(0, 5).map((artId, i) => (
                <TouchableOpacity
                  key={artId}
                  onPress={() => router.push("/(app)/code" as Href)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: i < Math.min(favoriteIds.length, 5) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    gap: 10,
                  }}
                >
                  <Ionicons name="heart" size={14} color="#ef4444" />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }} numberOfLines={1}>{artId}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Échéances fiscales du mois */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{t("dashboard.fiscalDeadlines")}</Text>
            </View>
            <View style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 10, paddingVertical: 3 }}>
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
                      width: 28, height: 28,
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
