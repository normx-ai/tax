import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { obligationsApi, Obligation, TestApplicabiliteResult } from "@/lib/api/obligations";
import { entitesApi, Entite } from "@/lib/api/entites";

interface Props {
  obligation: Obligation;
  onClose: () => void;
}

export default function TestApplicabiliteModal({ obligation, onClose }: Props) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loadingEntites, setLoadingEntites] = useState(true);
  const [resultat, setResultat] = useState<TestApplicabiliteResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [entiteIdSelected, setEntiteIdSelected] = useState<string | null>(null);

  useEffect(() => {
    entitesApi.list({ limit: 200, actif: true })
      .then(r => setEntites(r.items))
      .catch(() => setEntites([]))
      .finally(() => setLoadingEntites(false));
  }, []);

  const handleTester = async (entiteId: string) => {
    setEntiteIdSelected(entiteId);
    setTesting(true);
    setResultat(null);
    try {
      const r = await obligationsApi.testerApplicabilite(obligation.id, entiteId);
      setResultat(r);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text }}>
            Tester l'applicabilité
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {obligation.code} — {obligation.libelle}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 14 }}>
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, fontSize: 13, color: colors.text, marginBottom: 8 }}>
            Choisir une entité à tester
          </Text>
          {loadingEntites ? (
            <ActivityIndicator color={colors.primary} />
          ) : entites.length === 0 ? (
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
              Aucune entité disponible. Créez d'abord une entité dans /entites.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              {entites.map(e => (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => handleTester(e.id)}
                  disabled={testing}
                  style={{
                    padding: 10,
                    backgroundColor: entiteIdSelected === e.id ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: entiteIdSelected === e.id ? colors.primary : colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="business-outline" size={16} color={entiteIdSelected === e.id ? "#0F2A42" : colors.text} />
                  <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 13, color: entiteIdSelected === e.id ? "#0F2A42" : colors.text, fontWeight: entiteIdSelected === e.id ? fontWeights.bold : fontWeights.regular }} numberOfLines={1}>
                    {e.raisonSociale}
                  </Text>
                  {testing && entiteIdSelected === e.id && <ActivityIndicator size="small" color="#0F2A42" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {resultat && (
          <>
            <View
              style={{
                backgroundColor: resultat.applicable ? "#22c55e15" : "#ef444415",
                borderWidth: 2,
                borderColor: resultat.applicable ? "#22c55e" : "#ef4444",
                padding: 16,
                alignItems: "center",
              }}
            >
              <Ionicons
                name={resultat.applicable ? "checkmark-circle" : "close-circle"}
                size={36}
                color={resultat.applicable ? "#22c55e" : "#ef4444"}
              />
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text, marginTop: 8 }}>
                {resultat.applicable ? "Applicable" : "Non applicable"}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                {resultat.applicable
                  ? `Cette obligation s'applique à ${resultat.entite.raisonSociale} pour l'année fiscale ${resultat.anneeFiscale}`
                  : `Cette obligation ne s'applique pas à ${resultat.entite.raisonSociale} selon les règles configurées`}
              </Text>
            </View>

            {resultat.applicable && resultat.periodes.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, fontSize: 13, color: colors.text, marginBottom: 8 }}>
                  Échéances générées ({resultat.nbPeriodes})
                </Text>
                <View style={{ gap: 4 }}>
                  {resultat.periodes.slice(0, 12).map(p => (
                    <View key={p.periode} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
                        {p.periode}
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.text }}>
                        {new Date(p.dateEcheance).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, fontSize: 13, color: colors.text, marginBottom: 8 }}>
                Profil évalué de l'entité
              </Text>
              {Object.entries(resultat.profil).map(([k, v]) => (
                <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>{k}</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.text, fontWeight: fontWeights.semiBold }}>
                    {String(v)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}30`, padding: 12 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.text, marginBottom: 4, fontWeight: fontWeights.semiBold }}>
                Règles évaluées
              </Text>
              <Text style={{ fontFamily: "Menlo, monospace", fontSize: 11, color: colors.textSecondary }}>
                {JSON.stringify(obligation.applicabilite, null, 2)}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
