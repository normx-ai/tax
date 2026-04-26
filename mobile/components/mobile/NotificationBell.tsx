import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import {
  getEcheancesDuMois,
  getJoursRestants,
  type EcheanceFiscale,
} from "@/lib/services/calendrier-fiscal";
import { fonts, fontWeights } from "@/lib/theme/fonts";

/**
 * Composant cloche de notification avec badge et panneau d'échéances fiscales.
 *
 * Affiche les échéances à venir du mois en cours avec le nombre de jours restants.
 * Le badge montre le nombre d'échéances dans les 5 prochains jours.
 */
export default function NotificationBell() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const [visible, setVisible] = useState(false);

  const now = new Date();
  const moisActuel = now.getMonth();
  const jourActuel = now.getDate();

  // Échéances du mois courant
  const echeancesDuMois = useMemo(() => getEcheancesDuMois(moisActuel), [moisActuel]);

  // Échéances à venir (non passées) avec jours restants
  const echeancesAVenir = useMemo(() => {
    const items: { echeance: EcheanceFiscale; joursRestants: number }[] = [];
    // Dédupliquer par jour (regrouper les échéances du même jour)
    const joursTraites = new Set<number>();

    for (const e of echeancesDuMois) {
      if (e.jour >= jourActuel) {
        const jr = e.jour - jourActuel;
        items.push({ echeance: e, joursRestants: jr });
      }
    }
    return items.sort((a, b) => a.joursRestants - b.joursRestants);
  }, [echeancesDuMois, jourActuel]);

  // Badge : nombre d'échéances dans les 5 prochains jours
  const badgeCount = useMemo(() => {
    const joursUniques = new Set(
      echeancesAVenir
        .filter((e) => e.joursRestants <= 5)
        .map((e) => e.echeance.jour)
    );
    return joursUniques.size;
  }, [echeancesAVenir]);

  // Regrouper les échéances par jour pour l'affichage
  const echeancesParJour = useMemo(() => {
    const map = new Map<number, { echeances: EcheanceFiscale[]; joursRestants: number }>();
    for (const item of echeancesAVenir) {
      const existing = map.get(item.echeance.jour);
      if (existing) {
        existing.echeances.push(item.echeance);
      } else {
        map.set(item.echeance.jour, {
          echeances: [item.echeance],
          joursRestants: item.joursRestants,
        });
      }
    }
    // Trier : spécifiques (rouge) en haut dans chaque groupe
    for (const [, group] of map) {
      group.echeances.sort((a, b) => (a.recurrent === b.recurrent ? 0 : a.recurrent ? 1 : -1));
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [echeancesAVenir]);

  const NOMS_MOIS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        hitSlop={8}
        accessibilityLabel={t("notifications.title")}
        accessibilityRole="button"
      >
        <View>
          <Ionicons name="notifications" size={20} color="#fff" />
          {badgeCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                backgroundColor: colors.danger,
                width: 9,
                height: 9,
              }}
            />
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              position: "absolute",
              top: isMobile ? 56 : 50,
              right: isMobile ? 12 : 80,
              width: isMobile ? 320 : 380,
              maxHeight: 480,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="notifications" size={18} color={colors.primary} />
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontWeight: fontWeights.bold,
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    {t("notifications.title")}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: `${colors.primary}15`,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontWeight: fontWeights.bold,
                      fontSize: 12,
                      color: colors.primary,
                    }}
                  >
                    {NOMS_MOIS[moisActuel]} 2026
                  </Text>
                </View>
              </View>

              {/* Liste des échéances */}
              <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: 12 }}>
                {echeancesParJour.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: "center" }}>
                    <Ionicons name="checkmark-circle-outline" size={32} color={colors.disabled} />
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontWeight: fontWeights.regular,
                        fontSize: 14,
                        color: colors.textMuted,
                        marginTop: 8,
                      }}
                    >
                      {t("notifications.noUpcoming")}
                    </Text>
                  </View>
                ) : (
                  echeancesParJour.map(([jour, { echeances, joursRestants }]) => {
                    const isUrgent = joursRestants <= 2;
                    const isToday = joursRestants === 0;
                    return (
                      <View
                        key={jour}
                        style={{
                          backgroundColor: isToday
                            ? `${colors.danger}10`
                            : isUrgent
                              ? `${colors.warning}10`
                              : `${colors.primary}08`,
                          borderWidth: 1,
                          borderColor: isToday
                            ? `${colors.danger}30`
                            : isUrgent
                              ? `${colors.warning}30`
                              : `${colors.primary}15`,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        {/* En-tête jour */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View
                              style={{
                                width: 30,
                                height: 30,
                                backgroundColor: isToday
                                  ? colors.danger
                                  : isUrgent
                                    ? colors.warning
                                    : colors.primary,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: fonts.extraBold,
                                  fontWeight: fontWeights.extraBold,
                                  fontSize: 13,
                                  color: "#fff",
                                }}
                              >
                                {jour}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontFamily: fonts.semiBold,
                                fontWeight: fontWeights.semiBold,
                                fontSize: 13,
                                color: colors.text,
                              }}
                            >
                              {jour} {NOMS_MOIS[moisActuel]}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: isToday
                                ? `${colors.danger}20`
                                : isUrgent
                                  ? `${colors.warning}20`
                                  : `${colors.primary}15`,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: fonts.bold,
                                fontWeight: fontWeights.bold,
                                fontSize: 11,
                                color: isToday
                                  ? colors.danger
                                  : isUrgent
                                    ? colors.warning
                                    : colors.primary,
                              }}
                            >
                              {isToday
                                ? t("notifications.today")
                                : joursRestants === 1
                                  ? t("notifications.tomorrow")
                                  : t("notifications.inXDays", { jours: joursRestants })}
                            </Text>
                          </View>
                        </View>

                        {/* Liste des obligations du jour */}
                        {echeances.map((e, i) => (
                          <View
                            key={`${e.label}-${i}`}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              paddingVertical: 4,
                              paddingLeft: 4,
                            }}
                          >
                            <Ionicons
                              name={e.icon as keyof typeof Ionicons.glyphMap}
                              size={14}
                              color={e.recurrent ? colors.accent : colors.danger}
                            />
                            <Text
                              style={{
                                fontFamily: fonts.regular,
                                fontWeight: fontWeights.regular,
                                fontSize: 12,
                                color: colors.textSecondary,
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {e.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
