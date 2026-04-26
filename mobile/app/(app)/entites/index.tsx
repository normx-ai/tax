import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import {
  entitesApi,
  Entite,
  SecteurActivite,
  SECTEUR_LABELS,
  FORME_JURIDIQUE_LABELS,
  REGIME_IS_LABELS,
} from "@/lib/api/entites";
import EntiteFormModal from "@/components/entites/EntiteFormModal";

export default function EntitesScreen() {
  const { colors } = useTheme();
  const { toast, confirm } = useToast();
  const [entites, setEntites] = useState<Entite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState<SecteurActivite | "">("");
  const [showInactives, setShowInactives] = useState(false);

  const [editingEntite, setEditingEntite] = useState<Entite | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await entitesApi.list({
        search: search || undefined,
        secteurActivite: filterSecteur || undefined,
        actif: showInactives ? undefined : true,
        limit: 200,
      });
      setEntites(r.items);
      setTotal(r.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [search, filterSecteur, showInactives]);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => {
    setEditingEntite(null);
    setShowForm(true);
  };

  const handleEdit = (e: Entite) => {
    setEditingEntite(e);
    setShowForm(true);
  };

  const handleToggleActive = async (e: Entite) => {
    const ok = await confirm({
      title: e.actif ? "Désactiver l'entité ?" : "Réactiver l'entité ?",
      message: e.raisonSociale,
      confirmLabel: e.actif ? "Désactiver" : "Réactiver",
      cancelLabel: "Annuler",
    });
    if (!ok) return;
    try {
      if (e.actif) await entitesApi.desactiver(e.id);
      else await entitesApi.activer(e.id);
      toast(e.actif ? "Entité désactivée" : "Entité réactivée", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingEntite(null);
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text, marginLeft: 8 }}>
          Mes entités fiscales
        </Text>
        <TouchableOpacity onPress={handleNew} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
          <Ionicons name="add" size={18} color="#0F2A42" />
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42" }}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 12, gap: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
        <TextInput
          placeholder="Rechercher (raison sociale, sigle, NIU)..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={{ paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.regular }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <FilterChip label="Tous secteurs" active={filterSecteur === ""} onPress={() => setFilterSecteur("")} colors={colors} />
          {(Object.keys(SECTEUR_LABELS) as SecteurActivite[]).map(s => (
            <FilterChip key={s} label={SECTEUR_LABELS[s]} active={filterSecteur === s} onPress={() => setFilterSecteur(s)} colors={colors} />
          ))}
          <FilterChip label={showInactives ? "Inclut inactives" : "Actives uniquement"} active={showInactives} onPress={() => setShowInactives(v => !v)} colors={colors} />
        </ScrollView>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          {total} entité{total > 1 ? "s" : ""}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ padding: 24 }}>
          <Text style={{ fontFamily: fonts.regular, color: colors.danger, textAlign: "center" }}>{error}</Text>
        </View>
      ) : entites.length === 0 ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Ionicons name="business-outline" size={48} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.regular, color: colors.text, fontWeight: fontWeights.semiBold, marginTop: 12 }}>Aucune entité</Text>
          <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, textAlign: "center", marginTop: 6, fontSize: 13 }}>
            Cliquez « Nouvelle » pour créer votre première entité fiscale.{"\n"}
            Le profil détermine quelles obligations s'appliqueront automatiquement.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
          {entites.map(e => (
            <EntiteRow key={e.id} entite={e} onEdit={() => handleEdit(e)} onToggle={() => handleToggleActive(e)} colors={colors} />
          ))}
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <EntiteFormModal entite={editingEntite} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      </Modal>
    </View>
  );
}

function FilterChip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: active ? colors.primary : colors.card,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: active ? "#0F2A42" : colors.text, fontWeight: active ? fontWeights.bold : fontWeights.regular }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EntiteRow({ entite: e, onEdit, onToggle, colors }: { entite: Entite; onEdit: () => void; onToggle: () => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, opacity: e.actif ? 1 : 0.55 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        {e.isClientSelf && (
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.primary, marginRight: 8 }}>
            <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42", fontSize: 10 }}>MOI</Text>
          </View>
        )}
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: colors.text, fontSize: 15 }} numberOfLines={1}>
          {e.raisonSociale}
        </Text>
        <TouchableOpacity onPress={onEdit} style={{ padding: 6 }}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggle} style={{ padding: 6 }}>
          <Ionicons name={e.actif ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          <Ionicons name="business-outline" size={11} /> {FORME_JURIDIQUE_LABELS[e.formeJuridique]}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          <Ionicons name="briefcase-outline" size={11} /> {SECTEUR_LABELS[e.secteurActivite]}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          <Ionicons name="receipt-outline" size={11} /> {REGIME_IS_LABELS[e.regimeIs]}
        </Text>
        {e.estEmployeur && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
            <Ionicons name="people-outline" size={11} /> {e.effectifSalaries} salarié{e.effectifSalaries > 1 ? "s" : ""}
          </Text>
        )}
        {e.possedeFoncierBati && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
            <Ionicons name="home-outline" size={11} /> Foncier bâti
          </Text>
        )}
      </View>
    </View>
  );
}
