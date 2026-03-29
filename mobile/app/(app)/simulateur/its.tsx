import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculerIts, calculerNombreParts, type SituationFamiliale, type PeriodeRevenu } from "@/lib/services/its.service";
import { formatNumber, formatInputNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function ItsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [salaireBrut, setSalaireBrut] = useState("");
  const [periode, setPeriode] = useState<PeriodeRevenu>("mensuel");
  const [situation, setSituation] = useState<SituationFamiliale>("celibataire");
  const [enfants, setEnfants] = useState(0);
  const [appliquerCharge, setAppliquerCharge] = useState(true);

  const SITUATIONS: { value: SituationFamiliale; label: string }[] = [
    { value: "celibataire", label: t("simulateur.its.single") },
    { value: "marie", label: t("simulateur.its.married") },
    { value: "divorce", label: t("simulateur.its.divorced") },
    { value: "veuf", label: t("simulateur.its.widowed") },
  ];

  const nombreParts = useMemo(
    () => calculerNombreParts(situation, enfants, appliquerCharge),
    [situation, enfants, appliquerCharge]
  );

  const result = useMemo(() => {
    const montant = parseFloat(salaireBrut.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerIts({
      salaireBrut: montant,
      periode,
      situationFamiliale: situation,
      nombreEnfants: enfants,
      appliquerChargeFamille: appliquerCharge,
    });
  }, [salaireBrut, periode, situation, enfants, appliquerCharge]);

  return (
    <SimulateurLayout
      title={t("simulateur.its.title")}
      description={t("simulateur.its.description")}
      legalRef={t("simulateur.its.legalRef")}
      emptyMessage={t("simulateur.its.enterSalary")}
      hasResult={!!result}
      inputSection={
        <>
          <View style={styles.rowGap10}>
            <View style={styles.flex1}>
              <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>{t("simulateur.its.status")}</Text>
              <OptionButtonGroup options={SITUATIONS} selected={situation} onChange={setSituation} direction="column" fontSize={12} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>{t("simulateur.its.dependents")}</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity accessibilityLabel={t("simulateur.decreaseDependents")} accessibilityRole="button" style={[styles.counterButton, { backgroundColor: colors.border }]} onPress={() => setEnfants(Math.max(0, enfants - 1))}>
                  <Text style={[styles.counterButtonText, { color: colors.text }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.counterValue, { color: colors.text }]}>{enfants}</Text>
                <TouchableOpacity accessibilityLabel={t("simulateur.increaseDependents")} accessibilityRole="button" style={[styles.counterButton, { backgroundColor: colors.border }]} onPress={() => setEnfants(Math.min(20, enfants + 1))}>
                  <Text style={[styles.counterButtonText, { color: colors.text }]}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.checkboxRow, { backgroundColor: appliquerCharge ? `${colors.primary}20` : colors.border }]} onPress={() => setAppliquerCharge(!appliquerCharge)}>
                <Ionicons name={appliquerCharge ? "checkbox" : "square-outline"} size={16} color={appliquerCharge ? colors.primary : colors.textMuted} />
                <Text style={[styles.checkboxLabel, { color: appliquerCharge ? colors.primary : colors.textSecondary }]}>{t("simulateur.its.familyQuotient")}</Text>
              </TouchableOpacity>
              <View style={[styles.partsBox, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.partsText, { color: colors.primary }]}>{nombreParts} {t("common.parts")}</Text>
              </View>
            </View>
          </View>

          <OptionButtonGroup
            options={[
              { value: "mensuel" as PeriodeRevenu, label: t("simulateur.its.monthly") },
              { value: "annuel" as PeriodeRevenu, label: t("simulateur.its.annual") },
            ]}
            selected={periode}
            onChange={setPeriode}
            fontSize={13}
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {periode === "mensuel" ? t("simulateur.its.grossSalaryMonthly") : t("simulateur.its.grossSalaryAnnual")}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <TextInput
              style={[styles.inputText, { color: colors.text }]}
              value={salaireBrut}
              onChangeText={(v) => setSalaireBrut(formatInputNumber(v))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>FCFA</Text>
          </View>
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.its.monthlyCalc")} />
            <TableRow label={t("simulateur.its.grossMonthly")} value={formatNumber(result.revenuBrutAnnuel / 12)} bold />
            <TableRow label={t("simulateur.its.cnssMonthly")} value={`- ${formatNumber(result.retenueCnssMensuelle)}`} bg={colors.background} color={colors.danger} />
            <TableRow label={t("simulateur.its.netTaxableMonthly")} value={formatNumber(Math.round(result.revenuNetImposable / 12))} />

            <SimulateurSection label={t("simulateur.its.annualCalc")} />
            <TableRow label={t("simulateur.its.grossAnnual")} value={formatNumber(result.revenuBrutAnnuel)} />
            <TableRow label={t("simulateur.its.cnssAnnual")} value={`- ${formatNumber(result.retenueCnss)}`} bg={colors.background} color={colors.danger} />
            <TableRow label={t("simulateur.its.netAnnual")} value={formatNumber(result.revenuBrutAnnuel - result.retenueCnss)} />
            <TableRow label={t("simulateur.its.netTaxableAnnual")} value={formatNumber(result.revenuNetImposable)} bg={colors.background} bold />

            <View style={[styles.quotientBox, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <View style={styles.quotientRow}>
                <View>
                  <Text style={[styles.quotientLabel, { color: colors.text }]}>{t("simulateur.its.familyQuotientCalc")}</Text>
                  <Text style={[styles.quotientSub, { color: colors.textSecondary }]}>{t("simulateur.its.netTaxableDivided")} {nombreParts} {t("common.parts")}</Text>
                </View>
                <Text style={[styles.quotientValue, { color: colors.text }]}>{formatNumber(result.revenuParPart)}</Text>
              </View>
            </View>

            <SimulateurSection label={t("simulateur.its.taxToPay")} />
            <TableRow label={t("simulateur.its.itsAnnual")} value={formatNumber(result.itsAnnuel)} />
            <ResultHighlight label={t("simulateur.its.itsMonthly")} value={formatNumber(result.itsMensuel)} variant="danger" />

            <ResultHighlight label={t("simulateur.its.netSalaryMonthly")} value={formatNumber(Math.round(result.salaireNetMensuel))} variant="success" />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  rowGap10: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  counterButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  counterValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  partsBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  partsText: {
    fontSize: 16,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    height: 48,
  },
  inputText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  quotientBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  quotientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quotientLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  quotientSub: {
    fontSize: 12,
  },
  quotientValue: {
    fontSize: 18,
    fontWeight: "400",
  },
});
