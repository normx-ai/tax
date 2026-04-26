import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { obligationsApi, AlerteAide, AlertesAideGroupees, CATEGORIE_LABELS, Categorie } from "@/lib/api/obligations";

interface Props {
  onClose: () => void;
  onPickAlerte: (a: AlerteAide) => void;
}

export default function AlertesAidePanel({ onClose, onPickAlerte }: Props) {
  const { colors } = useTheme();
  const [groups, setGroups] = useState<AlertesAideGroupees>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obligationsApi.getAlertesAide()
      .then(setGroups)
      .catch(err => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const categoriesAvecAlertes = Object.keys(groups).filter(k => groups[k].length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text }}>
            Aide depuis les alertes du CGI
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            Données déjà extraites du CGI par le moteur d'analyse. Cliquez sur une alerte pour pré-remplir une nouvelle obligation.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ padding: 24 }}>
          <Text style={{ fontFamily: fonts.regular, color: colors.danger, textAlign: "center" }}>{error}</Text>
        </View>
      ) : categoriesAvecAlertes.length === 0 ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.regular, color: colors.text, marginTop: 12, textAlign: "center" }}>
            Aucune alerte fiscale extraite pour le moment.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
          {categoriesAvecAlertes.map(cat => {
            const label = CATEGORIE_LABELS[cat as Categorie] ?? cat;
            const alertes = groups[cat];
            return (
              <View key={cat} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ padding: 12, backgroundColor: colors.primary }}>
                  <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42" }}>
                    {label} · {alertes.length}
                  </Text>
                </View>
                {alertes.map(a => (
                  <TouchableOpacity key={a.id} onPress={() => onPickAlerte(a)} style={{ padding: 12, borderTopWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.background }}>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary }}>{a.type}</Text>
                      </View>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>Art. {a.articleNumero}</Text>
                      {a.valeur && (
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.primary, fontWeight: fontWeights.semiBold }}>
                          {a.valeur} {a.unite ?? ""}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, color: colors.text, marginBottom: 2 }} numberOfLines={1}>
                      {a.titre}
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }} numberOfLines={2}>
                      {a.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
