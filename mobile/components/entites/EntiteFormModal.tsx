import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import {
  entitesApi,
  Entite,
  SecteurActivite,
  FormeJuridique,
  RegimeIS,
  RegimeTVA,
  SECTEUR_LABELS,
  FORME_JURIDIQUE_LABELS,
  REGIME_IS_LABELS,
  REGIME_TVA_LABELS,
} from "@/lib/api/entites";
import { dossiersApi } from "@/lib/api/dossiers";

interface Props {
  entite: Entite | null;
  isClientSelfDefault?: boolean;  // true en mode entreprise pour la creation initiale
  onClose: () => void;
  onSaved: (e: Entite) => void;
}

export default function EntiteFormModal({ entite, isClientSelfDefault = false, onClose, onSaved }: Props) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const isEdit = !!entite && !!entite.id;

  // Identite
  const [raisonSociale, setRaisonSociale] = useState(entite?.raisonSociale ?? "");
  const [sigle, setSigle] = useState(entite?.sigle ?? "");
  const [niu, setNiu] = useState(entite?.niu ?? "");
  const [rccm, setRccm] = useState(entite?.rccm ?? "");
  const [adresse, setAdresse] = useState(entite?.adresse ?? "");
  const [ville, setVille] = useState(entite?.ville ?? "");
  const [telephone, setTelephone] = useState(entite?.telephone ?? "");
  const [email, setEmail] = useState(entite?.email ?? "");

  // Caracteristiques
  const [formeJuridique, setFormeJuridique] = useState<FormeJuridique>(entite?.formeJuridique ?? "SARL");
  const [secteurActivite, setSecteurActivite] = useState<SecteurActivite>(entite?.secteurActivite ?? "COMMERCE");
  const [regimeIs, setRegimeIs] = useState<RegimeIS>(entite?.regimeIs ?? "REEL_SIMPLIFIE");
  const [regimeTva, setRegimeTva] = useState<RegimeTVA>(entite?.regimeTva ?? "REEL");

  // Salaries
  const [estEmployeur, setEstEmployeur] = useState(entite?.estEmployeur ?? false);
  const [effectifSalaries, setEffectifSalaries] = useState(String(entite?.effectifSalaries ?? 0));

  // Foncier
  const [possedeFoncierBati, setPossedeFoncierBati] = useState(entite?.possedeFoncierBati ?? false);
  const [possedeFoncierNonBati, setPossedeFoncierNonBati] = useState(entite?.possedeFoncierNonBati ?? false);

  // CA
  const [caEstime, setCaEstime] = useState(entite?.caEstimeAnneeCourante ?? "");
  const [caN1, setCaN1] = useState(entite?.caRealiseAnneeN1 ?? "");

  // Exercice
  const [dateClotureExercice, setDateClotureExercice] = useState(entite?.dateClotureExercice ?? "12-31");

  const [actif, setActif] = useState(entite?.actif ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!raisonSociale.trim()) {
      toast("La raison sociale est requise", "error");
      return;
    }
    if (estEmployeur && (parseInt(effectifSalaries, 10) || 0) === 0) {
      toast("Effectif requis si l'entité est employeur", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        raisonSociale: raisonSociale.trim(),
        sigle: sigle || undefined,
        niu: niu || undefined,
        rccm: rccm || undefined,
        adresse: adresse || undefined,
        ville: ville || undefined,
        telephone: telephone || undefined,
        email: email || undefined,
        formeJuridique,
        secteurActivite,
        regimeIs,
        regimeTva,
        estEmployeur,
        effectifSalaries: parseInt(effectifSalaries, 10) || 0,
        possedeFoncierBati,
        possedeFoncierNonBati,
        caEstimeAnneeCourante: caEstime ? parseFloat(caEstime) : undefined,
        caRealiseAnneeN1: caN1 ? parseFloat(caN1) : undefined,
        dateClotureExercice: dateClotureExercice || undefined,
        isClientSelf: entite?.isClientSelf ?? isClientSelfDefault,
        actif,
      };
      const result = isEdit
        ? await entitesApi.update(entite!.id, payload as never)
        : await entitesApi.create(payload as never);

      // Recalcul automatique des dossiers fiscaux pour cette entite
      // (le profil fiscal a change donc certaines obligations peuvent
      // devenir applicables ou non)
      try {
        await dossiersApi.recalculer({ entiteId: result.id });
      } catch {
        // Silencieux : si le catalogue d'obligations est vide, le recalcul
        // ne fait rien — pas la peine d'alerter l'utilisateur.
      }

      toast(isEdit ? "Entité mise à jour" : "Entité créée", "success");
      onSaved(result);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
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
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text, marginLeft: 8 }}>
          {isEdit ? "Modifier l'entité" : "Nouvelle entité"}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, gap: 6, opacity: saving ? 0.6 : 1 }}>
          {saving ? <ActivityIndicator size="small" color="#0F2A42" /> : <Ionicons name="save-outline" size={18} color="#0F2A42" />}
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42" }}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Section title="Identité">
          <Field label="Raison sociale" required colors={colors}>
            <TextInput value={raisonSociale} onChangeText={setRaisonSociale} style={inputStyle} placeholder="Ex. CEGELEC TPI" placeholderTextColor={colors.textSecondary} />
          </Field>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Sigle" colors={colors}>
                <TextInput value={sigle ?? ""} onChangeText={setSigle} style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
            <View style={{ flex: 2 }}>
              <Field label="NIU (Numéro d'identification unique)" colors={colors}>
                <TextInput value={niu ?? ""} onChangeText={setNiu} style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
          </View>
          <Field label="RCCM" colors={colors}>
            <TextInput value={rccm ?? ""} onChangeText={setRccm} style={inputStyle} placeholderTextColor={colors.textSecondary} />
          </Field>
          <Field label="Adresse" colors={colors}>
            <TextInput value={adresse ?? ""} onChangeText={setAdresse} style={inputStyle} placeholderTextColor={colors.textSecondary} />
          </Field>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Ville" colors={colors}>
                <TextInput value={ville ?? ""} onChangeText={setVille} style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Téléphone" colors={colors}>
                <TextInput value={telephone ?? ""} onChangeText={setTelephone} style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
          </View>
          <Field label="Email" colors={colors}>
            <TextInput value={email ?? ""} onChangeText={setEmail} style={inputStyle} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
          </Field>
        </Section>

        <Section title="Caractéristiques fiscales">
          <Field label="Forme juridique" required colors={colors}>
            <ChipsRow value={formeJuridique} setValue={(v) => setFormeJuridique(v as FormeJuridique)} labels={FORME_JURIDIQUE_LABELS} colors={colors} />
          </Field>
          <Field label="Secteur d'activité (aligné sur les 16 conventions collectives)" required colors={colors}>
            <ChipsRow value={secteurActivite} setValue={(v) => setSecteurActivite(v as SecteurActivite)} labels={SECTEUR_LABELS} colors={colors} />
          </Field>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Régime IS" required colors={colors}>
                <ChipsRow value={regimeIs} setValue={(v) => setRegimeIs(v as RegimeIS)} labels={REGIME_IS_LABELS} colors={colors} small />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Régime TVA" required colors={colors}>
                <ChipsRow value={regimeTva} setValue={(v) => setRegimeTva(v as RegimeTVA)} labels={REGIME_TVA_LABELS} colors={colors} small />
              </Field>
            </View>
          </View>
        </Section>

        <Section title="Salariés et foncier">
          <Toggle label="Est employeur (déclenche ITS, TUS, IRCM, CNSS, CAMU)" value={estEmployeur} onChange={setEstEmployeur} colors={colors} />
          {estEmployeur && (
            <Field label="Effectif salariés" colors={colors}>
              <TextInput value={effectifSalaries} onChangeText={setEffectifSalaries} keyboardType="numeric" style={inputStyle} placeholderTextColor={colors.textSecondary} />
            </Field>
          )}
          <Toggle label="Possède du foncier bâti (déclenche CFPB)" value={possedeFoncierBati} onChange={setPossedeFoncierBati} colors={colors} />
          <Toggle label="Possède du foncier non bâti (déclenche CFPNB)" value={possedeFoncierNonBati} onChange={setPossedeFoncierNonBati} colors={colors} />
        </Section>

        <Section title="Chiffre d'affaires (FCFA)">
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="CA estimé année courante" colors={colors}>
                <TextInput value={String(caEstime ?? "")} onChangeText={setCaEstime} keyboardType="numeric" style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="CA réalisé N-1" colors={colors}>
                <TextInput value={String(caN1 ?? "")} onChangeText={setCaN1} keyboardType="numeric" style={inputStyle} placeholderTextColor={colors.textSecondary} />
              </Field>
            </View>
          </View>
        </Section>

        <Section title="Exercice fiscal">
          <Field label="Date de clôture (format MM-JJ, défaut 12-31)" colors={colors}>
            <TextInput value={dateClotureExercice ?? "12-31"} onChangeText={setDateClotureExercice} style={inputStyle} placeholder="12-31" placeholderTextColor={colors.textSecondary} />
          </Field>
        </Section>

        {isEdit && (
          <Section title="État">
            <Toggle label="Entité active" value={actif} onChange={setActif} colors={colors} />
          </Section>
        )}

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

function ChipsRow<T extends string>({ value, setValue, labels, colors, small }: { value: T; setValue: (v: T) => void; labels: Record<T, string>; colors: ReturnType<typeof useTheme>["colors"]; small?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {(Object.keys(labels) as T[]).map(k => (
        <TouchableOpacity
          key={k}
          onPress={() => setValue(k)}
          style={{
            paddingHorizontal: small ? 10 : 12,
            paddingVertical: small ? 6 : 7,
            backgroundColor: value === k ? colors.primary : colors.card,
            borderWidth: 1,
            borderColor: value === k ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: small ? 11 : 12, color: value === k ? "#0F2A42" : colors.text, fontWeight: value === k ? fontWeights.bold : fontWeights.regular }}>
            {labels[k]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function Toggle({ label, value, onChange, colors }: { label: string; value: boolean; onChange: (v: boolean) => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <TouchableOpacity onPress={() => onChange(!value)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Ionicons name={value ? "checkbox" : "square-outline"} size={22} color={value ? colors.primary : colors.textSecondary} />
      <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}
