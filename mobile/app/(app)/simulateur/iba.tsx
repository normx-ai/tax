import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerIBA } from "@/lib/services/iba.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function IbaScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Résultat comptable
  const [produitsExploitation, setProduitsExploitation] = useState("");
  const [produitsFinanciers, setProduitsFinanciers] = useState("");
  const [produitsHAO, setProduitsHAO] = useState("");
  const [chargesExploitation, setChargesExploitation] = useState("");
  const [chargesFinancieres, setChargesFinancieres] = useState("");
  const [chargesHAO, setChargesHAO] = useState("");

  // Résultat fiscal
  const [reintegrations, setReintegrations] = useState("");
  const [deductions, setDeductions] = useState("");
  const [ard, setArd] = useState("");
  const [reportDeficitaire, setReportDeficitaire] = useState("");

  // ASDI
  const [montantAchats, setMontantAchats] = useState("");

  // Acomptes versés
  const [acompte1, setAcompte1] = useState("");
  const [acompte2, setAcompte2] = useState("");
  const [acompte3, setAcompte3] = useState("");
  const [acompte4, setAcompte4] = useState("");

  const parse = (v: string) => parseFloat(v.replace(/\s/g, "")) || 0;

  const result = useMemo(() => {
    const pe = parse(produitsExploitation);
    if (pe <= 0) return null;
    return calculerIBA({
      produitsExploitation: pe,
      produitsFinanciers: parse(produitsFinanciers),
      produitsHAO: parse(produitsHAO),
      chargesExploitation: parse(chargesExploitation),
      chargesFinancieres: parse(chargesFinancieres),
      chargesHAO: parse(chargesHAO),
      reintegrations: parse(reintegrations),
      deductions: parse(deductions),
      ard: parse(ard),
      reportDeficitaire: parse(reportDeficitaire),
      montantAchatsImportations: parse(montantAchats),
      acompte1: parse(acompte1),
      acompte2: parse(acompte2),
      acompte3: parse(acompte3),
      acompte4: parse(acompte4),
    });
  }, [produitsExploitation, produitsFinanciers, produitsHAO, chargesExploitation, chargesFinancieres, chargesHAO, reintegrations, deductions, ard, reportDeficitaire, montantAchats, acompte1, acompte2, acompte3, acompte4]);

  return (
    <SimulateurLayout
      title={t("simulateur.iba.title")}
      description={t("simulateur.iba.description")}
      legalRef={t("simulateur.iba.legalRef")}
      emptyMessage={t("simulateur.iba.enterTurnover")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur IBA",
        inputs: { "Produits exploitation": produitsExploitation, "Produits financiers": produitsFinanciers, "Produits HAO": produitsHAO, "Charges exploitation": chargesExploitation, "Charges financieres": chargesFinancieres, "Charges HAO": chargesHAO, "Reintegrations": reintegrations, "Deductions": deductions, "ARD": ard, "Report deficitaire": reportDeficitaire, "Achats/importations": montantAchats },
        results: [
          { label: "Resultat comptable", value: "", type: "header" },
          { label: "Total produits", value: formatNumber(result.totalProduits) + "", type: "normal" },
          { label: "Total charges", value: "- " + formatNumber(result.totalCharges) + "", type: "normal" },
          { label: "Resultat comptable", value: formatNumber(result.resultatComptable) + "", type: "result" },
          { label: "Resultat fiscal", value: "", type: "header" },
          { label: "Resultat fiscal", value: formatNumber(result.resultatFiscal) + "", type: "result" },
          { label: "IBA calcule", value: "", type: "header" },
          { label: "IBA brut", value: formatNumber(result.ibaBrut) + "", type: "normal" },
          { label: "Taux IBA", value: result.tauxIBA + "%", type: "normal" },
          { label: "IBA retenu", value: formatNumber(result.ibaRetenu) + "", type: "result" },
          { label: "IBA net", value: formatNumber(result.ibaNet) + "", type: "result" },
          { label: "Total acomptes", value: formatNumber(result.totalAcomptes) + "", type: "normal" },
          { label: "Solde", value: formatNumber(result.solde) + "", type: "total" },
          { label: "Benefice net", value: formatNumber(result.beneficeNet) + "", type: "total" },
        ],
        reference: "Art. 131-A CGI 2026",
      } : undefined}
      inputSection={
        <>
          {/* Résultat comptable */}
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("simulateur.iba.rcSection")}
          </Text>
          <NumberField label={t("simulateur.iba.produitsExploitation")} value={produitsExploitation} onChange={setProduitsExploitation} />
          <NumberField label={t("simulateur.iba.produitsFinanciers")} value={produitsFinanciers} onChange={setProduitsFinanciers} />
          <NumberField label={t("simulateur.iba.produitsHAO")} value={produitsHAO} onChange={setProduitsHAO} />
          <NumberField label={t("simulateur.iba.chargesExploitation")} value={chargesExploitation} onChange={setChargesExploitation} />
          <NumberField label={t("simulateur.iba.chargesFinancieres")} value={chargesFinancieres} onChange={setChargesFinancieres} />
          <NumberField label={t("simulateur.iba.chargesHAO")} value={chargesHAO} onChange={setChargesHAO} />

          {/* Résultat fiscal */}
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("simulateur.iba.rfSection")}
          </Text>
          <NumberField label={t("simulateur.iba.reintegrations")} value={reintegrations} onChange={setReintegrations} />
          <NumberField label={t("simulateur.iba.deductionsFiscales")} value={deductions} onChange={setDeductions} />
          <NumberField label={t("simulateur.iba.ard")} value={ard} onChange={setArd} />
          <NumberField label={t("simulateur.iba.reportDeficitaire")} value={reportDeficitaire} onChange={setReportDeficitaire} />

          {/* ASDI */}
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("simulateur.iba.asdiSection")}
          </Text>
          <NumberField label={t("simulateur.iba.achatsImportations")} value={montantAchats} onChange={setMontantAchats} />

          {/* Acomptes versés */}
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("simulateur.iba.instalmentsPaid")}
          </Text>
          <NumberField label={t("simulateur.iba.q1")} value={acompte1} onChange={setAcompte1} />
          <NumberField label={t("simulateur.iba.q2")} value={acompte2} onChange={setAcompte2} />
          <NumberField label={t("simulateur.iba.q3")} value={acompte3} onChange={setAcompte3} />
          <NumberField label={t("simulateur.iba.q4")} value={acompte4} onChange={setAcompte4} />
        </>
      }
      resultSection={
        result ? (
          <View>
            {/* Résultat comptable */}
            <SimulateurSection label={t("simulateur.iba.rcSection")} />
            <TableRow label={t("simulateur.iba.totalProduits")} value={formatNumber(result.totalProduits)} bold />
            <TableRow label={t("simulateur.iba.totalCharges")} value={`- ${formatNumber(result.totalCharges)}`} bg={colors.background} color={colors.danger} />
            <ResultHighlight label={t("simulateur.iba.rc")} value={formatNumber(result.resultatComptable)} variant="primary" />

            {/* Résultat fiscal */}
            <SimulateurSection label={t("simulateur.iba.rfSection")} />
            <TableRow label={t("simulateur.iba.rc")} value={formatNumber(result.resultatComptable)} />
            {result.reintegrations > 0 && (
              <TableRow label={t("simulateur.iba.reintegrations")} value={`+ ${formatNumber(result.reintegrations)}`} bg={colors.background} color={colors.success} />
            )}
            {result.deductions > 0 && (
              <TableRow label={t("simulateur.iba.deductionsFiscales")} value={`- ${formatNumber(result.deductions)}`} bg={colors.background} color={colors.danger} />
            )}
            {result.ard > 0 && (
              <TableRow label={t("simulateur.iba.ard")} value={`- ${formatNumber(result.ard)}`} bg={colors.background} color={colors.danger} />
            )}
            {result.reportDeficitaire > 0 && (
              <TableRow label={t("simulateur.iba.reportDeficitaire")} value={`- ${formatNumber(result.reportDeficitaire)}`} bg={colors.background} color={colors.danger} />
            )}
            <ResultHighlight label={t("simulateur.iba.rf")} value={formatNumber(result.resultatFiscal)} variant="primary" />

            {/* IBA calculé */}
            <SimulateurSection label={t("simulateur.iba.ibaCalculatedSection")} />
            <TableRow label={t("simulateur.iba.ibaBrutLabel")} value={formatNumber(result.ibaBrut)} />
            <TableRow label={t("simulateur.iba.rateApplied")} value={`${result.tauxIBA}%`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.iba.ibaRetenu")} value={formatNumber(result.ibaRetenu)} variant="primary" />

            {/* ASDI */}
            {result.asdi > 0 && (
              <>
                <SimulateurSection label={t("simulateur.iba.asdiSection")} />
                <TableRow label={t("simulateur.iba.asdiLabel")} value={`- ${formatNumber(result.asdi)}`} color={colors.danger} />
                <TableRow label={t("simulateur.iba.asdiDetail")} value={`${result.tauxASDI}% × ${formatNumber(result.montantAchatsImportations)}`} bg={colors.background} />
              </>
            )}

            {/* IBA net */}
            <SimulateurSection label={t("simulateur.iba.taxSection")} />
            <ResultHighlight label={t("simulateur.iba.taxDue")} value={formatNumber(result.ibaNet)} variant="danger" />

            {/* Acomptes versés */}
            <SimulateurSection label={t("simulateur.iba.instalmentsPaidTitle")} />
            {result.detailAcomptes.map((a) => (
              <TableRow key={a.label} label={a.label} value={a.montant > 0 ? formatNumber(a.montant) : "\u2014"} />
            ))}
            <ResultHighlight label={t("simulateur.iba.totalInstalments")} value={formatNumber(result.totalAcomptes)} variant="primary" />

            {/* Solde */}
            <SimulateurSection label={t("simulateur.iba.settlementBalance")} />
            <TableRow label={t("simulateur.iba.ibaMinusInstalments")} value={`${formatNumber(result.ibaNet)} - ${formatNumber(result.totalAcomptes)}`} bg={colors.background} />

            {result.creditImpot ? (
              <ResultHighlight label={t("simulateur.iba.taxCredit")} value={formatNumber(Math.abs(result.solde))} variant="success" note={t("simulateur.iba.taxCreditNote")} />
            ) : (
              <ResultHighlight label={t("simulateur.iba.balanceToPay")} value={formatNumber(result.solde)} variant="danger" note={t("simulateur.iba.balanceNote")} />
            )}

            <ResultHighlight label={t("simulateur.iba.netProfit")} value={formatNumber(result.beneficeNet)} variant="success" />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
  },
});
