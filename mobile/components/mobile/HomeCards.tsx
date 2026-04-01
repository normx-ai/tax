import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { getEcheancesDuMois, getNomMois, getJoursRestants, type EcheanceFiscale } from "@/lib/services/calendrier-fiscal";

type Props = {
  favoritesCount?: number;
};

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.greeting.morning");
  if (h < 18) return t("dashboard.greeting.afternoon");
  return t("dashboard.greeting.evening");
}

const STATS = [
  { labelKey: "dashboard.stats.articles", value: "+2 200", icon: "document-text-outline" as const, color: "#D4A843" },
  { labelKey: "dashboard.stats.simulators", value: "16", icon: "calculator-outline" as const, color: "#374151" },
  { labelKey: "dashboard.stats.tfnc", value: "2", icon: "library-outline" as const, color: "#D4A843" },
  { labelKey: "dashboard.stats.edition", value: "2026", icon: "calendar-outline" as const, color: "#374151" },
];

const ACTIONS = [
  { titleKey: "dashboard.actions.consultCgi", descKey: "dashboard.actions.consultCgiDesc", icon: "book-outline" as const, route: "/(app)/code" },
  { titleKey: "dashboard.actions.chatAi", descKey: "dashboard.actions.chatAiDesc", icon: "chatbubbles-outline" as const, route: "/(app)/chat" },
  { titleKey: "dashboard.actions.simulate", descKey: "dashboard.actions.simulateDesc", icon: "stats-chart-outline" as const, route: "/(app)/simulateur" },
  { titleKey: "dashboard.actions.settings", descKey: "dashboard.actions.settingsDesc", icon: "settings-outline" as const, route: "/(app)/parametres" },
];

export default function HomeCards({ favoritesCount: _fc }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const cardBase = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  };

  const now = new Date();
  const moisActuel = now.getMonth();
  const jourActuel = now.getDate();
  const nomMois = getNomMois(moisActuel);

  // Prochaines 3 échéances non passées du mois en cours
  const prochaines3 = useMemo(() => {
    const echeances = getEcheancesDuMois(moisActuel);
    return echeances
      .filter((e) => e.jour >= jourActuel)
      .slice(0, 3);
  }, [moisActuel, jourActuel]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
      {/* Actions rapides — grille 2x2 (en premier) */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        {ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.titleKey}
            onPress={() => router.push(item.route as Href)}
            style={{
              ...cardBase,
              flex: 1,
              minWidth: "45%",
              alignItems: "center",
              paddingVertical: 22,
              paddingHorizontal: 14,
            }}
          >
            <Ionicons name={item.icon} size={28} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 16, color: colors.text, marginBottom: 3, textAlign: "center" }}>
              {t(item.titleKey)}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
              {t(item.descKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* En-tête — Greeting */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.textSecondary, marginBottom: 4 }}>
          {getGreeting(t)}
        </Text>
        <Text style={{ fontFamily: fonts.extraBold, fontWeight: fontWeights.extraBold, fontSize: 26, color: colors.text, letterSpacing: -0.5 }}>
          NORMX <Text style={{ color: colors.primary }}>Tax</Text>
        </Text>
      </View>

      {/* Stats — barre unique 1x4 */}
      <View style={{
        flexDirection: "row",
        backgroundColor: "#374151",
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        marginBottom: 22,
      }}>
        {STATS.map((s, i) => (
          <View
            key={s.labelKey}
            style={{
              flex: 1,
              alignItems: "center",
              borderRightWidth: i < STATS.length - 1 ? 1 : 0,
              borderRightColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Text style={{ fontFamily: fonts.black, fontWeight: fontWeights.black, fontSize: 20, color: "#D4A843" }}>
              {s.value}
            </Text>
            <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 10, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 2 }} numberOfLines={1}>
              {t(s.labelKey)}
            </Text>
          </View>
        ))}
      </View>

      {/* Echéances fiscales */}
      <View style={{ marginBottom: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 16, color: colors.text }}>
              {t("dashboard.fiscalDeadlines")}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(app)/calendrier" as Href)}>
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.primary }}>
              {t("dashboard.seeAll")}
            </Text>
          </TouchableOpacity>
        </View>
        {prochaines3.map((e: EcheanceFiscale, i: number) => {
          const joursRestants = getJoursRestants(e.jour, moisActuel);
          return (
            <View
              key={`${e.jour}-${e.label}`}
              style={{
                ...cardBase,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                marginBottom: i < 2 ? 10 : 0,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={e.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15, color: colors.text }} numberOfLines={1}>
                  {e.label}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.textMuted }}>
                  {e.jour} {nomMois}
                </Text>
              </View>
              {joursRestants <= 3 && (
                <View style={{ backgroundColor: "#ef4444", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 12, color: "#fff" }}>
                    {t("common.urgent")}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          );
        })}
      </View>

      {/* Astuce du jour */}
      <View
        style={{
          ...cardBase,
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}25`,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 15, color: colors.primary }}>
            {t("dashboard.tip.title")}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 18 }}>
          {t("dashboard.tip.text")}
        </Text>
      </View>
    </ScrollView>
  );
}
