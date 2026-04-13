import { useState, useMemo } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { calculerIsParapetrolier, type IsParapetrolierInput } from "@/lib/services/is-parapetrolier.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function IsParapetrolierScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [chiffreAffairesHT, setChiffreAffairesHT] = useState("");
  const [montantMobDemob, setMontantMobDemob] = useState("");
  const [montantRemboursements, setMontantRemboursements] = useState("");
  const [isZoneAngola, setIsZoneAngola] = useState(false);

  const result = useMemo(() => {
    const input: IsParapetrolierInput = {
      chiffreAffairesHT: parseFloat(chiffreAffairesHT.replace(/\s/g, "")) || 0,
      montantMobDemob: parseFloat(montantMobDemob.replace(/\s/g, "")) || 0,
      montantRemboursements: parseFloat(montantRemboursements.replace(/\s/g, "")) || 0,
      isZoneAngola,
    };
    if (input.chiffreAffairesHT === 0) return null;
    return calculerIsParapetrolier(input);
  }, [chiffreAffairesHT, montantMobDemob, montantRemboursements, isZoneAngola]);

  return (
    <SimulateurLayout
      title={t("simulateur.isPara.title")}
      description={t("simulateur.isPara.description")}
      legalRef={t("simulateur.isPara.legalRef")}
      emptyMessage={t("simulateur.isPara.enterCA")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur IS Parapetrolier",
        inputs: { "CA HT": chiffreAffairesHT, "Mob/Demob": montantMobDemob, "Remboursements": montantRemboursements, "Zone Angola": isZoneAngola ? "Oui" : "Non" },
        results: [
          { label: "Base de calcul", value: "", type: "header" },
          { label: "CA HT brut", value: formatNumber(result.caHTBrut) + "", type: "normal" },
          { label: "Exclusions", value: "- " + formatNumber(result.exclusions) + "", type: "normal" },
          { label: "CA HT net", value: formatNumber(result.caHTNet) + "", type: "normal" },
          { label: "Base forfaitaire", value: formatNumber(result.baseForfaitaire) + "", type: "normal" },
          { label: "IS forfaitaire", value: "", type: "header" },
          { label: "Taux IS", value: result.tauxIS + "%", type: "normal" },
          { label: "IS forfaitaire", value: formatNumber(result.isForfaitaire) + "", type: "result" },
          { label: "IRCM forfaitaire", value: "", type: "header" },
          { label: "Taux IRCM", value: result.tauxIRCM + "%", type: "normal" },
          { label: "IRCM forfaitaire", value: formatNumber(result.ircmForfaitaire) + "", type: "result" },
          { label: "Total IS + IRCM", value: formatNumber(result.totalISPlusIRCM) + "", type: "total" },
          { label: "Taux effectif/CA", value: result.tauxEffectifCA + "%", type: "normal" },
          { label: "Mensualite totale", value: formatNumber(result.mensualiteTotal) + "", type: "total" },
        ],
        reference: "Art. 131-D CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.isPara.revenueSection")}
          </Text>
          <NumberField label={t("simulateur.isPara.caHT")} value={chiffreAffairesHT} onChange={setChiffreAffairesHT} />
          <NumberField label={t("simulateur.isPara.mobDemob")} value={montantMobDemob} onChange={setMontantMobDemob} />
          <NumberField label={t("simulateur.isPara.remboursements")} value={montantRemboursements} onChange={setMontantRemboursements} />

          <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
            <View style={styles.switchTextWrap}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t("simulateur.isPara.zoneAngola")}</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>{t("simulateur.isPara.zoneAngolaDesc")}</Text>
            </View>
            <Switch value={isZoneAngola} onValueChange={setIsZoneAngola} trackColor={{ false: colors.disabled, true: `${colors.primary}80` }} thumbColor={isZoneAngola ? colors.primary : colors.textMuted} />
          </View>
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.isPara.baseSection")} />
            <TableRow label={t("simulateur.isPara.caHTBrut")} value={formatNumber(result.caHTBrut)} />
            <TableRow label={t("simulateur.isPara.exclusionsLabel")} value={`- ${formatNumber(result.exclusions)}`} bg={colors.background} />
            <TableRow label={t("simulateur.isPara.caHTNet")} value={formatNumber(result.caHTNet)} bold />
            <TableRow label={t("simulateur.isPara.baseForfaitaire")} value={formatNumber(result.baseForfaitaire)} bg={colors.background} />

            <SimulateurSection label={t("simulateur.isPara.isSection")} />
            <TableRow label={t("simulateur.isPara.baseForfaitaireLabel")} value={formatNumber(result.baseForfaitaire)} />
            <TableRow label={t("simulateur.isPara.tauxIS")} value={`${result.tauxIS}%`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.isPara.isForfaitaire")} value={formatNumber(result.isForfaitaire)} variant="primary" />

            <SimulateurSection label={t("simulateur.isPara.ircmSection")} />
            <TableRow label={t("simulateur.isPara.distribReputee")} value={formatNumber(result.distributionReputee)} />
            <TableRow label={t("simulateur.isPara.tauxIRCM")} value={`${result.tauxIRCM}%`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.isPara.ircmForfaitaire")} value={formatNumber(result.ircmForfaitaire)} variant="primary" />

            <SimulateurSection label={t("simulateur.isPara.totalSection")} />
            <TableRow label={t("simulateur.isPara.isLabel")} value={formatNumber(result.isForfaitaire)} />
            <TableRow label={t("simulateur.isPara.ircmLabel")} value={formatNumber(result.ircmForfaitaire)} bg={colors.background} />
            <ResultHighlight label={t("simulateur.isPara.totalISIRCM")} value={formatNumber(result.totalISPlusIRCM)} variant="danger" />
            <TableRow label={t("simulateur.isPara.tauxEffectif")} value={`${result.tauxEffectifCA}%`} />

            <SimulateurSection label={t("simulateur.isPara.mensualitesSection")} />
            <TableRow label={t("simulateur.isPara.mensIS")} value={formatNumber(result.mensualiteIS)} />
            <TableRow label={t("simulateur.isPara.mensIRCM")} value={formatNumber(result.mensualiteIRCM)} bg={colors.background} />
            <ResultHighlight label={t("simulateur.isPara.mensTotal")} value={formatNumber(result.mensualiteTotal)} variant="success" note={t("simulateur.isPara.mensNote")} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  switchTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
