import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerTaxeImmobiliere, type TypeDebiteur } from "@/lib/services/taxe-immobiliere.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function TaxeImmobiliereScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loyerAnnuel, setLoyerAnnuel] = useState("");
  const [typeDebiteur, setTypeDebiteur] = useState<TypeDebiteur>("proprietaire");
  const [estNouveau, setEstNouveau] = useState<"oui" | "non">("non");

  const TYPES_DEBITEUR: { value: TypeDebiteur; label: string }[] = [
    { value: "proprietaire", label: t("simulateur.taxeImmo.proprietaire") },
    { value: "locataireSousLocation", label: t("simulateur.taxeImmo.sousLocation") },
  ];

  const NOUVEAU_OPTIONS: { value: "oui" | "non"; label: string }[] = [
    { value: "non", label: t("simulateur.taxeImmo.ancienContribuable") },
    { value: "oui", label: t("simulateur.taxeImmo.nouveauContribuable") },
  ];

  const result = useMemo(() => {
    const montant = parseFloat(loyerAnnuel.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerTaxeImmobiliere({
      loyerAnnuel: montant,
      typeDebiteur,
      estNouveauContribuable: estNouveau === "oui",
    });
  }, [loyerAnnuel, typeDebiteur, estNouveau]);

  return (
    <SimulateurLayout
      title={t("simulateur.taxeImmo.title")}
      description={t("simulateur.taxeImmo.description")}
      legalRef={t("simulateur.taxeImmo.legalRef")}
      emptyMessage={t("simulateur.taxeImmo.enterRent")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Taxe immobiliere",
        inputs: { "Loyer annuel": loyerAnnuel, "Type debiteur": typeDebiteur, "Nouveau contribuable": estNouveau },
        results: [
          { label: "Base de calcul", value: "", type: "header" },
          { label: "Loyer annuel", value: formatNumber(result.loyerAnnuel) + " FCFA", type: "normal" },
          { label: "Loyer mensuel", value: formatNumber(result.loyerMensuel) + " FCFA", type: "normal" },
          { label: "Taux", value: result.taux + "%", type: "normal" },
          { label: "Taxe", value: "", type: "header" },
          { label: "Taxe annuelle", value: formatNumber(result.taxeAnnuelle) + " FCFA", type: "result" },
          { label: "Taxe mensuelle", value: formatNumber(result.taxeMensuelle) + " FCFA", type: "normal" },
          { label: "Repartition", value: "", type: "header" },
          { label: "Part Etat", value: formatNumber(result.partEtat) + " FCFA", type: "normal" },
          { label: "Part collectivites", value: formatNumber(result.partCollectivites) + " FCFA", type: "normal" },
          { label: "Penalite retard", value: formatNumber(result.penaliteRetard) + " FCFA", type: "normal" },
          { label: "Total avec penalite", value: formatNumber(result.taxeAnnuelle + result.penaliteRetard) + " FCFA", type: "total" },
        ],
        reference: "Art. 378 CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.taxeImmo.debiteurType")}
          </Text>
          <OptionButtonGroup options={TYPES_DEBITEUR} selected={typeDebiteur} onChange={setTypeDebiteur} fontSize={12} />

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>
            {t("simulateur.taxeImmo.contribuableStatus")}
          </Text>
          <OptionButtonGroup options={NOUVEAU_OPTIONS} selected={estNouveau} onChange={setEstNouveau} fontSize={12} />

          <NumberField label={t("simulateur.taxeImmo.annualRent")} value={loyerAnnuel} onChange={setLoyerAnnuel} />
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.taxeImmo.baseSection")} />
            <TableRow label={t("simulateur.taxeImmo.annualRent")} value={formatNumber(result.loyerAnnuel)} bold />
            <TableRow label={t("simulateur.taxeImmo.monthlyRent")} value={formatNumber(result.loyerMensuel)} bg={colors.background} />
            <TableRow label={t("simulateur.taxeImmo.rate")} value={`${result.taux}%`} />

            <SimulateurSection label={t("simulateur.taxeImmo.taxSection")} />
            <ResultHighlight label={t("simulateur.taxeImmo.annualTax")} value={formatNumber(result.taxeAnnuelle)} variant="danger" />
            <TableRow label={t("simulateur.taxeImmo.monthlyTax")} value={formatNumber(result.taxeMensuelle)} />

            <SimulateurSection label={t("simulateur.taxeImmo.repartitionSection")} />
            <TableRow label={t("simulateur.taxeImmo.partEtat")} value={formatNumber(result.partEtat)} bg={colors.background} />
            <TableRow label={t("simulateur.taxeImmo.partCollectivites")} value={formatNumber(result.partCollectivites)} />

            <SimulateurSection label={t("simulateur.taxeImmo.penaliteSection")} />
            <TableRow label={t("simulateur.taxeImmo.penaliteRetard")} value={formatNumber(result.penaliteRetard)} bg={colors.background} />
            <ResultHighlight label={t("simulateur.taxeImmo.totalRetard")} value={formatNumber(result.taxeAnnuelle + result.penaliteRetard)} variant="danger" />

            <View style={[styles.deadlineBox, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.deadlineText, { color: colors.primary }]}>
                {t("simulateur.taxeImmo.deadline")}: {result.echeance}
              </Text>
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
