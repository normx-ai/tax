import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculerIts, calculerNombreParts, type SituationFamiliale, type PeriodeRevenu } from "@/lib/services/its.service";
import { formatNumber, formatInputNumber, FISCAL_PARAMS } from "@/lib/services/fiscal-common";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const BAREME_LABELS = ["0 %", "10 %", "15 %", "20 %", "30 %"];

export default function ItsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [salaireBrut, setSalaireBrut] = useState("");
  const [periode, setPeriode] = useState<PeriodeRevenu>("mensuel");
  const [situation, setSituation] = useState<SituationFamiliale>("celibataire");
  const [enfants, setEnfants] = useState(0);
  const [enfantsInfirmesMajeurs, setEnfantsInfirmesMajeurs] = useState(0);
  const [appliquerCharge, setAppliquerCharge] = useState(true);

  const SITUATIONS: { value: SituationFamiliale; label: string }[] = [
    { value: "celibataire", label: t("simulateur.its.single") },
    { value: "marie", label: t("simulateur.its.married") },
    { value: "divorce", label: t("simulateur.its.divorced") },
    { value: "veuf", label: t("simulateur.its.widowed") },
  ];

  const nombreParts = useMemo(
    () => calculerNombreParts(situation, enfants, appliquerCharge, enfantsInfirmesMajeurs),
    [situation, enfants, appliquerCharge, enfantsInfirmesMajeurs]
  );

  const result = useMemo(() => {
    const montant = parseFloat(salaireBrut.replace(/\s/g, "")) || 0;
    if (montant <= 0) return null;
    return calculerIts({
      salaireBrut: montant,
      periode,
      situationFamiliale: situation,
      nombreEnfants: enfants,
      enfantsInfirmesMajeurs,
      appliquerChargeFamille: appliquerCharge,
    });
  }, [salaireBrut, periode, situation, enfants, enfantsInfirmesMajeurs, appliquerCharge]);

  // Position du quotient familial dans le bareme ITS 2026
  const baremeProgress = useMemo(() => {
    if (!result) return { activeIndex: -1, fillRatios: [0, 0, 0, 0, 0] };
    const tranches = FISCAL_PARAMS.its.baremes;
    const q = result.revenuParPart;
    let activeIndex = 0;
    const fillRatios = tranches.map((tr, i) => {
      const max = tr.max ?? q;
      const span = (tr.max ?? Math.max(q, tr.min + 1)) - tr.min;
      if (q >= max && tr.max !== null) {
        activeIndex = i;
        return 1;
      }
      if (q > tr.min) {
        activeIndex = i;
        return Math.min(1, (q - tr.min) / span);
      }
      return 0;
    });
    return { activeIndex, fillRatios };
  }, [result]);

  return (
    <SimulateurLayout
      title={t("simulateur.its.title")}
      description={t("simulateur.its.description")}
      legalRef={t("simulateur.its.legalRef")}
      emptyMessage={t("simulateur.its.enterSalary")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur ITS",
        inputs: { "Salaire brut": salaireBrut, "Periode": periode, "Situation": situation, "Enfants": String(enfants) },
        results: [
          { label: "Calcul mensuel", value: "", type: "header" },
          { label: "Salaire brut mensuel", value: formatNumber(result.revenuBrutAnnuel / 12) + "", type: "normal" },
          { label: "Retenue CNSS mensuelle", value: "- " + formatNumber(result.retenueCnssMensuelle) + "", type: "normal" },
          { label: "Net imposable mensuel", value: formatNumber(Math.round(result.revenuNetImposable / 12)) + "", type: "normal" },
          { label: "Calcul annuel", value: "", type: "header" },
          { label: "Salaire brut annuel", value: formatNumber(result.revenuBrutAnnuel) + "", type: "normal" },
          { label: "Retenue CNSS annuelle", value: "- " + formatNumber(result.retenueCnss) + "", type: "normal" },
          { label: "Net imposable annuel", value: formatNumber(result.revenuNetImposable) + "", type: "normal" },
          { label: "Quotient familial", value: formatNumber(result.revenuParPart) + "", type: "normal" },
          { label: "ITS annuel", value: formatNumber(result.itsAnnuel) + "", type: "result" },
          { label: "ITS mensuel", value: formatNumber(result.itsMensuel) + "", type: "total" },
        ],
        reference: "Art. 116-G CGI 2026",
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PARAMÈTRES</Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("simulateur.its.status")}</Text>
          <OptionButtonGroup options={SITUATIONS} selected={situation} onChange={setSituation} direction="column" fontSize={13} />

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>Période de calcul</Text>
          <OptionButtonGroup
            options={[
              { value: "mensuel" as PeriodeRevenu, label: t("simulateur.its.monthly") },
              { value: "annuel" as PeriodeRevenu, label: t("simulateur.its.annual") },
            ]}
            selected={periode}
            onChange={setPeriode}
            fontSize={13}
          />

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>
            {periode === "mensuel" ? t("simulateur.its.grossSalaryMonthly") : t("simulateur.its.grossSalaryAnnual")} (FCFA)
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputText, { color: colors.text }]}
              value={salaireBrut}
              onChangeText={(v) => setSalaireBrut(formatInputNumber(v))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>{t("simulateur.its.dependents")}</Text>
          <View style={[styles.counterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              accessibilityLabel={t("simulateur.decreaseDependents")}
              accessibilityRole="button"
              style={styles.counterButton}
              onPress={() => {
                const next = Math.max(0, enfants - 1);
                setEnfants(next);
                if (enfantsInfirmesMajeurs > next) setEnfantsInfirmesMajeurs(next);
              }}
            >
              <Text style={[styles.counterButtonText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.counterValue, { color: colors.text }]}>{enfants}</Text>
            <TouchableOpacity
              accessibilityLabel={t("simulateur.increaseDependents")}
              accessibilityRole="button"
              style={styles.counterButton}
              onPress={() => setEnfants(Math.min(20, enfants + 1))}
            >
              <Text style={[styles.counterButtonText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>

          {enfants > 0 && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 14 }]}>{t("simulateur.its.disabledMajor")}</Text>
              <View style={[styles.counterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity accessibilityRole="button" style={styles.counterButton} onPress={() => setEnfantsInfirmesMajeurs(Math.max(0, enfantsInfirmesMajeurs - 1))}>
                  <Text style={[styles.counterButtonText, { color: colors.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.counterValue, { color: colors.text }]}>{enfantsInfirmesMajeurs}</Text>
                <TouchableOpacity accessibilityRole="button" style={styles.counterButton} onPress={() => setEnfantsInfirmesMajeurs(Math.min(enfants, enfantsInfirmesMajeurs + 1))}>
                  <Text style={[styles.counterButtonText, { color: colors.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.quotientToggle, { borderColor: colors.border, backgroundColor: appliquerCharge ? `${colors.primary}15` : colors.card }]}
            onPress={() => setAppliquerCharge(!appliquerCharge)}
          >
            <Ionicons name={appliquerCharge ? "checkbox" : "square-outline"} size={18} color={appliquerCharge ? colors.primary : colors.textMuted} />
            <Text style={[styles.quotientToggleLabel, { color: appliquerCharge ? colors.text : colors.textSecondary }]}>
              {t("simulateur.its.familyQuotient")}
            </Text>
            <View style={[styles.partsBadge, { backgroundColor: appliquerCharge ? colors.primary : colors.border }]}>
              <Text style={[styles.partsBadgeText, { color: appliquerCharge ? colors.headerBg : colors.textSecondary }]}>
                {nombreParts} parts
              </Text>
            </View>
          </TouchableOpacity>
        </>
      }
      resultSection={
        result ? (
          <View style={styles.resultStack}>
            {/* HERO — ITS mensuel */}
            <View style={[styles.hero, { backgroundColor: colors.headerBg }]}>
              <Text style={[styles.heroLabel, { color: colors.primary }]}>ITS mensuel à payer</Text>
              <View style={styles.heroAmountRow}>
                <Text style={styles.heroAmount}>{formatNumber(result.itsMensuel)}</Text>
                <Text style={styles.heroCurrency}>FCFA</Text>
              </View>
              <View style={styles.heroFooter}>
                <Text style={styles.heroFooterText}>
                  Soit <Text style={styles.heroFooterStrong}>{formatNumber(result.itsAnnuel)} FCFA / an</Text>
                </Text>
                <Text style={styles.heroFooterDot}>·</Text>
                <Text style={styles.heroFooterText}>
                  Taux effectif <Text style={styles.heroFooterStrong}>{result.tauxEffectif.toFixed(1)} %</Text>
                </Text>
              </View>
            </View>

            {/* JAUGE — Position dans le bareme */}
            <View style={styles.gaugeBlock}>
              <View style={styles.gaugeHeader}>
                <Text style={[styles.gaugeTitle, { color: colors.textSecondary }]}>POSITION DANS LE BARÈME ITS 2026</Text>
                <Text style={[styles.gaugeBracket, { color: colors.text }]}>
                  Tranche actuelle : <Text style={{ color: colors.primary, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>{BAREME_LABELS[baremeProgress.activeIndex] ?? "0 %"}</Text>
                </Text>
              </View>
              <View style={styles.gaugeBars}>
                {baremeProgress.fillRatios.map((ratio, i) => (
                  <View key={i} style={[styles.gaugeSegment, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.gaugeFill,
                        { backgroundColor: colors.primary, width: `${Math.round(ratio * 100)}%` },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.gaugeLegend}>
                <Text style={[styles.gaugeLegendText, { color: colors.textMuted }]}>0 FCFA</Text>
                <Text style={[styles.gaugeLegendText, { color: colors.textSecondary }]}>
                  Net imposable : {formatNumber(result.revenuNetImposable)} FCFA / an
                </Text>
                <Text style={[styles.gaugeLegendText, { color: colors.textMuted }]}>Plafond 30 %</Text>
              </View>
            </View>

            {/* DECOMPOSITION DU CALCUL */}
            <View style={[styles.decomposition, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.decompositionTitle, { color: colors.textSecondary }]}>DÉCOMPOSITION DU CALCUL</Text>

              <View style={styles.statCardsRow}>
                <View style={[styles.statCard, { borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SALAIRE BRUT ANNUEL</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(result.revenuBrutAnnuel)}</Text>
                  <Text style={[styles.statHint, { color: colors.textMuted }]}>12 × {formatNumber(result.revenuBrutMensuel)} FCFA</Text>
                </View>
                <View style={[styles.statCard, { borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NET IMPOSABLE ANNUEL</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(result.revenuNetImposable)}</Text>
                  <Text style={[styles.statHint, { color: colors.textMuted }]}>après CNSS et frais 20 %</Text>
                </View>
              </View>

              <DecompositionRow
                label="CNSS (4 % du brut)"
                value={`− ${formatNumber(result.retenueCnss)}`}
                colors={colors}
              />
              <DecompositionRow
                label="Salaire net annuel"
                value={formatNumber(result.revenuBrutAnnuel - result.retenueCnss)}
                colors={colors}
              />
              <DecompositionRow
                label="Frais professionnels (20 %)"
                value={`− ${formatNumber(result.fraisProfessionnels)}`}
                colors={colors}
              />
              <DecompositionRow
                label={`Quotient familial (÷ ${nombreParts} parts)`}
                value={formatNumber(result.revenuParPart)}
                colors={colors}
              />

              <View style={[styles.totalRow, { backgroundColor: `${colors.primary}15`, borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>ITS annuel à payer</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>{formatNumber(result.itsAnnuel)} FCFA</Text>
              </View>
            </View>
          </View>
        ) : null
      }
    />
  );
}

function DecompositionRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.decompRow, { borderTopColor: colors.border }]}>
      <Text style={[styles.decompLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.decompValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    height: 46,
    borderWidth: 1,
  },
  counterButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
  },
  counterValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
  },
  quotientToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 14,
    borderWidth: 1,
  },
  quotientToggleLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
  },
  partsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  partsBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },

  // RESULTAT
  resultStack: {
    gap: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  // Hero
  hero: {
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  heroAmount: {
    fontSize: 44,
    color: "#ffffff",
    fontFamily: fonts.headingBlack,
    fontWeight: fontWeights.headingBlack,
    letterSpacing: -1,
  },
  heroCurrency: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  heroFooterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.regular,
  },
  heroFooterStrong: {
    color: "#ffffff",
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
  },
  heroFooterDot: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },

  // Jauge
  gaugeBlock: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  gaugeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  gaugeTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  gaugeBracket: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  gaugeBars: {
    flexDirection: "row",
    gap: 4,
    height: 18,
  },
  gaugeSegment: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
  },
  gaugeLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 4,
  },
  gaugeLegendText: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },

  // Decomposition
  decomposition: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  decompositionTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  statCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  statHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  decompRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  decompLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  decompValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: fontWeights.medium,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 10,
    marginHorizontal: -16,
    marginBottom: -16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: fontWeights.bold,
  },
});
