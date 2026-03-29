import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { useAuthStore } from "@/lib/store/auth";
import { useToast } from "@/components/ui/ToastProvider";
import MobileSimPicker from "@/components/mobile/MobileSimPicker";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const BASIC_SIMULATORS = ["its", "tva", "is", "paie", "patente"];

export default function SimulateurHub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const plan = (user as { plan?: string })?.plan || "FREE";
  const isStarter = plan === "STARTER";

  // Sur mobile : affichage en liste avec design proposé
  if (isMobile) {
    return <MobileSimPicker />;
  }

  // Classés par ordre d'article CGI 2026
  const simulateurs = [
    {
      id: "solde-liquidation",
      title: t("simulateur.hubSoldeIs"),
      subtitle: t("simulateur.solde.subtitle"),
      description: t("simulateur.solde.legalRef"),
      icon: "cash-outline" as const,
      route: "/(app)/simulateur/solde-liquidation",
    },
    {
      id: "is",
      title: t("simulateur.hubMinIs"),
      subtitle: t("simulateur.is.subtitle"),
      description: t("simulateur.is.legalRef"),
      icon: "business-outline" as const,
      route: "/(app)/simulateur/is",
    },
    {
      id: "retenue-source",
      title: t("simulateur.hubRetenueSource"),
      subtitle: t("simulateur.rts.subtitle"),
      description: t("simulateur.rts.legalRef"),
      icon: "cut-outline" as const,
      route: "/(app)/simulateur/retenue-source",
    },
    {
      id: "is-parapetrolier",
      title: t("simulateur.hubISPara"),
      subtitle: t("simulateur.isPara.subtitle"),
      description: t("simulateur.isPara.legalRef"),
      icon: "flame-outline" as const,
      route: "/(app)/simulateur/is-parapetrolier",
    },
    {
      id: "iba",
      title: t("simulateur.hubIba"),
      subtitle: t("simulateur.iba.subtitle"),
      description: t("simulateur.iba.legalRef"),
      icon: "briefcase-outline" as const,
      route: "/(app)/simulateur/iba",
    },
    {
      id: "ircm",
      title: t("simulateur.hubIrcm"),
      subtitle: t("simulateur.ircm.subtitle"),
      description: t("simulateur.ircm.legalRef"),
      icon: "trending-up-outline" as const,
      route: "/(app)/simulateur/ircm",
    },
    {
      id: "irf-loyers",
      title: t("simulateur.hubIrfLoyers"),
      subtitle: t("simulateur.irfLoyers.subtitle"),
      description: t("simulateur.irfLoyers.legalRef"),
      icon: "home-outline" as const,
      route: "/(app)/simulateur/irf-loyers",
    },
    {
      id: "taxe-immobiliere",
      title: t("simulateur.hubTaxeImmo"),
      subtitle: t("simulateur.taxeImmo.subtitle"),
      description: t("simulateur.taxeImmo.legalRef"),
      icon: "business-outline" as const,
      route: "/(app)/simulateur/taxe-immobiliere",
    },
    {
      id: "its",
      title: t("simulateur.hubIts"),
      subtitle: t("simulateur.its.subtitle"),
      description: t("simulateur.its.legalRef"),
      icon: "people-outline" as const,
      route: "/(app)/simulateur/its",
    },
    {
      id: "paie",
      title: t("simulateur.hubPaie"),
      subtitle: t("simulateur.paie.subtitle"),
      description: t("simulateur.paie.legalRef"),
      icon: "wallet-outline" as const,
      route: "/(app)/simulateur/paie",
    },
    {
      id: "enregistrement",
      title: t("simulateur.hubEnregistrement"),
      subtitle: t("simulateur.enreg.subtitle"),
      description: t("simulateur.enreg.legalRef"),
      icon: "document-text-outline" as const,
      route: "/(app)/simulateur/enregistrement",
    },
    {
      id: "cession-parts",
      title: t("simulateur.hubCessionParts"),
      subtitle: t("simulateur.cessionParts.subtitle"),
      description: t("simulateur.cessionParts.legalRef"),
      icon: "swap-horizontal-outline" as const,
      route: "/(app)/simulateur/cession-parts",
    },
    {
      id: "contribution-fonciere",
      title: t("simulateur.hubFoncier"),
      subtitle: t("simulateur.foncier.subtitle"),
      description: t("simulateur.foncier.legalRef"),
      icon: "map-outline" as const,
      route: "/(app)/simulateur/contribution-fonciere",
    },
    {
      id: "patente",
      title: t("simulateur.hubPatente"),
      subtitle: t("simulateur.patente.subtitle"),
      description: t("simulateur.patente.legalRef"),
      icon: "storefront-outline" as const,
      route: "/(app)/simulateur/patente",
    },
    {
      id: "igf",
      title: t("simulateur.hubIgf"),
      subtitle: t("simulateur.igf.subtitle"),
      description: t("simulateur.igf.legalRef"),
      icon: "grid-outline" as const,
      route: "/(app)/simulateur/igf",
    },
    {
      id: "tva",
      title: t("simulateur.hubTva"),
      subtitle: t("simulateur.tva.subtitle"),
      description: t("simulateur.tva.legalRef"),
      icon: "receipt-outline" as const,
      route: "/(app)/simulateur/tva",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Cards en grille */}
        <View style={styles.grid}>
          {simulateurs.map((sim) => {
            const locked = isStarter && !BASIC_SIMULATORS.includes(sim.id);
            return (
            <TouchableOpacity
              key={sim.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: locked ? 0.5 : 1 }]}
              onPress={() => {
                if (locked) {
                  toast(t("simulateur.upgradeRequired"), "error");
                  return;
                }
                router.push(sim.route as Href);
              }}
            >
              <View
                style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}
              >
                <Ionicons name={sim.icon} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{sim.title}</Text>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>CGI 2026</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.text }]}>{sim.subtitle}</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{sim.description}</Text>
              {locked && (
                <View style={{ position: "absolute", top: 10, right: 10 }}>
                  <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
            );
          })}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "31.5%",
    borderWidth: 1,
    padding: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "400",
    marginBottom: 2,
  },
  badge: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
  },
});
