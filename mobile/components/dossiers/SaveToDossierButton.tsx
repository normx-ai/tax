// Bouton + modale "Enregistrer dans un dossier" — Bloc 4.1.
//
// Apres un calcul dans un simulateur (patente, IS, ITS...), permet
// d'attacher le resultat (montantCalcule, baseImposable) a un dossier
// fiscal ouvert pour la bonne entite. Met le statut a PRET.

import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { dossiersApi, Dossier, STATUT_LABELS } from "@/lib/api/dossiers";

interface Props {
  simulateurCode: string;       // ex: "patente", "is", "tva"
  montantCalcule: number;
  baseImposable?: number;
  // Optionnel : si le simulateur connait deja l'entite ciblee
  entiteIdSuggestion?: string;
}

export default function SaveToDossierButton({ simulateurCode, montantCalcule, baseImposable, entiteIdSuggestion }: Props) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.primary,
        }}
      >
        <Ionicons name="folder-open-outline" size={18} color="#0F2A42" />
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42" }}>
          Enregistrer dans un dossier
        </Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SaveToDossierPicker
          simulateurCode={simulateurCode}
          montantCalcule={montantCalcule}
          baseImposable={baseImposable}
          entiteIdSuggestion={entiteIdSuggestion}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            toast("Calcul enregistré dans le dossier", "success");
          }}
        />
      </Modal>
    </>
  );
}

interface PickerProps extends Props {
  onClose: () => void;
  onSaved: () => void;
}

function SaveToDossierPicker({ simulateurCode, montantCalcule, baseImposable, entiteIdSuggestion, onClose, onSaved }: PickerProps) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    dossiersApi.listOuvertsParSimulateur(simulateurCode)
      .then(d => {
        // Si une entite est suggeree, la mettre en haut
        if (entiteIdSuggestion) {
          d.sort((a, b) => {
            if (a.entiteId === entiteIdSuggestion) return -1;
            if (b.entiteId === entiteIdSuggestion) return 1;
            return 0;
          });
        }
        setDossiers(d);
      })
      .catch(err => toast(err instanceof Error ? err.message : "Erreur", "error"))
      .finally(() => setLoading(false));
  }, [simulateurCode, entiteIdSuggestion]);

  const handleSave = async (d: Dossier) => {
    setSaving(d.id);
    try {
      await dossiersApi.update(d.id, {
        montantCalcule,
        baseImposable: baseImposable ?? null,
        statut: "PRET",
      });
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(null);
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
            Enregistrer ce calcul
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Montant : {Math.round(montantCalcule).toLocaleString("fr-FR")} FCFA · Simulateur {simulateurCode}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : dossiers.length === 0 ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.regular, color: colors.text, fontWeight: fontWeights.semiBold, marginTop: 12, textAlign: "center" }}>
            Aucun dossier ouvert
          </Text>
          <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, textAlign: "center", marginTop: 6, fontSize: 13 }}>
            Aucun dossier {simulateurCode} en cours pour vos entités.{"\n"}
            Vérifiez que :{"\n"}
            • Une obligation avec simulateurCode = "{simulateurCode}" existe dans le catalogue{"\n"}
            • Vos entités ont un profil compatible{"\n"}
            • Le recalcul a été déclenché (auto à la création/modif d'entité)
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginBottom: 6, paddingHorizontal: 4 }}>
            Choisir le dossier auquel rattacher ce calcul
          </Text>
          {dossiers.map(d => (
            <TouchableOpacity
              key={d.id}
              onPress={() => handleSave(d)}
              disabled={saving !== null}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: saving && saving !== d.id ? 0.4 : 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 14, color: colors.text }} numberOfLines={1}>
                  {d.entite?.raisonSociale ?? "?"}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>
                    {d.obligation?.code} — Période {d.periode}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary }}>
                    Échéance {new Date(d.dateEcheance).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.textSecondary, marginTop: 4, fontStyle: "italic" }}>
                  Statut actuel : {STATUT_LABELS[d.statut]}
                </Text>
              </View>
              {saving === d.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
