import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import {
  obligationsApi,
  Obligation,
  Periodicite,
  Categorie,
  EcheanceRule,
  PERIODICITE_LABELS,
  CATEGORIE_LABELS,
  ArticleRef,
} from "@/lib/api/obligations";

interface Props {
  obligation: Obligation | null;
  version: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ObligationFormModal({ obligation, version, onClose, onSaved }: Props) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const isEdit = !!obligation && !!obligation.id;

  const [code, setCode] = useState(obligation?.code ?? "");
  const [libelle, setLibelle] = useState(obligation?.libelle ?? "");
  const [description, setDescription] = useState(obligation?.description ?? "");
  const [categorie, setCategorie] = useState<Categorie>(obligation?.categorie ?? "DECLARATIONS");
  const [periodicite, setPeriodicite] = useState<Periodicite>(obligation?.periodicite ?? "MENSUELLE");
  const [echeanceRule, setEcheanceRule] = useState<EcheanceRule>(obligation?.echeanceRule ?? { type: "monthly", day: 15 });
  const [applicabiliteJson, setApplicabiliteJson] = useState(JSON.stringify(obligation?.applicabilite ?? {}, null, 2));
  const [articleNumero, setArticleNumero] = useState(obligation?.articleNumero ?? "");
  const [articleId, setArticleId] = useState(obligation?.articleId ?? "");
  const [simulateurCode, setSimulateurCode] = useState(obligation?.simulateurCode ?? "");
  const [actif, setActif] = useState(obligation?.actif ?? true);
  const [ordre, setOrdre] = useState(String(obligation?.ordre ?? 100));

