import { useState, useMemo } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { calculerCessionParts, type TypeCession } from "@/lib/services/cession-parts.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function CessionPartsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [prixCession, setPrixCession] = useState("");
  const [typeCession, setTypeCession] = useState<TypeCession>("actionsStandard");
  const [contratPetrolier, setContratPetrolier] = useState(false);

  const TYPES: { value: TypeCession; label: string }[] = [
    { value: "actionsStandard", label: t("simulateur.cessionParts.standard") },
    { value: "participations", label: t("simulateur.cessionParts.participations") },
    { value: "changementControle", label: t("simulateur.cessionParts.controlChange") },
  ];

  const result = useMemo(() => {
    const montant = parseFloat(prixCession.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerCessionParts({ prixCession: montant, typeCession, contratPetrolier });
  }, [prixCession, typeCession, contratPetrolier]);

  return (
    <SimulateurLayout
      title={t("simulateur.cessionParts.title")}
      description={t("simulateur.cessionParts.description")}
      legalRef={t("simulateur.cessionParts.legalRef")}
      emptyMessage={t("simulateur.cessionParts.enterAmount")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Cession de parts",
        inputs: { "Prix de cession": prixCession, "Type de cession": typeCession, "Contrat petrolier": contratPetrolier ? "Oui" : "Non" },
        results: [
          { label: "Calcul", value: "", type: "header" },
          { label: "Prix de cession", value: formatNumber(result.prixCession) + " FCFA", type: "normal" },
          { label: "Taux (" + result.articleRef + ")", value: result.taux + "%", type: "normal" },
          { label: "Detail", value: "", type: "header" },
          { label: "Droits", value: formatNumber(result.droits) + " FCFA", type: "normal" },
          ...(result.minimumApplique ? [{ label: "Minimum applique", value: "1 000 000 FCFA", type: "normal" as const }] : []),
          { label: "Centimes additionnels", value: "+ " + formatNumber(result.centimesAdditionnels) + " FCFA", type: "normal" },
          { label: "Total du", value: formatNumber(result.total) + " FCFA", type: "total" },
        ],
        reference: result.articleRef,
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.cessionParts.typeLabel")}
          </Text>
          <OptionButtonGroup options={TYPES} selected={typeCession} onChange={setTypeCession} direction="column" fontSize={12} />

          <NumberField label={t("simulateur.cessionParts.amount")} value={prixCession} onChange={setPrixCession} />

          {typeCession === "participations" && (
            <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
              <View style={styles.flex1}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>{t("simulateur.cessionParts.petroleum")}</Text>
                <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>{t("simulateur.cessionParts.petroleumDesc")}</Text>
              </View>
              <Switch
                value={contratPetrolier}
                onValueChange={setContratPetrolier}
                trackColor={{ false: colors.disabled, true: `${colors.primary}80` }}
                thumbColor={contratPetrolier ? colors.primary : colors.textMuted}
              />
            </View>
          )}
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.cessionParts.calcSection")} />
            <TableRow label={t("simulateur.cessionParts.amount")} value={formatNumber(result.prixCession)} bold />
            <TableRow label={`${t("simulateur.cessionParts.rate")} (${result.articleRef})`} value={`${result.taux}%`} bg={colors.background} />

            <SimulateurSection label={t("simulateur.cessionParts.detailSection")} />
            <TableRow label={t("simulateur.cessionParts.duties")} value={formatNumber(result.droits)} bold />
            {result.minimumApplique && (
              <TableRow label={t("simulateur.cessionParts.minimumApplied")} value="1 000 000 FCFA" bg={colors.background} color={colors.primary} />
            )}
            <TableRow label={t("simulateur.cessionParts.additionalCents")} value={`+ ${formatNumber(result.centimesAdditionnels)}`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.cessionParts.totalDue")} value={formatNumber(result.total)} variant="danger" />
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
    padding: 12,
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchDesc: {
    fontSize: 12,
  },
});
