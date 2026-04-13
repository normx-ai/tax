import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerIGF, type BaseIGF } from "@/lib/services/igf.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function IgfScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [chiffreAffaires, setChiffreAffaires] = useState("");
  const [baseImposition, setBaseImposition] = useState<BaseIGF>("ca");

  const BASES: { value: BaseIGF; label: string }[] = [
    { value: "ca", label: t("simulateur.igf.baseCa") },
    { value: "marge", label: t("simulateur.igf.baseMarge") },
  ];

  const result = useMemo(() => {
    const ca = parseFloat(chiffreAffaires.replace(/\s/g, "")) || 0;
    if (ca <= 0) return null;
    return calculerIGF({ chiffreAffaires: ca, baseImposition });
  }, [chiffreAffaires, baseImposition]);

  return (
    <SimulateurLayout
      title={t("simulateur.igf.title")}
      description={t("simulateur.igf.description")}
      legalRef={t("simulateur.igf.legalRef")}
      emptyMessage={t("simulateur.igf.enterTurnover")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur IGF",
        inputs: { "Chiffre d'affaires": chiffreAffaires, "Base d'imposition": baseImposition === "ca" ? "Chiffre d'affaires" : "Marge brute" },
        results: [
          { label: "Calcul IGF", value: "", type: "header" },
          { label: "Base imposable", value: formatNumber(result.baseImposable) + "", type: "normal" },
          { label: "Taux applique", value: result.taux + "%", type: "normal" },
          { label: "IGF annuel", value: formatNumber(result.igfAnnuel) + "", type: "result" },
          { label: "IGF trimestriel", value: formatNumber(result.igfTrimestriel) + "", type: "total" },
        ],
        reference: "Art. 404 CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.igf.taxBase")}
          </Text>
          <OptionButtonGroup options={BASES} selected={baseImposition} onChange={setBaseImposition} />

          <NumberField label={t("simulateur.igf.turnover")} value={chiffreAffaires} onChange={setChiffreAffaires} />
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.igf.resultSection")} />
            <TableRow label={t("simulateur.igf.taxableBase")} value={formatNumber(result.baseImposable)} bg={colors.card} />
            <TableRow label={t("simulateur.igf.appliedRate")} value={`${result.taux}%`} bg={colors.background} />

            <ResultHighlight label={t("simulateur.igf.annualIGF")} value={formatNumber(result.igfAnnuel)} variant="danger" />
            <ResultHighlight label={t("simulateur.igf.quarterlyIGF")} value={formatNumber(result.igfTrimestriel)} variant="primary" />

            <View style={[styles.noteBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>{t("simulateur.igf.paymentNote")}</Text>
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
  noteBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 12,
  },
});
