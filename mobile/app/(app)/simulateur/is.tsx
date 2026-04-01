import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerMinPerception, type TypeImpot } from "@/lib/services/is.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function IsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [typeImpot, setTypeImpot] = useState<TypeImpot>("is");
  const [produitsExploitation, setProduitsExploitation] = useState("");
  const [produitsFinanciers, setProduitsFinanciers] = useState("");
  const [produitsHAO, setProduitsHAO] = useState("");
  const [retenuesLiberatoires, setRetenuesLiberatoires] = useState("");

  const TYPES: { value: TypeImpot; label: string }[] = [
    { value: "is", label: t("simulateur.is.tabIS") },
    { value: "iba", label: t("simulateur.is.tabIBA") },
  ];

  const result = useMemo(() => {
    const pe = parseFloat(produitsExploitation.replace(/\s/g, "")) || 0;
    if (pe === 0) return null;
    return calculerMinPerception({
      typeImpot,
      produitsExploitation: pe,
      produitsFinanciers: parseFloat(produitsFinanciers.replace(/\s/g, "")) || 0,
      produitsHAO: parseFloat(produitsHAO.replace(/\s/g, "")) || 0,
      retenuesLiberatoires: parseFloat(retenuesLiberatoires.replace(/\s/g, "")) || 0,
    });
  }, [typeImpot, produitsExploitation, produitsFinanciers, produitsHAO, retenuesLiberatoires]);

  return (
    <SimulateurLayout
      title={t("simulateur.is.title")}
      description={typeImpot === "is" ? t("simulateur.is.descriptionIS") : t("simulateur.is.descriptionIBA")}
      legalRef={typeImpot === "is" ? t("simulateur.is.legalRefIS") : t("simulateur.is.legalRefIBA")}
      emptyMessage={t("simulateur.is.enterProducts")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Minimum de perception (IS/IBA)",
        inputs: { "Type": typeImpot === "is" ? "IS" : "IBA", "Produits exploitation": produitsExploitation, "Produits financiers": produitsFinanciers, "Produits HAO": produitsHAO, "Retenues liberatoires": retenuesLiberatoires },
        results: [
          { label: "Minimum de perception", value: "", type: "header" },
          { label: "Base", value: formatNumber(result.baseMinimumPerception) + " FCFA", type: "normal" },
          { label: "Taux applique", value: result.tauxMinimum + "%", type: "normal" },
          { label: "Minimum annuel", value: formatNumber(result.minimumPerceptionAnnuel) + " FCFA", type: "result" },
          { label: "Acomptes trimestriels", value: "", type: "header" },
          ...result.acomptes.map((a) => ({ label: a.label, value: formatNumber(a.montant) + " FCFA", type: "normal" as const })),
          { label: "Total a payer", value: formatNumber(result.minimumPerceptionAnnuel) + " FCFA", type: "total" },
        ],
        reference: typeImpot === "is" ? "Art. 131-A CGI 2026" : "Art. 131-A CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.is.typeLabel")}
          </Text>
          <OptionButtonGroup options={TYPES} selected={typeImpot} onChange={setTypeImpot} fontSize={13} />

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>
            {t("simulateur.is.baseCalc")}
          </Text>
          <NumberField label={t("simulateur.is.exploitation")} value={produitsExploitation} onChange={setProduitsExploitation} />
          <NumberField label={t("simulateur.is.financial")} value={produitsFinanciers} onChange={setProduitsFinanciers} />
          <NumberField label={t("simulateur.is.hao")} value={produitsHAO} onChange={setProduitsHAO} />
          {typeImpot === "is" && (
            <NumberField label={t("simulateur.is.withholdings")} value={retenuesLiberatoires} onChange={setRetenuesLiberatoires} />
          )}
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={typeImpot === "is" ? t("simulateur.is.minPerceptionIS") : t("simulateur.is.minPerceptionIBA")} />
            <TableRow label={t("simulateur.is.base")} value={formatNumber(result.baseMinimumPerception)} />
            <TableRow label={t("simulateur.is.rateApplied")} value={`${result.tauxMinimum}%`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.is.annualMin")} value={formatNumber(result.minimumPerceptionAnnuel)} variant="primary" />

            <SimulateurSection label={t("simulateur.is.quarterlyInstalments")} />
            {result.acomptes.map((a) => (
              <TableRow key={a.label} label={a.label} value={formatNumber(a.montant)} />
            ))}

            <ResultHighlight
              label={t("simulateur.is.totalToPay")}
              value={formatNumber(result.minimumPerceptionAnnuel)}
              variant="primary"
              note={typeImpot === "is" ? t("simulateur.is.imputNoteIS") : t("simulateur.is.imputNoteIBA")}
            />
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