  const [simulateurs, setSimulateurs] = useState<string[]>([]);
  const [articleSuggestions, setArticleSuggestions] = useState<ArticleRef[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    obligationsApi.getSimulateurs().then(setSimulateurs).catch(() => {});
  }, []);

  // Sync echeanceRule par defaut quand on change la periodicite
  const handlePeriodiciteChange = (p: Periodicite) => {
    setPeriodicite(p);
    if (p === "MENSUELLE") setEcheanceRule({ type: "monthly", day: 15 });
    else if (p === "ANNUELLE") setEcheanceRule({ type: "yearly", month: 4, day: 30 });
    else if (p === "TRIMESTRIELLE") setEcheanceRule({ type: "quarterly", months: [3, 6, 9, 12], day: "last" });
    else if (p === "SEMESTRIELLE") setEcheanceRule({ type: "semestriel", months: [6, 12], day: "last" });
    else setEcheanceRule({ type: "ponctuelle", description: "" });
  };

  const searchArticle = useCallback(async (q: string) => {
    setArticleNumero(q);
    if (q.length < 1) { setArticleSuggestions([]); return; }
    try {
      const r = await obligationsApi.searchArticles(q, version);
      setArticleSuggestions(r);
    } catch { /* */ }
  }, [version]);

  const handleSave = async () => {
    if (!code.trim() || !libelle.trim()) {
      toast("Code et libellé requis", "error");
      return;
    }
    let applicabilite: Record<string, unknown> = {};
    try {
      applicabilite = applicabiliteJson.trim() ? JSON.parse(applicabiliteJson) : {};
    } catch {
      toast("Applicabilité : JSON invalide", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.trim(),
        libelle: libelle.trim(),
        description: description || undefined,
        categorie,
        periodicite,
        echeanceRule,
        applicabilite,
        articleNumero: articleNumero || undefined,
        articleId: articleId || undefined,
        simulateurCode: simulateurCode || undefined,
        version,
        actif,
        ordre: parseInt(ordre, 10) || 100,
      };
      if (isEdit) {
        await obligationsApi.update(obligation!.id, payload);
        toast("Obligation mise à jour", "success");
      } else {
        await obligationsApi.create(payload);
        toast("Obligation créée", "success");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    backgroundColor: colors.background,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text, marginLeft: 8 }}>
          {isEdit ? "Modifier" : "Nouvelle obligation"}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, gap: 6, opacity: saving ? 0.6 : 1 }}>
          {saving ? <ActivityIndicator size="small" color="#0F2A42" /> : <Ionicons name="save-outline" size={18} color="#0F2A42" />}
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42" }}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Section title="Identité">
          <Field label="Code (ex. ITS, TVA, IS, MP, CFPB...)" required colors={colors}>
            <TextInput value={code} onChangeText={setCode} style={inputStyle} placeholder="CODE_UNIQUE" placeholderTextColor={colors.textSecondary} autoCapitalize="characters" />
          </Field>
          <Field label="Libellé" required colors={colors}>
            <TextInput value={libelle} onChangeText={setLibelle} style={inputStyle} placeholder="Impôt sur les traitements et salaires" placeholderTextColor={colors.textSecondary} />
          </Field>
          <Field label="Description (optionnel)" colors={colors}>
            <TextInput value={description ?? ""} onChangeText={setDescription} multiline numberOfLines={3} style={[inputStyle, { minHeight: 70, textAlignVertical: "top" }]} placeholder="Description courte de l'obligation" placeholderTextColor={colors.textSecondary} />
          </Field>
          <Field label="Catégorie" required colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {(Object.keys(CATEGORIE_LABELS) as Categorie[]).map(c => (
                <TouchableOpacity key={c} onPress={() => setCategorie(c)} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: categorie === c ? colors.primary : colors.card, borderWidth: 1, borderColor: categorie === c ? colors.primary : colors.border }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: categorie === c ? "#0F2A42" : colors.text, fontWeight: categorie === c ? fontWeights.bold : fontWeights.regular }}>{CATEGORIE_LABELS[c]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>
        </Section>

        <Section title="Échéance">
          <Field label="Périodicité" required colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {(Object.keys(PERIODICITE_LABELS) as Periodicite[]).map(p => (
                <TouchableOpacity key={p} onPress={() => handlePeriodiciteChange(p)} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: periodicite === p ? colors.primary : colors.card, borderWidth: 1, borderColor: periodicite === p ? colors.primary : colors.border }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: periodicite === p ? "#0F2A42" : colors.text, fontWeight: periodicite === p ? fontWeights.bold : fontWeights.regular }}>{PERIODICITE_LABELS[p]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>

          {/* Configuration de l'echeance selon la periodicite */}
          {echeanceRule.type === "monthly" && (
            <Field label="Jour du mois (1-31 ou 'last')" colors={colors}>
              <TextInput
                value={String(echeanceRule.day)}
                onChangeText={v => setEcheanceRule({ type: "monthly", day: v === "last" ? "last" : (parseInt(v, 10) || 15) })}
                style={inputStyle}
                placeholder="15"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
          )}

          {echeanceRule.type === "yearly" && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field label="Mois (1-12)" colors={colors}>
                  <TextInput
                    value={String(echeanceRule.month)}
                    onChangeText={v => setEcheanceRule({ ...echeanceRule, month: parseInt(v, 10) || 4 })}
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Jour" colors={colors}>
                  <TextInput
                    value={String(echeanceRule.day)}
                    onChangeText={v => setEcheanceRule({ ...echeanceRule, day: v === "last" ? "last" : (parseInt(v, 10) || 30) })}
                    style={inputStyle}
                    placeholderTextColor={colors.textSecondary}
                  />
                </Field>
              </View>
            </View>
          )}

          {echeanceRule.type === "quarterly" && (
            <Field label="Mois trimestriels (séparés par virgules) + jour" colors={colors}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={echeanceRule.months.join(",")}
                  onChangeText={v => setEcheanceRule({ ...echeanceRule, months: v.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) })}
                  style={[inputStyle, { flex: 2 }]}
                  placeholder="3,6,9,12"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  value={String(echeanceRule.day)}
                  onChangeText={v => setEcheanceRule({ ...echeanceRule, day: v === "last" ? "last" : (parseInt(v, 10) || 30) })}
                  style={[inputStyle, { flex: 1 }]}
                  placeholder="last ou 30"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </Field>
          )}

          {echeanceRule.type === "semestriel" && (
            <Field label="Mois semestriels (2 valeurs) + jour" colors={colors}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={echeanceRule.months.join(",")}
                  onChangeText={v => setEcheanceRule({ ...echeanceRule, months: v.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)).slice(0, 2) as [number, number] })}
                  style={[inputStyle, { flex: 2 }]}
                  placeholder="6,12"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  value={String(echeanceRule.day)}
                  onChangeText={v => setEcheanceRule({ ...echeanceRule, day: v === "last" ? "last" : (parseInt(v, 10) || 30) })}
                  style={[inputStyle, { flex: 1 }]}
                  placeholder="last"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </Field>
          )}

          {echeanceRule.type === "ponctuelle" && (
            <Field label="Description du déclencheur" colors={colors}>
              <TextInput
                value={echeanceRule.description}
                onChangeText={v => setEcheanceRule({ type: "ponctuelle", description: v })}
                multiline
                numberOfLines={2}
                style={[inputStyle, { minHeight: 50, textAlignVertical: "top" }]}
                placeholder="Ex. à chaque cession de parts, à chaque mutation..."
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
          )}
        </Section>

        <Section title="Applicabilité (JSON)">
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
            Règles évaluées par le moteur. Exemples :{"\n"}
            {`{ "salaries_count": { "min": 1 } }`}{"\n"}
            {`{ "possede_foncier_bati": true }`}{"\n"}
            {`{ "regime_tva": "reel" }`}{"\n"}
            Vide = applicable à toutes les entités.
          </Text>
          <TextInput
            value={applicabiliteJson}
            onChangeText={setApplicabiliteJson}
            multiline
            numberOfLines={4}
            style={[inputStyle, { fontFamily: "Menlo, monospace", minHeight: 90, textAlignVertical: "top" }]}
            placeholder="{}"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Section>

        <Section title="Référence légale et calcul">
          <Field label="Numéro article CGI (autocomplete)" colors={colors}>
            <TextInput value={articleNumero ?? ""} onChangeText={searchArticle} style={inputStyle} placeholder="277, 86A..." placeholderTextColor={colors.textSecondary} />
            {articleSuggestions.length > 0 && (
              <View style={{ marginTop: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, maxHeight: 160 }}>
                <ScrollView>
                  {articleSuggestions.map(a => (
                    <TouchableOpacity key={a.id} onPress={() => { setArticleNumero(a.numero); setArticleId(a.id); setArticleSuggestions([]); }} style={{ padding: 10, borderBottomWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, color: colors.text }}>Art. {a.numero}</Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{a.titre}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </Field>
          <Field label="Simulateur lié" colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <TouchableOpacity onPress={() => setSimulateurCode("")} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: simulateurCode === "" ? colors.primary : colors.card, borderWidth: 1, borderColor: simulateurCode === "" ? colors.primary : colors.border }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: simulateurCode === "" ? "#0F2A42" : colors.text }}>Aucun</Text>
              </TouchableOpacity>
              {simulateurs.map(s => (
                <TouchableOpacity key={s} onPress={() => setSimulateurCode(s)} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: simulateurCode === s ? colors.primary : colors.card, borderWidth: 1, borderColor: simulateurCode === s ? colors.primary : colors.border }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: simulateurCode === s ? "#0F2A42" : colors.text, fontWeight: simulateurCode === s ? fontWeights.bold : fontWeights.regular }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>
        </Section>

        <Section title="Présentation">
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Ordre d'affichage" colors={colors}>
                <TextInput value={ordre} onChangeText={setOrdre} keyboardType="numeric" style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
            <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 4 }}>
              <TouchableOpacity onPress={() => setActif(v => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name={actif ? "checkbox" : "square-outline"} size={20} color={actif ? colors.primary : colors.textSecondary} />
                <Text style={{ fontFamily: fonts.regular, color: colors.text }}>{actif ? "Actif" : "Inactif"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
      <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 14, color: colors.text }}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, required, colors, children }: { label: string; required?: boolean; colors: ReturnType<typeof useTheme>["colors"]; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, fontWeight: fontWeights.semiBold, color: colors.text }}>
        {label}{required ? " *" : ""}
      </Text>
      {children}
    </View>
  );
}
