import { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import {
  calculerPaie,
  calculerAvantagesForfaitaires,
  type ProfilSalarie,
  type ZoneTOL,
  type SituationFamiliale,
  type RubriquesInput,
} from "@/lib/services/paie.service";
import { calculateQuotient } from "@/lib/services/fiscal-common";
import { formatNumber, formatInputNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import NumberField from "@/components/simulateur/NumberField";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

const RUBRIQUES_VIDES: RubriquesInput = {
  salaireBase: 0, primesImposables: 0, heuresSup: 0, congesAnnuels: 0,
  primeTransport: 0, primeRepresentation: 0, primePanier: 0, primeSalissure: 0,
  avLogement: 0, avDomesticite: 0, avElectricite: 0,
  avVoiture: 0, avTelephone: 0, avNourriture: 0,
};

function parseField(v: string): number {
  return parseInt(v.replace(/\s/g, ""), 10) || 0;
}

export default function PaieScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // --- État saisie ---
  const [profil, setProfil] = useState<ProfilSalarie>("national");
  const [situation, setSituation] = useState<SituationFamiliale>("celibataire");
  const [enfants, setEnfants] = useState(0);
  const [zoneTOL, setZoneTOL] = useState<ZoneTOL>("peripherie");
  const [moisJanvier, setMoisJanvier] = useState(false);
  const [forfaitaire, setForfaitaire] = useState(false);

  // Champs textuels (formatés avec espaces)
  const [fields, setFields] = useState<Record<keyof RubriquesInput, string>>({
    salaireBase: "", primesImposables: "", heuresSup: "", congesAnnuels: "",
    primeTransport: "", primeRepresentation: "", primePanier: "", primeSalissure: "",
    avLogement: "", avDomesticite: "", avElectricite: "",
    avVoiture: "", avTelephone: "", avNourriture: "",
  });

  const setField = useCallback((key: keyof RubriquesInput, v: string) => {
    setFields((prev) => ({ ...prev, [key]: v }));
  }, []);

  // Salaire de présence (pour calcul forfaitaire)
  const salairePresence = useMemo(() => {
    return parseField(fields.salaireBase) + parseField(fields.primesImposables)
      + parseField(fields.heuresSup) + parseField(fields.congesAnnuels);
  }, [fields.salaireBase, fields.primesImposables, fields.heuresSup, fields.congesAnnuels]);

  // Application des avantages forfaitaires
  const handleToggleForfaitaire = useCallback((val: boolean) => {
    setForfaitaire(val);
    if (val && salairePresence > 0) {
      const av = calculerAvantagesForfaitaires(salairePresence);
      setFields((prev) => ({
        ...prev,
        avLogement: av.avLogement ? formatInputNumber(String(av.avLogement)) : "",
        avDomesticite: av.avDomesticite ? formatInputNumber(String(av.avDomesticite)) : "",
        avElectricite: av.avElectricite ? formatInputNumber(String(av.avElectricite)) : "",
        avVoiture: av.avVoiture ? formatInputNumber(String(av.avVoiture)) : "",
        avTelephone: av.avTelephone ? formatInputNumber(String(av.avTelephone)) : "",
        avNourriture: av.avNourriture ? formatInputNumber(String(av.avNourriture)) : "",
      }));
    }
  }, [salairePresence]);

  // Rubriques numériques
  const rubriques = useMemo<RubriquesInput>(() => {
    const r = { ...RUBRIQUES_VIDES };
    for (const key of Object.keys(r) as (keyof RubriquesInput)[]) {
      r[key] = parseField(fields[key]);
    }
    return r;
  }, [fields]);

  // Calcul brut imposable (hors primes exonérées Art. 114-A)
  const brutImposable = useMemo(() => {
    const sp = rubriques.salaireBase + rubriques.primesImposables + rubriques.heuresSup + rubriques.congesAnnuels;
    const av = rubriques.avLogement + rubriques.avDomesticite + rubriques.avElectricite
      + rubriques.avVoiture + rubriques.avTelephone + rubriques.avNourriture;
    return sp + av;
  }, [rubriques]);

  // Total des primes exonérées (Art. 114-A)
  const totalExonere = useMemo(() => {
    return rubriques.primeTransport + rubriques.primeRepresentation + rubriques.primePanier + rubriques.primeSalissure;
  }, [rubriques]);

  // Résultat
  const result = useMemo(() => {
    if (rubriques.salaireBase <= 0) return null;
    return calculerPaie({
      rubriques,
      profilSalarie: profil,
      situationFamiliale: situation,
      nombreEnfants: enfants,
      zoneTOL,
      moisJanvier,
    });
  }, [rubriques, profil, situation, enfants, zoneTOL, moisJanvier]);

  const isResident = profil !== "non_resident";

  // Nombre de parts calculé indépendamment du résultat
  const nombreParts = useMemo(() => {
    if (!isResident) return 1;
    return calculateQuotient(situation, enfants, true);
  }, [situation, enfants, isResident]);

  const PROFILS: { value: ProfilSalarie; label: string }[] = [
    { value: "national", label: t("simulateur.paie.profilNational") },
    { value: "etranger_resident", label: t("simulateur.paie.profilEtranger") },
    { value: "non_resident", label: t("simulateur.paie.profilNonResident") },
  ];

  const SITUATIONS: { value: SituationFamiliale; label: string }[] = [
    { value: "celibataire", label: t("simulateur.paie.single") },
    { value: "marie", label: t("simulateur.paie.married") },
    { value: "divorce", label: t("simulateur.paie.divorced") },
    { value: "veuf", label: t("simulateur.paie.widowed") },
  ];

  const ZONES: { value: ZoneTOL; label: string }[] = [
    { value: "centre_ville", label: t("simulateur.paie.centreVille") },
    { value: "peripherie", label: t("simulateur.paie.peripherie") },
  ];

  return (
    <SimulateurLayout
      title={t("simulateur.paie.title")}
      description={t("simulateur.paie.description")}
      legalRef={t("simulateur.paie.legalRef")}
      emptyMessage={t("simulateur.paie.enterSalary")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Paie",
        inputs: { "Salaire de base": fields.salaireBase, "Primes imposables": fields.primesImposables, "Profil": profil, "Situation": situation, "Enfants": String(enfants) },
        results: [
          { label: "Bases de calcul", value: "", type: "header" },
          { label: "Salaire brut total", value: formatNumber(result.salaireBrutTotal) + "", type: "normal" },
          { label: "Base ITS", value: formatNumber(result.baseITS) + "", type: "normal" },
          { label: "Retenues salarie", value: "", type: "header" },
          { label: "CNSS salarie", value: "- " + formatNumber(result.cnssSalarieMensuel) + "", type: "normal" },
          { label: "ITS mensuel", value: "- " + formatNumber(result.itsMensuel) + "", type: "normal" },
          { label: "TOL", value: "- " + formatNumber(result.tolMensuel) + "", type: "normal" },
          { label: "CAMU", value: "- " + formatNumber(result.camuMensuel) + "", type: "normal" },
          { label: "Total retenues", value: formatNumber(result.totalRetenuesSalarie) + "", type: "result" },
          { label: "Salaire net mensuel", value: formatNumber(result.salaireNetMensuel) + "", type: "total" },
          { label: "Charges patronales", value: "", type: "header" },
          { label: "Total charges patronales", value: formatNumber(result.totalChargesPatronales) + "", type: "result" },
          { label: "Cout total employeur", value: formatNumber(result.coutTotalEmployeur) + "", type: "total" },
          { label: "Recapitulatif annuel", value: "", type: "header" },
          { label: "Salaire net annuel", value: formatNumber(result.salaireNetAnnuel) + "", type: "normal" },
          { label: "Taux effectif", value: result.tauxEffectif.toFixed(1) + "%", type: "normal" },
        ],
        reference: "Art. 114-A, 116-G CGI 2026",
      } : undefined}
      inputSection={
        <>
          {/* Profil salarié */}
          <Text style={[styles.label13, { color: colors.textSecondary }]}>{t("simulateur.paie.profil")}</Text>
          <OptionButtonGroup options={PROFILS} selected={profil} onChange={setProfil} fontSize={13} />

          {/* Situation familiale (résidents uniquement) */}
          {isResident && (
            <View style={styles.familyRow}>
              <View style={styles.flex1}>
                <Text style={[styles.label13, { color: colors.textSecondary }]}>{t("simulateur.paie.status")}</Text>
                <OptionButtonGroup options={SITUATIONS} selected={situation} onChange={setSituation} direction="column" fontSize={13} />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.label13, { color: colors.textSecondary }]}>{t("simulateur.paie.dependents")}</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity accessibilityLabel={t("simulateur.decreaseDependents")} accessibilityRole="button" style={[styles.counterButton, { backgroundColor: colors.border }]} onPress={() => setEnfants(Math.max(0, enfants - 1))}>
                    <Text style={[styles.counterButtonText, { color: colors.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: colors.text }]}>{enfants}</Text>
                  <TouchableOpacity accessibilityLabel={t("simulateur.increaseDependents")} accessibilityRole="button" style={[styles.counterButton, { backgroundColor: colors.border }]} onPress={() => setEnfants(Math.min(20, enfants + 1))}>
                    <Text style={[styles.counterButtonText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.partsBox, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.partsText, { color: colors.primary }]}>
                    {nombreParts} {t("common.parts")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Section Rémunération de base */}
          <SimulateurSection label={t("simulateur.paie.sectionBase")} />
          <NumberField label={t("simulateur.paie.salaireBase")} value={fields.salaireBase} onChange={(v) => setField("salaireBase", v)} />
          <NumberField label={t("simulateur.paie.primesImposables")} value={fields.primesImposables} onChange={(v) => setField("primesImposables", v)} />
          <NumberField label={t("simulateur.paie.heuresSup")} value={fields.heuresSup} onChange={(v) => setField("heuresSup", v)} />
          <NumberField label={t("simulateur.paie.congesAnnuels")} value={fields.congesAnnuels} onChange={(v) => setField("congesAnnuels", v)} />

          {/* Section Avantages en nature */}
          <SimulateurSection label={t("simulateur.paie.sectionAvantages")} />
          <View style={[styles.toggleRow, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.toggleLabel, { color: colors.primary }]}>{t("simulateur.paie.toggleForfaitaire")}</Text>
            <Switch value={forfaitaire} onValueChange={handleToggleForfaitaire} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>
          <NumberField label={t("simulateur.paie.avLogement")} value={fields.avLogement} onChange={(v) => setField("avLogement", v)} />
          <NumberField label={t("simulateur.paie.avDomesticite")} value={fields.avDomesticite} onChange={(v) => setField("avDomesticite", v)} />
          <NumberField label={t("simulateur.paie.avElectricite")} value={fields.avElectricite} onChange={(v) => setField("avElectricite", v)} />
          <NumberField label={t("simulateur.paie.avVoiture")} value={fields.avVoiture} onChange={(v) => setField("avVoiture", v)} />
          <NumberField label={t("simulateur.paie.avTelephone")} value={fields.avTelephone} onChange={(v) => setField("avTelephone", v)} />
          <NumberField label={t("simulateur.paie.avNourriture")} value={fields.avNourriture} onChange={(v) => setField("avNourriture", v)} />

          {/* Section Primes non imposables */}
          <SimulateurSection label={t("simulateur.paie.sectionIndemnites")} />
          <NumberField label={`${t("simulateur.paie.primeTransport")} (${t("simulateur.paie.primeTransportNote")})`} value={fields.primeTransport} onChange={(v) => setField("primeTransport", v)} />
          <NumberField label={`${t("simulateur.paie.primeRepresentation")} (${t("simulateur.paie.primeRepresentationNote")})`} value={fields.primeRepresentation} onChange={(v) => setField("primeRepresentation", v)} />
          <NumberField label={t("simulateur.paie.primePanier")} value={fields.primePanier} onChange={(v) => setField("primePanier", v)} />
          <NumberField label={t("simulateur.paie.primeSalissure")} value={fields.primeSalissure} onChange={(v) => setField("primeSalissure", v)} />

          {/* Affichage surligné du brut imposable */}
          <View style={[styles.brutBox, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.brutLabel, { color: colors.textSecondary }]}>{t("simulateur.paie.salaireBrutImposable")}</Text>
            <Text style={[styles.brutValue, { color: colors.primary }]}>{formatNumber(brutImposable)}</Text>
            {totalExonere > 0 && (
              <Text style={[styles.exonereText, { color: colors.textMuted }]}>
                {t("simulateur.paie.elementsExoneres")} : {formatNumber(totalExonere)}
              </Text>
            )}
          </View>

          {/* Zone TOL */}
          <Text style={[styles.label13mt12, { color: colors.textSecondary }]}>{t("simulateur.paie.zoneTOL")}</Text>
          <OptionButtonGroup options={ZONES} selected={zoneTOL} onChange={setZoneTOL} fontSize={13} />

          {/* Taxe régionale (janvier uniquement) */}
          <View style={[styles.toggleRowMt8, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.toggleLabel, { color: colors.primary }]}>{t("simulateur.paie.moisJanvier")}</Text>
            <Switch value={moisJanvier} onValueChange={setMoisJanvier} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>
        </>
      }
      resultSection={
        result ? (
          <View>
            {/* Bases de calcul */}
            <SimulateurSection label={t("simulateur.paie.sectionBases")} />
            <TableRow label={t("simulateur.paie.baseBrut")} value={formatNumber(result.salaireBrutTotal)} bold />
            <TableRow label={t("simulateur.paie.brutTaxable")} value={formatNumber(result.salaireBrutTotal - result.cnssSalarieMensuel)} bg={colors.background} />
            <TableRow label={t("simulateur.paie.baseITS")} value={formatNumber(result.baseITS)} />

            {/* Retenues salarié */}
            <SimulateurSection label={t("simulateur.paie.sectionRetenues")} />
            <TableRow label={t("simulateur.paie.cnssSalarie")} value={`- ${formatNumber(result.cnssSalarieMensuel)}`} color={colors.danger} />
            <TableRow
              label={result.modeCalculIts === "bareme" ? t("simulateur.paie.itsLabel") : t("simulateur.paie.itsForfaitaire")}
              value={`- ${formatNumber(result.itsMensuel)}`}
              bg={colors.background}
              color={colors.danger}
            />
            <TableRow label={t("simulateur.paie.tolLabel")} value={`- ${formatNumber(result.tolMensuel)}`} color={colors.danger} />
            <TableRow label={t("simulateur.paie.camuLabel")} value={`- ${formatNumber(result.camuMensuel)}`} color={colors.danger} />
            <TableRow label={t("simulateur.paie.taxeRegionale")} value={`- ${formatNumber(result.taxeRegionale)}`} bg={colors.background} color={colors.danger} />

            <ResultHighlight label={t("simulateur.paie.totalRetenues")} value={formatNumber(result.totalRetenuesSalarie)} variant="danger" />
            <ResultHighlight label={t("simulateur.paie.salaireNet")} value={formatNumber(result.salaireNetMensuel)} variant="success" />

            {/* Charges patronales */}
            <SimulateurSection label={t("simulateur.paie.sectionPatronales")} />
            <TableRow label={t("simulateur.paie.cnssVieillesse")} value={formatNumber(result.cnssVieillessePatronale)} />
            <TableRow label={t("simulateur.paie.cnssAF")} value={formatNumber(result.cnssAFPatronale)} bg={colors.background} />
            <TableRow label={t("simulateur.paie.cnssPF")} value={formatNumber(result.cnssPFPatronale)} />
            <TableRow label={`${t("simulateur.paie.tusLabel")} (${result.tauxTUS * 100}%)`} value={formatNumber(result.tusMensuel)} bg={colors.background} />
            <ResultHighlight label={t("simulateur.paie.totalPatronales")} value={formatNumber(result.totalChargesPatronales)} variant="primary" />
            <ResultHighlight label={t("simulateur.paie.coutEmployeur")} value={formatNumber(result.coutTotalEmployeur)} variant="danger" />

            {/* Récapitulatif annuel */}
            <SimulateurSection label={t("simulateur.paie.sectionRecap")} />
            <TableRow label={t("simulateur.paie.brutAnnuel")} value={formatNumber(result.salaireBrutTotal * 12)} bold />
            <TableRow label={t("simulateur.paie.netAnnuel")} value={formatNumber(result.salaireNetAnnuel)} bg={colors.background} bold />
            <TableRow label={t("simulateur.paie.chargesAnnuelles")} value={formatNumber(result.totalChargesPatronales * 12)} />
            <TableRow label={t("simulateur.paie.coutAnnuel")} value={formatNumber(result.coutTotalEmployeur * 12)} bg={colors.background} bold />
            <TableRow label={t("simulateur.paie.tauxEffectif")} value={`${result.tauxEffectif.toFixed(1)}%`} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  label13: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  label13mt12: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 2,
  },
  familyRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  flex1: {
    flex: 1,
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
  partsBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  partsText: {
    fontSize: 16,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  toggleRowMt8: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  brutBox: {
    marginTop: 12,
    padding: 14,
  },
  brutLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  brutValue: {
    fontSize: 24,
    fontWeight: "400",
  },
  exonereText: {
    fontSize: 14,
    marginTop: 4,
  },
});
