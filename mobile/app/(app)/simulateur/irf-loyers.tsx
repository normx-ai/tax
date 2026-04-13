import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerIRFLoyers, type TypeLocataire } from "@/lib/services/irf-loyers.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function IrfLoyersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loyersBruts, setLoyersBruts] = useState("");
  const [typeLocataire, setTypeLocataire] = useState<TypeLocataire>("personneMorale");

  const TYPES: { value: TypeLocataire; label: string }[] = [
    { value: "personneMorale", label: t("simulateur.irfLoyers.legalEntity") },
    { value: "personnePhysique", label: t("simulateur.irfLoyers.individual") },
  ];

  const result = useMemo(() => {
    const montant = parseFloat(loyersBruts.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerIRFLoyers({ loyersBrutsAnnuels: montant, typeLocataire });
  }, [loyersBruts, typeLocataire]);

  return (
    <SimulateurLayout
      title={t("simulateur.irfLoyers.title")}
      description={t("simulateur.irfLoyers.description")}
      legalRef={t("simulateur.irfLoyers.legalRef")}
      emptyMessage={t("simulateur.irfLoyers.enterRent")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur IRF Loyers",
        inputs: { "Loyers bruts annuels": loyersBruts, "Type de locataire": typeLocataire },
        results: [
          { label: "Calcul IRF", value: "", type: "header" },
          { label: "Loyers bruts annuels", value: formatNumber(result.loyersBrutsAnnuels) + "", type: "normal" },
          { label: "Loyers bruts mensuels", value: formatNumber(result.loyersBrutsMensuels) + "", type: "normal" },
          { label: "Taux applique", value: result.taux + "%", type: "normal" },
          { label: "Impot annuel", value: formatNumber(result.impotAnnuel) + "", type: "result" },
          { label: "Impot mensuel", value: formatNumber(result.impotMensuel) + "", type: "normal" },
          { label: "Net annuel", value: formatNumber(result.netAnnuel) + "", type: "total" },
          { label: "Net mensuel", value: formatNumber(result.netMensuel) + "", type: "normal" },
        ],
        reference: "Art. 116-E CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.irfLoyers.tenantType")}
          </Text>
          <OptionButtonGroup options={TYPES} selected={typeLocataire} onChange={setTypeLocataire} fontSize={12} />

          <NumberField label={t("simulateur.irfLoyers.annualRent")} value={loyersBruts} onChange={setLoyersBruts} />
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.irfLoyers.calcSection")} />
            <TableRow label={t("simulateur.irfLoyers.annualRent")} value={formatNumber(result.loyersBrutsAnnuels)} bold />
            <TableRow label={t("simulateur.irfLoyers.monthlyRent")} value={formatNumber(result.loyersBrutsMensuels)} bg={colors.background} />
            <TableRow label={t("simulateur.irfLoyers.rateApplied")} value={`${result.taux}%`} />

            <SimulateurSection label={t("simulateur.irfLoyers.taxSection")} />
            <ResultHighlight label={t("simulateur.irfLoyers.annualTax")} value={formatNumber(result.impotAnnuel)} variant="danger" />
            <TableRow label={t("simulateur.irfLoyers.monthlyTax")} value={formatNumber(result.impotMensuel)} />

            <SimulateurSection label={t("simulateur.irfLoyers.netSection")} />
            <ResultHighlight label={t("simulateur.irfLoyers.netAnnual")} value={formatNumber(result.netAnnuel)} variant="success" />
            <TableRow label={t("simulateur.irfLoyers.netMonthly")} value={formatNumber(result.netMensuel)} bg={colors.background} />

            <View style={[styles.deadlineBox, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.deadlineText, { color: colors.primary }]}>{t("simulateur.irfLoyers.deadline")}: {result.echeance}</Text>
            </View>
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
  deadlineBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
