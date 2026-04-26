// Constructeur cliquable de regles d'applicabilite pour le catalogue
// d'obligations. Remplace l'edition JSON brute par une UI : ajout de
// criteres champ par champ, operateur, valeur. Sortie : meme structure
// JSON que ce que le moteur d'applicabilite consomme.

import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { SECTEUR_LABELS, FORME_JURIDIQUE_LABELS, REGIME_IS_LABELS, REGIME_TVA_LABELS } from "@/lib/api/entites";

type ValeurSimple = string | number | boolean;
interface CritereOperateurs {
  min?: number;
  max?: number;
  eq?: ValeurSimple;
  in?: ValeurSimple[];
  not_in?: ValeurSimple[];
}
type Critere = ValeurSimple | ValeurSimple[] | CritereOperateurs;
type Regles = Record<string, Critere>;

interface ChampDef {
  key: string;
  label: string;
  type: "boolean" | "number" | "select";
  options?: Record<string, string>;     // pour type "select"
  optionsKeyTransform?: (k: string) => string;  // ex: lowercase pour regime_tva
}

const CHAMPS: ChampDef[] = [
  { key: "est_employeur", label: "Est employeur", type: "boolean" },
  { key: "salaries_count", label: "Effectif salariés", type: "number" },
  { key: "possede_foncier_bati", label: "Possède du foncier bâti", type: "boolean" },
  { key: "possede_foncier_non_bati", label: "Possède du foncier non bâti", type: "boolean" },
  { key: "ca_n_moins_1", label: "CA réalisé N-1 (FCFA)", type: "number" },
  { key: "ca_n", label: "CA estimé année courante (FCFA)", type: "number" },
  { key: "regime_tva", label: "Régime TVA", type: "select", options: REGIME_TVA_LABELS, optionsKeyTransform: k => k.toLowerCase() },
  { key: "regime_is", label: "Régime IS", type: "select", options: REGIME_IS_LABELS, optionsKeyTransform: k => k.toLowerCase() },
  { key: "secteur_activite", label: "Secteur d'activité", type: "select", options: SECTEUR_LABELS },
  { key: "forme_juridique", label: "Forme juridique", type: "select", options: FORME_JURIDIQUE_LABELS },
  { key: "is_client_self", label: "Entité 'self' du compte", type: "boolean" },
];

interface Props {
  value: Regles;
  onChange: (regles: Regles) => void;
}

