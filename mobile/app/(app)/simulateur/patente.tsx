import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculerPatente, type PatenteInput } from "@/lib/services/patente.service";
import { formatNumber, formatInputNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts } from "@/lib/theme/fonts";

export default function PatenteScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [chiffreAffaires, setChiffreAffaires] = useState("");
  const [isStandBy, setIsStandBy] = useState(false);
  const [isPetroliere, setIsPetroliere] = useState(false);
  const [dernierePatente, setDernierePatente] = useState("");
  const [isNouvelle, setIsNouvelle] = useState(false);
  const [nombreEntites, setNombreEntites] = useState(1);

  const result = useMemo(() => {
    return calculerPatente({
      chiffreAffaires: parseFloat(chiffreAffaires.replace(/\s/g, "")) || 0,
      isEntrepriseNouvelle: isNouvelle,
      isStandBy,
      isPetroliere,
      dernierePatente: parseFloat(dernierePatente.replace(/\s/g, "")) || 0,
      nombreEntitesFiscales: nombreEntites,
    });
  }, [chiffreAffaires, isStandBy, isPetroliere, dernierePatente, isNouvelle, nombreEntites]);

  const hasResult = !!(result && (result.isEntrepriseNouvelle || result.totalAPayer > 0));

  return (
    <SimulateurLayout
      title={t("simulateur.patente.title")}
      description={t("simulateur.patente.description")}
      legalRef={t("simulateur.patente.legalRef")}
      emptyMessage={t("simulateur.enterDataToSee")}
      hasResult={hasResult}
      exportData={result && hasResult ? {
        simulatorName: "Simulateur Patente",
        inputs: { "Chiffre d'affaires": chiffreAffaires, "Stand-by": isStandBy ? "Oui" : "Non", "Petroliere": isPetroliere ? "Oui" : "Non", "Entreprise nouvelle": isNouvelle ? "Oui" : "Non", "Entites fiscales": String(nombreEntites) },
        results: result.isEntrepriseNouvelle ? [
          { label: "Exoneration entreprise nouvelle", value: "0 FCFA", type: "total" },
          ...(result.camu > 0 ? [{ label: "CAMU a payer", value: formatNumber(result.camu) + " FCFA", type: "result" as const }] : []),
        ] : [
          { label: "Detail par tranches", value: "", type: "header" },
          { label: "Patente brute", value: formatNumber(Math.round(result.patenteBrute)) + " FCFA", type: "normal" },
          { label: "Patente nette", value: formatNumber(result.patenteNette) + " FCFA", type: "result" },
          { label: "Centimes additionnels", value: "", type: "header" },
          { label: "Centimes additionnels", value: formatNumber(result.centimesAdditionnels) + " FCFA", type: "normal" },
          { label: "Part chambres de commerce", value: formatNumber(result.partChambresCommerce) + " FCFA", type: "normal" },
          { label: "Part collectivites locales", value: formatNumber(result.partCollectivitesLocales) + " FCFA", type: "normal" },
          { label: "CAMU", value: formatNumber(result.camu) + " FCFA", type: "normal" },
          { label: "Total a payer", value: formatNumber(result.totalAPayer) + " FCFA", type: "total" },
        ],
        reference: "Art. 383 CGI 2026",
      } : undefined}
      inputSection={
        <>
          <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
            <View style={styles.flex1}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t("simulateur.patente.standby")}</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>{t("simulateur.patente.standbyDesc")}</Text>
            </View>
            <Switch value={isStandBy} onValueChange={setIsStandBy} trackColor={{ false: colors.disabled, true: `${colors.primary}80` }} thumbColor={isStandBy ? colors.primary : colors.textMuted} />
          </View>
          {isStandBy && (
            <View style={styles.mb8}>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t("simulateur.patente.lastPatente")}</Text>
              <View style={[styles.inputRowSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput style={[styles.inputTextSmall, { color: colors.text }]} value={dernierePatente} onChangeText={(v) => setDernierePatente(formatInputNumber(v))} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
                <Text style={[styles.currencySmall, { color: colors.textMuted }]}>FCFA</Text>
              </View>
            </View>
          )}

          {!isStandBy && (
            <View style={styles.mb12}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("simulateur.patente.turnover")}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <TextInput style={[styles.inputText, { color: colors.text }]} value={chiffreAffaires} onChangeText={(v) => setChiffreAffaires(formatInputNumber(v))} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
                <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>FCFA</Text>
              </View>
            </View>
          )}

          <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
            <View style={styles.flex1}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t("simulateur.patente.oilCompany")}</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>{t("simulateur.patente.oilCompanyDesc")}</Text>
            </View>
            <Switch value={isPetroliere} onValueChange={setIsPetroliere} trackColor={{ false: colors.disabled, true: `${colors.primary}80` }} thumbColor={isPetroliere ? colors.primary : colors.textMuted} />
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
            <View style={styles.flex1}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t("simulateur.patente.newCompany")}</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>{t("simulateur.patente.newCompanyDesc")}</Text>
            </View>
            <Switch value={isNouvelle} onValueChange={setIsNouvelle} trackColor={{ false: colors.disabled, true: `${colors.primary}80` }} thumbColor={isNouvelle ? colors.primary : colors.textMuted} />
          </View>
          <View style={[styles.switchRowMb12, { backgroundColor: colors.card }]}>
            <Text style={[styles.switchText, { color: colors.text }]}>{t("simulateur.patente.fiscalEntities")}</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity style={[styles.counterButtonSmall, { backgroundColor: colors.border }]} onPress={() => setNombreEntites(Math.max(1, nombreEntites - 1))}>
                <Text style={[styles.counterButtonTextSmall, { color: colors.text }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.counterValueSmall, { color: colors.text }]}>{nombreEntites}</Text>
              <TouchableOpacity style={[styles.counterButtonSmall, { backgroundColor: colors.border }]} onPress={() => setNombreEntites(nombreEntites + 1)}>
                <Text style={[styles.counterButtonTextSmall, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      }
      resultSection={
        result && result.isEntrepriseNouvelle ? (
          <View>
            <View style={[styles.totalBox, { backgroundColor: colors.success || "#2E7D32" }]}>
              <View style={styles.spaceBetweenRow}>
                <Text style={[styles.totalLabel, { color: "#fff" }]}>{t("simulateur.patente.exemptionTitle")}</Text>
                <Text style={[styles.totalValue, { color: "#fff" }]}>0 FCFA</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
              <Text style={[styles.descriptionText, { color: colors.text }]}>{t("simulateur.patente.exemptionDesc")}</Text>
            </View>
            {result.camu > 0 && (
              <>
                <SimulateurSection label="CAMU due malgré exonération" />
                <TableRow label="Contribution solidarité 0,5%" value={formatNumber(result.camu)} />
                <View style={[styles.totalBox, { backgroundColor: colors.primary }]}>
                  <View style={styles.spaceBetweenRow}>
                    <Text style={[styles.totalLabel, { color: "#fff" }]}>CAMU à payer</Text>
                    <Text style={[styles.totalValue, { color: "#fff" }]}>{formatNumber(result.camu)} FCFA</Text>
                  </View>
                </View>
              </>
            )}
            <View style={[styles.refsBox, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              {result.references.map((ref) => (
                <Text key={ref} style={[styles.refText, { color: colors.textMuted }]}>{ref}</Text>
              ))}
            </View>
          </View>
        ) : result && result.totalAPayer > 0 ? (
          <View>
            {result.tranches.length > 0 && (
              <>
                <SimulateurSection label={t("simulateur.patente.trancheDetail")} />
                {result.tranches.map((tr, i) => (
                  <View key={tr.tranche} style={[styles.trancheRow, { backgroundColor: i % 2 === 0 ? colors.card : colors.background, borderTopColor: colors.border }]}>
                    <Text style={[styles.trancheLabel, { color: colors.textSecondary }]}>{tr.tranche}</Text>
                    <Text style={[styles.trancheRate, { color: colors.primary }]}>{tr.taux.toFixed(3)}%</Text>
                    <Text style={[styles.trancheAmount, { color: colors.text }]}>{formatNumber(Math.round(tr.montant))}</Text>
                  </View>
                ))}
                <View style={[styles.grossPatenteBox, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                  <View style={styles.spaceBetweenRow}>
                    <Text style={[styles.grossPatenteLabel, { color: colors.text }]}>{t("simulateur.patente.grossPatente")}</Text>
                    <Text style={[styles.grossPatenteValue, { color: colors.text }]}>{formatNumber(Math.round(result.patenteBrute))}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Réductions (stand-by ou pétrolière) */}
            {(result.reductionStandBy > 0 || result.reductionPetroliere > 0) && (
              <>
                <SimulateurSection label={t("simulateur.patente.reductions")} />
                {result.reductionStandBy > 0 && (
                  <TableRow label={t("simulateur.patente.standbyReduction")} value={`- ${formatNumber(Math.round(result.reductionStandBy))}`} color={colors.danger} />
                )}
                {result.reductionPetroliere > 0 && (
                  <TableRow label={t("simulateur.patente.oilReduction")} value={`- ${formatNumber(Math.round(result.reductionPetroliere))}`} bg={colors.background} color={colors.danger} />
                )}
              </>
            )}

            <View style={[styles.netPatenteBox, { backgroundColor: `${colors.primary}10`, borderTopColor: colors.border }]}>
              <View style={styles.spaceBetweenRow}>
                <Text style={[styles.netPatenteLabel, { color: colors.primary }]}>{t("simulateur.patente.netPatente")}</Text>
                <Text style={[styles.netPatenteValue, { color: colors.primary }]}>{formatNumber(result.patenteNette)}</Text>
              </View>
            </View>

            {/* Centimes additionnels */}
            <SimulateurSection label={t("simulateur.patente.centimesSection")} />
            <TableRow label={t("simulateur.patente.centimesRate")} value={formatNumber(result.centimesAdditionnels)} />
            <TableRow label={t("simulateur.patente.partCC")} value={formatNumber(result.partChambresCommerce)} bg={colors.background} />
            <TableRow label={t("simulateur.patente.partCL")} value={formatNumber(result.partCollectivitesLocales)} />

            {/* CAMU */}
            <SimulateurSection label="CAMU (Art. 3-4)" />
            <TableRow label="Contribution solidarité 0,5%" value={formatNumber(result.camu)} />

            {/* Total à payer */}
            <View style={[styles.totalBox, { backgroundColor: colors.primary, borderTopColor: colors.border }]}>
              <View style={styles.spaceBetweenRow}>
                <Text style={[styles.totalLabel, { color: "#fff" }]}>{t("simulateur.patente.totalToPay")}</Text>
                <Text style={[styles.totalValue, { color: "#fff" }]}>{formatNumber(result.totalAPayer)} FCFA</Text>
              </View>
            </View>

            {result.nombreEntites > 1 && (
              <TableRow label={`${t("common.perEntity")} (${result.nombreEntites})`} value={formatNumber(result.totalParEntite)} bg={colors.background} bold />
            )}

            <View style={[styles.deadlineBox, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <View style={styles.deadlineRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.text} />
                <Text style={[styles.deadlineText, { color: colors.text }]}>{t("common.deadline")} : {result.dateEcheance}</Text>
              </View>
            </View>

            <View style={[styles.refsBox, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              {result.references.map((ref) => (
                <Text key={ref} style={[styles.refText, { color: colors.textMuted }]}>{ref}</Text>
              ))}
            </View>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  descriptionText: {
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
  },
  switchRowMb12: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchDesc: {
    fontSize: 12,
  },
  switchText: {
    fontSize: 14,
    flex: 1,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 13,
    marginBottom: 3,
  },
  inputRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
  },
  inputTextSmall: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  currencySmall: {
    fontSize: 12,
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
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButtonSmall: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonTextSmall: {
    fontSize: 17,
    fontWeight: "700",
  },
  counterValueSmall: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  trancheRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  trancheLabel: {
    fontSize: 13,
    flex: 1,
  },
  trancheRate: {
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 6,
  },
  trancheAmount: {
    fontSize: 13,
    fontWeight: "600",
    width: 80,
    textAlign: "right",
  },
  grossPatenteBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  spaceBetweenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grossPatenteLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  grossPatenteValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  netPatenteBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  netPatenteLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  netPatenteValue: {
    fontSize: 18,
    fontWeight: "400",
  },
  totalBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "400",
    fontFamily: fonts.bold,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "400",
    fontFamily: fonts.bold,
  },
  deadlineBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deadlineText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  refsBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  refText: {
    fontSize: 12,
  },
});
