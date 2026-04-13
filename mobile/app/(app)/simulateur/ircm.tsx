import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerIRCM, type TypeRevenuIRCM } from "@/lib/services/ircm.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function IrcmScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [montantBrut, setMontantBrut] = useState("");
  const [typeRevenu, setTypeRevenu] = useState<TypeRevenuIRCM>("dividendes");

  const TYPES: { value: TypeRevenuIRCM; label: string }[] = [
    { value: "dividendes", label: t("simulateur.ircm.dividends") },
    { value: "interets", label: t("simulateur.ircm.interests") },
    { value: "plusValues", label: t("simulateur.ircm.capitalGains") },
  ];

  const result = useMemo(() => {
    const montant = parseFloat(montantBrut.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerIRCM({ montantBrut: montant, typeRevenu });
  }, [montantBrut, typeRevenu]);

  return (
    <SimulateurLayout
      title={t("simulateur.ircm.title")}
      description={t("simulateur.ircm.description")}
      legalRef={t("simulateur.ircm.legalRef")}
      emptyMessage={t("simulateur.ircm.enterAmount")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur IRCM",
        inputs: { "Montant brut": montantBrut, "Type de revenu": typeRevenu },
        results: [
          { label: "Calcul IRCM", value: "", type: "header" },
          { label: "Montant brut", value: formatNumber(result.montantBrut) + "", type: "normal" },
          { label: "Taux applique", value: result.taux + "%", type: "normal" },
          { label: "Impot du (IRCM)", value: formatNumber(result.impot) + "", type: "result" },
          { label: "Montant net", value: formatNumber(result.montantNet) + "", type: "total" },
        ],
        reference: "Art. 116-D CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.ircm.revenueType")}
          </Text>
          <OptionButtonGroup options={TYPES} selected={typeRevenu} onChange={setTypeRevenu} />

          <NumberField label={t("simulateur.ircm.grossAmount")} value={montantBrut} onChange={setMontantBrut} />
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.ircm.calcSection")} />
            <TableRow label={t("simulateur.ircm.grossAmount")} value={formatNumber(result.montantBrut)} bold />
            <TableRow label={t("simulateur.ircm.rateApplied")} value={`${result.taux}%`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.ircm.taxDue")} value={formatNumber(result.impot)} variant="danger" />
            <ResultHighlight label={t("simulateur.ircm.netAmount")} value={formatNumber(result.montantNet)} variant="success" />
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
