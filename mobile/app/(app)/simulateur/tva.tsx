import { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculerTVA } from "@/lib/services/tva.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function TvaScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Section A
  const [ventesHT, setVentesHT] = useState("");
  const [autresOp, setAutresOp] = useState("");
  const [exportsHT, setExportsHT] = useState("");
  const [exonerees, setExonerees] = useState("");
  // Section C
  const [tvaImmo, setTvaImmo] = useState("");
  const [tvaBnS, setTvaBnS] = useState("");
  // Report
  const [creditAnt, setCreditAnt] = useState("");

  const parse = (v: string) => parseFloat(v.replace(/\s/g, "")) || 0;

  const result = useMemo(() => {
    const v = parse(ventesHT);
    const a = parse(autresOp);
    if (v <= 0 && a <= 0) return null;
    return calculerTVA({
      ventesServicesHT: v,
      autresOpTaxables: a,
      exportationsHT: parse(exportsHT),
      operationsExonerees: parse(exonerees),
      achatsImmobilisations: parse(tvaImmo),
      achatsBiensServices: parse(tvaBnS),
      creditAnterior: parse(creditAnt),
    });
  }, [ventesHT, autresOp, exportsHT, exonerees, tvaImmo, tvaBnS, creditAnt]);

  return (
    <SimulateurLayout
      title={t("simulateur.tva.title")}
      subtitle={t("simulateur.tva.subtitle")}
      description={t("simulateur.tva.description")}
      legalRef={t("simulateur.tva.legalRef")}
      emptyMessage={t("simulateur.tva.enterRevenue")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur TVA",
        inputs: { "Ventes/Services HT": ventesHT, "Autres operations": autresOp, "Exportations HT": exportsHT, "Operations exonerees": exonerees, "TVA immobilisations": tvaImmo, "TVA biens/services": tvaBnS, "Credit anterieur": creditAnt },
        results: [
          { label: "Chiffre d'affaires", value: "", type: "header" },
          { label: "Total CA HT", value: formatNumber(result.totalCAHT) + "", type: "normal" },
          { label: "TVA brute", value: "", type: "header" },
          { label: "Total TVA brute", value: formatNumber(result.totalTvaBrute) + "", type: "normal" },
          { label: "TVA deductible", value: "", type: "header" },
          { label: "Total TVA deductible", value: "- " + formatNumber(result.totalTvaDeductible) + "", type: "normal" },
          { label: "Solde TVA", value: "", type: "header" },
          ...(result.tvaAPayer > 0
            ? [{ label: "TVA a payer", value: formatNumber(result.tvaAPayer) + "", type: "result" as const }]
            : [{ label: "Credit TVA", value: formatNumber(result.creditTva) + "", type: "result" as const }]),
          { label: "Centimes additionnels", value: formatNumber(result.centimesAdditionnels) + "", type: "normal" },
          { label: "Total general", value: formatNumber(result.totalAPayer) + "", type: "total" },
        ],
        reference: "Art. 234 CGI 2026",
      } : undefined}
      inputSection={
        <>
          {/* Section A */}
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
            <Text style={[styles.sectionHeaderText, { color: "#fff" }]}>{t("simulateur.tva.sectionA")}</Text>
          </View>
          <NumberField label={t("simulateur.tva.ligne01")} value={ventesHT} onChange={setVentesHT} />
          <NumberField label={t("simulateur.tva.ligne02")} value={autresOp} onChange={setAutresOp} />
          <NumberField label={t("simulateur.tva.ligne03")} value={exportsHT} onChange={setExportsHT} />
          <NumberField label={t("simulateur.tva.ligne04")} value={exonerees} onChange={setExonerees} />

          {/* Section C */}
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary, marginTop: 16 }]}>
            <Text style={[styles.sectionHeaderText, { color: "#fff" }]}>{t("simulateur.tva.sectionC")}</Text>
          </View>
          <NumberField label={t("simulateur.tva.ligne09")} value={tvaImmo} onChange={setTvaImmo} />
          <NumberField label={t("simulateur.tva.ligne10")} value={tvaBnS} onChange={setTvaBnS} />

          {/* Report */}
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary, marginTop: 16 }]}>
            <Text style={[styles.sectionHeaderText, { color: "#fff" }]}>{t("simulateur.tva.sectionReport")}</Text>
          </View>
          <NumberField label={t("simulateur.tva.ligne14")} value={creditAnt} onChange={setCreditAnt} />
        </>
      }
      resultSection={
        result ? (
          <View>
            {/* En-tête déclaration */}
            <View style={[styles.declarationHeader, { backgroundColor: colors.primary }]}>
              <Text style={styles.declarationTitle}>{t("simulateur.tva.declarationTitle")}</Text>
              <Text style={styles.declarationSub}>{t("simulateur.tva.declarationSub")}</Text>
            </View>

            {/* Section A — CA */}
            <SimulateurSection label={t("simulateur.tva.sectionATitle")} />
            {result.lignesCA.map((l) => (
              <TableRow
                key={l.numero}
                label={`${l.numero}. ${l.libelle}`}
                value={formatNumber(l.baseHT || 0)}
                bg={l.numero === "01" ? colors.background : undefined}
              />
            ))}
            <TableRow label={t("simulateur.tva.totalCA")} value={formatNumber(result.totalCAHT)} bold />

            {/* Section B — TVA brute */}
            <SimulateurSection label={t("simulateur.tva.sectionBTitle")} />
            {result.lignesTvaBrute.map((l) => (
              <TableRow
                key={l.numero}
                label={`${l.numero}. ${l.libelle}`}
                value={formatNumber(l.tva || 0)}
                bg={l.tva && l.tva > 0 ? colors.background : undefined}
              />
            ))}
            <TableRow label={t("simulateur.tva.totalBrute")} value={formatNumber(result.totalTvaBrute)} bold />

            {/* Section C — TVA déductible */}
            <SimulateurSection label={t("simulateur.tva.sectionCTitle")} />
            {result.lignesTvaDeductible.map((l) => (
              <TableRow
                key={l.numero}
                label={`${l.numero}. ${l.libelle}`}
                value={l.tva && l.tva > 0 ? `- ${formatNumber(l.tva)}` : formatNumber(0)}
                color={l.tva && l.tva > 0 ? colors.danger : undefined}
              />
            ))}
            <TableRow
              label={t("simulateur.tva.totalDeductible")}
              value={`- ${formatNumber(result.totalTvaDeductible)}`}
              bold
              color={colors.danger}
            />

            {result.creditAnterior > 0 && (
              <TableRow
                label={t("simulateur.tva.creditReport")}
                value={`- ${formatNumber(result.creditAnterior)}`}
                color={colors.danger}
                bg={colors.background}
              />
            )}

            {/* Section D — Solde TVA */}
            <SimulateurSection label={t("simulateur.tva.sectionDTitle")} />
            {result.tvaAPayer > 0 ? (
              <ResultHighlight
                label={t("simulateur.tva.vatDue")}
                value={formatNumber(result.tvaAPayer)}
                variant="danger"
              />
            ) : (
              <ResultHighlight
                label={t("simulateur.tva.vatCredit")}
                value={formatNumber(result.creditTva)}
                variant="success"
              />
            )}

            {/* Section E — Centimes additionnels */}
            <SimulateurSection label={t("simulateur.tva.sectionETitle")} />
            <TableRow
              label={t("simulateur.tva.centimesBase")}
              value={formatNumber(result.totalTvaBrute)}
            />
            <TableRow
              label={t("simulateur.tva.centimesTaux")}
              value={formatNumber(result.centimesAdditionnels)}
              bg={colors.background}
            />

            {/* Total général */}
            <View style={[styles.totalBar, { backgroundColor: colors.primary }]}>
              <Text style={styles.totalLabel}>{t("simulateur.tva.totalGeneral")}</Text>
              <Text style={styles.totalValue}>{formatNumber(result.totalAPayer)}</Text>
            </View>

            <View style={[styles.noteBox, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.noteText, { color: colors.primary }]}>{t("simulateur.tva.centimesNote")}</Text>
            </View>

            <View style={[styles.noteBox, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.noteText, { color: colors.primary }]}>{t("simulateur.tva.deadlineNote")}</Text>
            </View>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
  },
  declarationHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  declarationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: fonts.heading,
  },
  declarationSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: fonts.heading,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: fonts.heading,
  },
  noteBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
