import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { calculerContributionFonciere, type TypePropriete, type ZoneUrbaine, type CultureRurale } from "@/lib/services/contribution-fonciere.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function ContributionFonciereScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [typePropriete, setTypePropriete] = useState<TypePropriete>("bati");
  const [valeurLocative, setValeurLocative] = useState("");
  const [surfaceM2, setSurfaceM2] = useState("");
  const [surfaceHa, setSurfaceHa] = useState("");
  const [tauxCommunal, setTauxCommunal] = useState("15");
  const [zoneUrbaine, setZoneUrbaine] = useState<ZoneUrbaine>("zone1");
  const [cultureRurale, setCultureRurale] = useState<CultureRurale>("autres_cultures");

  const TYPES: { value: TypePropriete; label: string }[] = [
    { value: "bati", label: t("simulateur.foncier.bati") },
    { value: "nonBatiUrbain", label: t("simulateur.foncier.nonBatiUrbain") },
    { value: "nonBatiRural", label: t("simulateur.foncier.nonBatiRural") },
  ];

  const ZONES: { value: ZoneUrbaine; label: string }[] = [
    { value: "zone1", label: t("simulateur.foncier.zone1") },
    { value: "zone2", label: t("simulateur.foncier.zone2") },
    { value: "zone3", label: t("simulateur.foncier.zone3") },
    { value: "zone4", label: t("simulateur.foncier.zone4") },
  ];

  const CULTURES: { value: CultureRurale; label: string }[] = [
    { value: "cafe_palmier", label: t("simulateur.foncier.cafePalmier") },
    { value: "forestier", label: t("simulateur.foncier.forestier") },
    { value: "autres_cultures", label: t("simulateur.foncier.autresCultures") },
    { value: "elevage", label: t("simulateur.foncier.elevage") },
    { value: "non_mis_valeur", label: t("simulateur.foncier.nonMisValeur") },
  ];

  const result = useMemo(() => {
    const vl = parseFloat(valeurLocative.replace(/\s/g, "")) || 0;
    const sm = parseFloat(surfaceM2.replace(/\s/g, "")) || 0;
    const sh = parseFloat(surfaceHa.replace(/\s/g, "")) || 0;
    const tc = parseFloat(tauxCommunal.replace(/\s/g, "")) || 0;

    if (typePropriete === "bati" && vl <= 0) return null;
    if (typePropriete === "nonBatiUrbain" && sm <= 0) return null;
    if (typePropriete === "nonBatiRural" && sh <= 0) return null;
    if (tc <= 0) return null;

    return calculerContributionFonciere({ typePropriete, valeurLocative: vl, tauxCommunal: tc, surfaceM2: sm, zoneUrbaine, surfaceHa: sh, cultureRurale });
  }, [typePropriete, valeurLocative, surfaceM2, surfaceHa, tauxCommunal, zoneUrbaine, cultureRurale]);

  return (
    <SimulateurLayout
      title={t("simulateur.foncier.title")}
      description={t("simulateur.foncier.description")}
      legalRef={t("simulateur.foncier.legalRef")}
      emptyMessage={t("simulateur.foncier.enterData")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Contribution fonciere",
        inputs: { "Type de propriete": typePropriete, "Valeur locative": valeurLocative, "Surface m2": surfaceM2, "Surface ha": surfaceHa, "Taux communal": tauxCommunal + "%" },
        results: [
          { label: "Calcul", value: "", type: "header" },
          { label: "Base brute", value: formatNumber(result.basebrute) + "", type: "normal" },
          ...(result.tauxAbattement > 0 ? [{ label: "Abattement (" + result.tauxAbattement + "%)", value: "- " + formatNumber(result.abattement) + "", type: "normal" as const }] : []),
          { label: "Base nette", value: formatNumber(result.baseNette) + "", type: "normal" },
          { label: "Taux communal", value: result.tauxCommunal + "%", type: "normal" },
          { label: "Resultat", value: "", type: "header" },
          { label: typePropriete === "bati" ? "CFPB" : "CFPNB", value: result.impot > 0 ? formatNumber(result.impot) + "" : "Sous le minimum", type: "total" },
        ],
        reference: result.articleRef,
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.foncier.typeLabel")}
          </Text>
          <OptionButtonGroup options={TYPES} selected={typePropriete} onChange={setTypePropriete} direction="column" fontSize={12} />

          {typePropriete === "bati" && (
            <NumberField label={t("simulateur.foncier.rentalValue")} value={valeurLocative} onChange={setValeurLocative} />
          )}

          {typePropriete === "nonBatiUrbain" && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {t("simulateur.foncier.zoneLabel")}
              </Text>
              <OptionButtonGroup options={ZONES} selected={zoneUrbaine} onChange={setZoneUrbaine} fontSize={11} />
              <NumberField label={t("simulateur.foncier.surfaceM2")} value={surfaceM2} onChange={setSurfaceM2} />
            </>
          )}

          {typePropriete === "nonBatiRural" && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {t("simulateur.foncier.cultureLabel")}
              </Text>
              <OptionButtonGroup options={CULTURES} selected={cultureRurale} onChange={setCultureRurale} direction="column" fontSize={11} />
              <NumberField label={t("simulateur.foncier.surfaceHa")} value={surfaceHa} onChange={setSurfaceHa} />
            </>
          )}

          <View style={styles.mb8}>
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
              {t("simulateur.foncier.communalRate")} (max {typePropriete === "bati" ? "20" : "40"}%)
            </Text>
            <View style={[styles.rateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.rateButtonsRow}>
                {[5, 10, 15, 20, ...(typePropriete !== "bati" ? [30, 40] : [])].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.rateButton, { backgroundColor: tauxCommunal === String(v) ? colors.primary : "transparent" }]}
                    onPress={() => setTauxCommunal(String(v))}
                  >
                    <Text style={[styles.rateButtonText, { color: tauxCommunal === String(v) ? colors.sidebarText : colors.text }]}>{v}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.foncier.calcSection")} />
            <TableRow label={t("simulateur.foncier.grossBase")} value={formatNumber(result.basebrute)} bold />
            {result.tauxAbattement > 0 && (
              <TableRow label={`${t("simulateur.foncier.deduction")} (${result.tauxAbattement}%)`} value={`- ${formatNumber(result.abattement)}`} bg={colors.background} color={colors.danger} />
            )}
            <TableRow label={t("simulateur.foncier.netBase")} value={formatNumber(result.baseNette)} bold />
            <TableRow label={`${t("simulateur.foncier.communalRate")} (max ${result.tauxMax}%)`} value={`${result.tauxCommunal}%`} bg={colors.background} />

            <SimulateurSection label={t("simulateur.foncier.resultSection")} />
            {result.impot > 0 ? (
              <ResultHighlight label={typePropriete === "bati" ? "CFPB" : "CFPNB"} value={formatNumber(result.impot)} variant="danger" />
            ) : (
              <View style={[styles.underMinBox, { backgroundColor: colors.citationsBg, borderTopColor: colors.border }]}>
                <Text style={[styles.underMinText, { color: colors.success }]}>
                  {t("simulateur.foncier.underMinimum")}
                </Text>
              </View>
            )}

            <View style={[styles.articleRefBox, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.articleRefText, { color: colors.primary }]}>{result.articleRef}</Text>
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
  mb8: {
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    marginBottom: 3,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
  },
  rateButtonsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rateButtonText: {
    fontWeight: "600",
    fontSize: 13,
  },
  underMinBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  underMinText: {
    fontSize: 14,
    fontWeight: "600",
  },
  articleRefBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  articleRefText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
