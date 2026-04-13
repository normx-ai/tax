import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerRetenueSource, type TypeRetenue } from "@/lib/services/retenue-source.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function RetenueSourceScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [montantHT, setMontantHT] = useState("");
  const [typeRetenue, setTypeRetenue] = useState<TypeRetenue>("non_resident");

  const TYPES: { value: TypeRetenue; label: string }[] = [
    { value: "non_resident", label: t("simulateur.rts.nonResident") },
    { value: "non_soumis_is", label: t("simulateur.rts.nonSoumisIS") },
    { value: "tresor_public", label: t("simulateur.rts.tresorPublic") },
  ];

  const result = useMemo(() => {
    const montant = parseFloat(montantHT.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerRetenueSource({ montantHT: montant, typeRetenue });
  }, [montantHT, typeRetenue]);

  return (
    <SimulateurLayout
      title={t("simulateur.rts.title")}
      description={t("simulateur.rts.description")}
      legalRef={t("simulateur.rts.legalRef")}
      emptyMessage={t("simulateur.rts.enterAmount")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Retenue a la source",
        inputs: { "Montant HT": montantHT, "Type de retenue": typeRetenue },
        results: [
          { label: "Calcul retenue", value: "", type: "header" },
          { label: "Montant HT", value: formatNumber(result.montantHT) + "", type: "normal" },
          { label: "Taux applique", value: result.taux + "%", type: "normal" },
          { label: "Article", value: result.articleRef, type: "normal" },
          { label: "Montant retenue", value: formatNumber(result.montantRetenue) + "", type: "result" },
          { label: "Montant net", value: formatNumber(result.montantNet) + "", type: "total" },
        ],
        reference: result.articleRef,
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.rts.typeLabel")}
          </Text>
          <OptionButtonGroup options={TYPES} selected={typeRetenue} onChange={setTypeRetenue} />

          <NumberField label={t("simulateur.rts.amountHT")} value={montantHT} onChange={setMontantHT} />
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.rts.calcSection")} />
            <TableRow label={t("simulateur.rts.amountHT")} value={formatNumber(result.montantHT)} bold />
            <TableRow label={t("simulateur.rts.rateApplied")} value={`${result.taux}%`} bg={colors.background} />
            <TableRow label={t("simulateur.rts.articleLabel")} value={result.articleRef} bg={colors.background} />
            <ResultHighlight label={t("simulateur.rts.withholdingAmount")} value={formatNumber(result.montantRetenue)} variant="danger" />
            <ResultHighlight label={t("simulateur.rts.netAmount")} value={formatNumber(result.montantNet)} variant="success" />
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
});
