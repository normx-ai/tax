import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

// Classés par ordre d'article CGI 2026
const SIMULATEURS: {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  { id: "solde", titleKey: "simulateur.solde.title", subtitleKey: "simulateur.solde.subtitle", icon: "cash-outline", route: "/(app)/simulateur/solde-liquidation" },
  { id: "is", titleKey: "simulateur.is.title", subtitleKey: "simulateur.is.subtitle", icon: "business-outline", route: "/(app)/simulateur/is" },
  { id: "rts", titleKey: "simulateur.rts.title", subtitleKey: "simulateur.rts.subtitle", icon: "cut-outline", route: "/(app)/simulateur/retenue-source" },
  { id: "isPara", titleKey: "simulateur.isPara.title", subtitleKey: "simulateur.isPara.subtitle", icon: "flame-outline", route: "/(app)/simulateur/is-parapetrolier" },
  { id: "iba", titleKey: "simulateur.iba.title", subtitleKey: "simulateur.iba.subtitle", icon: "briefcase-outline", route: "/(app)/simulateur/iba" },
  { id: "ircm", titleKey: "simulateur.ircm.title", subtitleKey: "simulateur.ircm.subtitle", icon: "trending-up-outline", route: "/(app)/simulateur/ircm" },
  { id: "irf", titleKey: "simulateur.irfLoyers.title", subtitleKey: "simulateur.irfLoyers.subtitle", icon: "home-outline", route: "/(app)/simulateur/irf-loyers" },
  { id: "taxeImmo", titleKey: "simulateur.taxeImmo.title", subtitleKey: "simulateur.taxeImmo.subtitle", icon: "business-outline", route: "/(app)/simulateur/taxe-immobiliere" },
  { id: "its", titleKey: "simulateur.its.title", subtitleKey: "simulateur.its.subtitle", icon: "people-outline", route: "/(app)/simulateur/its" },
  { id: "paie", titleKey: "simulateur.paie.title", subtitleKey: "simulateur.paie.subtitle", icon: "wallet-outline", route: "/(app)/simulateur/paie" },
  { id: "enreg", titleKey: "simulateur.enreg.title", subtitleKey: "simulateur.enreg.subtitle", icon: "document-text-outline", route: "/(app)/simulateur/enregistrement" },
  { id: "cession", titleKey: "simulateur.cessionParts.title", subtitleKey: "simulateur.cessionParts.subtitle", icon: "swap-horizontal-outline", route: "/(app)/simulateur/cession-parts" },
  { id: "foncier", titleKey: "simulateur.foncier.title", subtitleKey: "simulateur.foncier.subtitle", icon: "map-outline", route: "/(app)/simulateur/contribution-fonciere" },
  { id: "patente", titleKey: "simulateur.patente.title", subtitleKey: "simulateur.patente.subtitle", icon: "storefront-outline", route: "/(app)/simulateur/patente" },
  { id: "igf", titleKey: "simulateur.igf.title", subtitleKey: "simulateur.igf.subtitle", icon: "grid-outline", route: "/(app)/simulateur/igf" },
  { id: "tva", titleKey: "simulateur.tva.title", subtitleKey: "simulateur.tva.subtitle", icon: "receipt-outline", route: "/(app)/simulateur/tva" },
];

export default function MobileSimPicker() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 30 }}>
      <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.textSecondary, marginBottom: 16, paddingHorizontal: 4 }}>
        {t("simulateur.subtitle")}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {SIMULATEURS.map((sim) => (
          <TouchableOpacity
            key={sim.id}
            onPress={() => router.push(sim.route as Href)}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              width: "48.5%" as unknown as number,
              minWidth: 150,
              flexGrow: 1,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                backgroundColor: `${colors.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Ionicons name={sim.icon} size={20} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 16, color: colors.text, marginBottom: 3 }} numberOfLines={2}>
              {t(sim.titleKey)}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.textMuted, marginBottom: 10 }} numberOfLines={2}>
              {t(sim.subtitleKey)}
            </Text>
            <View
              style={{
                backgroundColor: `${colors.primary}15`,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 13, color: colors.primary }}>
                {t("simulateur.calculate")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
