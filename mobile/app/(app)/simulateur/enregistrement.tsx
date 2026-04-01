import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { calculerEnregistrement, type TypeActe, type ZoneImmat } from "@/lib/services/enregistrement.service";
import { formatNumber } from "@/lib/services/fiscal-common";
import TableRow from "@/components/simulateur/TableRow";
import SimulateurSection from "@/components/simulateur/SimulateurSection";
import NumberField from "@/components/simulateur/NumberField";
import OptionButtonGroup from "@/components/simulateur/OptionButtonGroup";
import ResultHighlight from "@/components/simulateur/ResultHighlight";
import SimulateurLayout from "@/components/simulateur/SimulateurLayout";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";

type Category = "contrats" | "baux" | "mutations" | "fonds" | "divers";

const ACTES_PAR_CATEGORIE: Record<Category, { value: TypeActe; labelKey: string }[]> = {
  contrats: [
    { value: "contrat", labelKey: "simulateur.enreg.contrat" },
    { value: "marchePublic", labelKey: "simulateur.enreg.marchePublic" },
  ],
  baux: [
    { value: "bail", labelKey: "simulateur.enreg.bail" },
    { value: "bailIllimite", labelKey: "simulateur.enreg.bailIllimite" },
    { value: "cessionBail", labelKey: "simulateur.enreg.cessionBail" },
  ],
  mutations: [
    { value: "mutationImmo", labelKey: "simulateur.enreg.mutationImmo" },
    { value: "mutationImmoImmat", labelKey: "simulateur.enreg.mutationImmoImmat" },
  ],
  fonds: [
    { value: "fondsCommerce", labelKey: "simulateur.enreg.fondsCommerce" },
    { value: "cessionActions", labelKey: "simulateur.enreg.cessionActions" },
  ],
  divers: [
    { value: "venteMobiliere", labelKey: "simulateur.enreg.venteMobiliere" },
    { value: "partage", labelKey: "simulateur.enreg.partage" },
  ],
};

export default function EnregistrementScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [montant, setMontant] = useState("");
  const [category, setCategory] = useState<Category>("contrats");
  const [typeActe, setTypeActe] = useState<TypeActe>("contrat");
  const [zoneImmat, setZoneImmat] = useState<ZoneImmat>("centreVille");

  const CATEGORIES: { value: Category; label: string }[] = [
    { value: "contrats", label: t("simulateur.enreg.catContrats") },
    { value: "baux", label: t("simulateur.enreg.catBaux") },
    { value: "mutations", label: t("simulateur.enreg.catMutations") },
    { value: "fonds", label: t("simulateur.enreg.catFonds") },
    { value: "divers", label: t("simulateur.enreg.catDivers") },
  ];

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setTypeActe(ACTES_PAR_CATEGORIE[cat][0].value);
  };

  const result = useMemo(() => {
    const m = parseFloat(montant.replace(/\s/g, "")) || 0;
    if (m <= 0) return null;
    return calculerEnregistrement({ typeActe, montant: m, zoneImmat });
  }, [montant, typeActe, zoneImmat]);

  return (
    <SimulateurLayout
      title={t("simulateur.enreg.title")}
      description={t("simulateur.enreg.description")}
      legalRef={t("simulateur.enreg.legalRef")}
      emptyMessage={t("simulateur.enreg.enterAmount")}
      hasResult={!!result}
      exportData={result ? {
        simulatorName: "Simulateur Droits d'enregistrement",
        inputs: { "Montant": montant, "Type d'acte": typeActe, "Categorie": category },
        results: [
          { label: "Calcul", value: "", type: "header" },
          { label: "Type d'acte", value: result.libelle, type: "normal" },
          { label: "Montant de base", value: formatNumber(result.montant) + " FCFA", type: "normal" },
          { label: "Taux applique (" + result.articleRef + ")", value: result.taux + "%", type: "normal" },
          { label: "Detail", value: "", type: "header" },
          { label: "Droits", value: formatNumber(result.droits) + " FCFA", type: "normal" },
          { label: "Centimes additionnels", value: "+ " + formatNumber(result.centimesAdditionnels) + " FCFA", type: "normal" },
          { label: "Total du", value: formatNumber(result.total) + " FCFA", type: "total" },
        ],
        reference: result.articleRef,
      } : undefined}
      inputSection={
        <>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.enreg.categoryLabel")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryButton, { backgroundColor: category === cat.value ? colors.primary : colors.border }]}
                  onPress={() => handleCategoryChange(cat.value)}
                >
                  <Text style={[styles.categoryButtonText, { color: category === cat.value ? colors.sidebarText : colors.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t("simulateur.enreg.acteLabel")}
          </Text>
          <View style={styles.acteList}>
            {ACTES_PAR_CATEGORIE[category].map((acte) => (
              <TouchableOpacity
                key={acte.value}
                style={[styles.acteButton, { backgroundColor: typeActe === acte.value ? colors.primary : colors.border }]}
                onPress={() => setTypeActe(acte.value)}
              >
                <Text style={[styles.acteButtonText, { color: typeActe === acte.value ? colors.sidebarText : colors.text }]}>{t(acte.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {typeActe === "mutationImmoImmat" && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {t("simulateur.enreg.zoneLabel")}
              </Text>
              <OptionButtonGroup
                options={[
                  { value: "centreVille" as ZoneImmat, label: t("simulateur.enreg.centreVille") },
                  { value: "urbainRural" as ZoneImmat, label: t("simulateur.enreg.urbainRural") },
                ]}
                selected={zoneImmat}
                onChange={setZoneImmat}
                fontSize={12}
              />
            </>
          )}

          <NumberField label={t("simulateur.enreg.amount")} value={montant} onChange={setMontant} />
        </>
      }
      resultSection={
        result ? (
          <View>
            <SimulateurSection label={t("simulateur.enreg.calcSection")} />
            <TableRow label={t("simulateur.enreg.acteType")} value={result.libelle} />
            <TableRow label={t("simulateur.enreg.baseAmount")} value={formatNumber(result.montant)} bg={colors.background} bold />
            <TableRow label={`${t("simulateur.enreg.rateApplied")} (${result.articleRef})`} value={`${result.taux}%`} />

            <SimulateurSection label={t("simulateur.enreg.detailSection")} />
            <TableRow label={t("simulateur.enreg.duties")} value={formatNumber(result.droits)} bold />
            <TableRow label={t("simulateur.enreg.additionalCents")} value={`+ ${formatNumber(result.centimesAdditionnels)}`} bg={colors.background} />
            <ResultHighlight label={t("simulateur.enreg.totalDue")} value={formatNumber(result.total)} variant="danger" />

            <View style={[styles.noteBox, { backgroundColor: `${colors.primary}10` }]}>
              <Text style={[styles.noteText, { color: colors.primary }]}>{t("simulateur.enreg.deadlineNote")}</Text>
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
  horizontalScroll: {
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 6,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  categoryButtonText: {
    fontWeight: "700",
    fontSize: 13,
  },
  acteList: {
    gap: 4,
    marginBottom: 12,
  },
  acteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  acteButtonText: {
    fontWeight: "600",
    fontSize: 14,
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