export default function ApplicabiliteBuilder({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(value, null, 2));

  const champsUtilises = new Set(Object.keys(value));
  const champsDispo = CHAMPS.filter(c => !champsUtilises.has(c.key));

  const ajouterCritere = (champ: ChampDef) => {
    const newRegles = { ...value };
    if (champ.type === "boolean") {
      newRegles[champ.key] = true;
    } else if (champ.type === "number") {
      newRegles[champ.key] = { min: 1 };
    } else if (champ.type === "select" && champ.options) {
      const firstKey = Object.keys(champ.options)[0];
      newRegles[champ.key] = champ.optionsKeyTransform ? champ.optionsKeyTransform(firstKey) : firstKey;
    }
    onChange(newRegles);
    setShowAdd(false);
  };

  const supprimerCritere = (key: string) => {
    const newRegles = { ...value };
    delete newRegles[key];
    onChange(newRegles);
  };

  const updateCritere = (key: string, val: Critere) => {
    onChange({ ...value, [key]: val });
  };

  const reglesJsonPreview = JSON.stringify(value);
  const isEmpty = Object.keys(value).length === 0;

  return (
    <View style={{ gap: 8 }}>
      {/* Mode toggle */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        <TouchableOpacity onPress={() => setShowJson(false)} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: !showJson ? colors.primary : colors.card, borderWidth: 1, borderColor: !showJson ? colors.primary : colors.border }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: !showJson ? "#0F2A42" : colors.text, fontWeight: !showJson ? fontWeights.bold : fontWeights.regular }}>
            Builder
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setShowJson(true); setJsonDraft(JSON.stringify(value, null, 2)); }} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: showJson ? colors.primary : colors.card, borderWidth: 1, borderColor: showJson ? colors.primary : colors.border }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: showJson ? "#0F2A42" : colors.text, fontWeight: showJson ? fontWeights.bold : fontWeights.regular }}>
            JSON (avancé)
          </Text>
        </TouchableOpacity>
      </View>

      {showJson ? (
        <View>
          <TextInput
            value={jsonDraft}
            onChangeText={(v) => {
              setJsonDraft(v);
              try {
                const parsed = JSON.parse(v) as Regles;
                onChange(parsed);
              } catch {
                /* JSON pas encore valide, on attend */
              }
            }}
            multiline
            numberOfLines={6}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              fontFamily: "Menlo, monospace",
              fontSize: 12,
              minHeight: 120,
              textAlignVertical: "top",
              backgroundColor: colors.background,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
            Exemples : {`{ "salaries_count": { "min": 1 } }`} · {`{ "secteurs_inclus": ["HOTELLERIE_CATERING"] }`}
          </Text>
        </View>
      ) : (
        <>
          {isEmpty ? (
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, fontStyle: "italic", paddingVertical: 8 }}>
              Aucun critère — l'obligation s'applique à toutes les entités.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              {Object.entries(value).map(([key, critere]) => {
                const champ = CHAMPS.find(c => c.key === key);
                if (!champ) {
                  return (
                    <View key={key} style={{ padding: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>{key}</Text>
                      <Text style={{ fontFamily: "Menlo, monospace", fontSize: 11, color: colors.text }}>{JSON.stringify(critere)}</Text>
                    </View>
                  );
                }
                return (
                  <CritereRow
                    key={key}
                    champ={champ}
                    critere={critere}
                    onChange={(c) => updateCritere(key, c)}
                    onDelete={() => supprimerCritere(key)}
                    colors={colors}
                  />
                );
              })}
            </View>
          )}

          {/* Ajout de critere */}
          {showAdd ? (
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, padding: 10 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.text, marginBottom: 6, fontWeight: fontWeights.semiBold }}>Choisir un champ</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {champsDispo.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => ajouterCritere(c)}
                    style={{ paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.text }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
                {champsDispo.length === 0 && (
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>Tous les champs sont déjà utilisés</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ marginTop: 8, alignSelf: "flex-start" }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, textDecorationLine: "underline" }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowAdd(true)} style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary }}>
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.primary, fontWeight: fontWeights.semiBold }}>Ajouter un critère</Text>
            </TouchableOpacity>
          )}

          {/* Apercu JSON en lecture */}
          {!isEmpty && (
            <Text style={{ fontFamily: "Menlo, monospace", fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
              {reglesJsonPreview}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

function CritereRow({ champ, critere, onChange, onDelete, colors }: {
  champ: ChampDef;
  critere: Critere;
  onChange: (c: Critere) => void;
  onDelete: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.text, fontWeight: fontWeights.semiBold }}>
          {champ.label}
        </Text>
        <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {champ.type === "boolean" && <BooleanInput value={critere as boolean} onChange={onChange} colors={colors} />}
      {champ.type === "number" && <NumberInput value={critere as CritereOperateurs} onChange={onChange} colors={colors} />}
      {champ.type === "select" && champ.options && (
        <SelectInput
          value={critere}
          options={champ.options}
          optionsKeyTransform={champ.optionsKeyTransform}
          onChange={onChange}
          colors={colors}
        />
      )}
    </View>
  );
}

function BooleanInput({ value, onChange, colors }: { value: boolean; onChange: (c: Critere) => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[true, false].map(v => (
        <TouchableOpacity
          key={String(v)}
          onPress={() => onChange(v)}
          style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: value === v ? colors.primary : colors.background, borderWidth: 1, borderColor: value === v ? colors.primary : colors.border }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: value === v ? "#0F2A42" : colors.text, fontWeight: value === v ? fontWeights.bold : fontWeights.regular }}>
            {v ? "Oui" : "Non"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function NumberInput({ value, onChange, colors }: { value: CritereOperateurs; onChange: (c: Critere) => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  const v = (typeof value === "object" && value !== null && !Array.isArray(value)) ? value : {};
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>min</Text>
      <TextInput
        value={v.min !== undefined ? String(v.min) : ""}
        onChangeText={(t) => {
          const n = parseFloat(t);
          const newVal = { ...v };
          if (isNaN(n)) delete newVal.min; else newVal.min = n;
          onChange(newVal);
        }}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={colors.textSecondary}
        style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.regular, fontSize: 12 }}
      />
      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>max</Text>
      <TextInput
        value={v.max !== undefined ? String(v.max) : ""}
        onChangeText={(t) => {
          const n = parseFloat(t);
          const newVal = { ...v };
          if (isNaN(n)) delete newVal.max; else newVal.max = n;
          onChange(newVal);
        }}
        keyboardType="numeric"
        placeholder="—"
        placeholderTextColor={colors.textSecondary}
        style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.regular, fontSize: 12 }}
      />
    </View>
  );
}

function SelectInput({ value, options, optionsKeyTransform, onChange, colors }: {
  value: Critere;
  options: Record<string, string>;
  optionsKeyTransform?: (k: string) => string;
  onChange: (c: Critere) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  // Si la valeur est une string : equality. Si tableau : in.
  const isMulti = Array.isArray(value);
  const single = typeof value === "string" ? value : null;
  const multi = Array.isArray(value) ? (value as string[]) : [];

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        <TouchableOpacity onPress={() => {
          if (isMulti && multi.length > 0) onChange(multi[0]);
        }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: !isMulti ? colors.primary : colors.background, borderWidth: 1, borderColor: !isMulti ? colors.primary : colors.border }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: !isMulti ? "#0F2A42" : colors.text }}>égal à</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          if (!isMulti && single) onChange([single]);
          else if (!isMulti) onChange([]);
        }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: isMulti ? colors.primary : colors.background, borderWidth: 1, borderColor: isMulti ? colors.primary : colors.border }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: isMulti ? "#0F2A42" : colors.text }}>parmi</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        {Object.entries(options).map(([k, label]) => {
          const valKey = optionsKeyTransform ? optionsKeyTransform(k) : k;
          const selected = isMulti ? multi.includes(valKey) : single === valKey;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => {
                if (isMulti) {
                  if (selected) onChange(multi.filter(v => v !== valKey));
                  else onChange([...multi, valKey]);
                } else {
                  onChange(valKey);
                }
              }}
              style={{ paddingHorizontal: 8, paddingVertical: 5, backgroundColor: selected ? colors.primary : colors.background, borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}
            >
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: selected ? "#0F2A42" : colors.text, fontWeight: selected ? fontWeights.bold : fontWeights.regular }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
