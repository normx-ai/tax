import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import {
  obligationsApi,
  Obligation,
  Periodicite,
  Categorie,
  PERIODICITE_LABELS,
  CATEGORIE_LABELS,
  formatEcheance,
} from "@/lib/api/obligations";
import ObligationFormModal from "@/components/admin/ObligationFormModal";
import AlertesAidePanel from "@/components/admin/AlertesAidePanel";

export default function ObligationsAdminScreen() {
  const { colors } = useTheme();
  const { toast, confirm } = useToast();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [version, setVersion] = useState("2026");
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState<Categorie | "">("");
  const [filterPeriodicite, setFilterPeriodicite] = useState<Periodicite | "">("");
  const [showInactives, setShowInactives] = useState(false);

  // Form modal
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Aide depuis AlerteFiscale
  const [showAide, setShowAide] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await obligationsApi.list({
        version,
        search: search || undefined,
        categorie: filterCategorie || undefined,
        periodicite: filterPeriodicite || undefined,
        actif: showInactives ? undefined : true,
        limit: 200,
      });
      setObligations(r.items);
      setTotal(r.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement";
      if (msg.includes("403")) setError("Accès refusé : réservé aux administrateurs.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [version, search, filterCategorie, filterPeriodicite, showInactives]);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => {
    setEditingObligation(null);
    setShowForm(true);
  };

  const handleEdit = (o: Obligation) => {
    setEditingObligation(o);
    setShowForm(true);
  };

  const handleToggleActive = async (o: Obligation) => {
    const ok = await confirm({
      title: o.actif ? "Désactiver l'obligation ?" : "Réactiver l'obligation ?",
      message: `${o.code} — ${o.libelle}`,
      confirmLabel: o.actif ? "Désactiver" : "Réactiver",
      cancelLabel: "Annuler",
    });
    if (!ok) return;
    try {
      if (o.actif) await obligationsApi.desactiver(o.id);
      else await obligationsApi.activer(o.id);
      toast(o.actif ? "Obligation désactivée" : "Obligation réactivée", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingObligation(null);
    load();
  };

  const handleCloneVersion = async () => {
    const ok = await confirm({
      title: `Cloner ${version} vers ${parseInt(version, 10) + 1} ?`,
      message: "Toutes les obligations actuelles seront copiées dans la nouvelle version. À utiliser quand la loi de finances paraît.",
      confirmLabel: "Cloner",
      cancelLabel: "Annuler",
    });
    if (!ok) return;
    try {
      const to = String(parseInt(version, 10) + 1);
      const r = await obligationsApi.clonerVersion(version, to);
      toast(r.cloned > 0 ? `${r.cloned} obligations clonées vers ${to}` : r.message, r.cloned > 0 ? "success" : "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text, marginLeft: 8 }}>
          Catalogue des obligations fiscales
        </Text>
        <TouchableOpacity onPress={() => setShowAide(true)} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="bulb-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNew} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
          <Ionicons name="add" size={18} color="#0F2A42" />
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42" }}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <View style={{ padding: 12, gap: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Rechercher (code, libellé)..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.regular }}
          />
          <TextInput
            placeholder="Version"
            placeholderTextColor={colors.textSecondary}
            value={version}
            onChangeText={setVersion}
            style={{ width: 80, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.regular, textAlign: "center" }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <FilterChip label="Toutes catégories" active={filterCategorie === ""} onPress={() => setFilterCategorie("")} colors={colors} />
          {(Object.keys(CATEGORIE_LABELS) as Categorie[]).map(c => (
            <FilterChip key={c} label={CATEGORIE_LABELS[c]} active={filterCategorie === c} onPress={() => setFilterCategorie(c)} colors={colors} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <FilterChip label="Toutes périodicités" active={filterPeriodicite === ""} onPress={() => setFilterPeriodicite("")} colors={colors} />
          {(Object.keys(PERIODICITE_LABELS) as Periodicite[]).map(p => (
            <FilterChip key={p} label={PERIODICITE_LABELS[p]} active={filterPeriodicite === p} onPress={() => setFilterPeriodicite(p)} colors={colors} />
          ))}
          <FilterChip label={showInactives ? "Inclut inactives" : "Actives uniquement"} active={showInactives} onPress={() => setShowInactives(v => !v)} colors={colors} />
        </ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 12 }}>
            {total} obligation{total > 1 ? "s" : ""} · version {version}
          </Text>
          <TouchableOpacity onPress={handleCloneVersion} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="copy-outline" size={14} color={colors.primary} />
            <Text style={{ fontFamily: fonts.regular, color: colors.primary, fontSize: 12, fontWeight: fontWeights.semiBold }}>Cloner version</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ padding: 24 }}>
          <Text style={{ fontFamily: fonts.regular, color: colors.danger, textAlign: "center" }}>{error}</Text>
        </View>
      ) : obligations.length === 0 ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.regular, color: colors.text, fontWeight: fontWeights.semiBold, marginTop: 12 }}>Catalogue vide</Text>
          <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, textAlign: "center", marginTop: 6, fontSize: 13 }}>
            Aucune obligation pour la version {version}.{"\n"}Cliquez « Nouvelle » pour ajouter, ou utilisez l'aide depuis les alertes fiscales (icône ampoule).
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
          {obligations.map(o => (
            <ObligationRow key={o.id} obligation={o} onEdit={() => handleEdit(o)} onToggle={() => handleToggleActive(o)} colors={colors} />
          ))}
        </ScrollView>
      )}

      {/* Modal de creation / edition */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <ObligationFormModal
          obligation={editingObligation}
          version={version}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      </Modal>

      {/* Panneau d'aide depuis les alertes existantes */}
      <Modal visible={showAide} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAide(false)}>
        <AlertesAidePanel
          onClose={() => setShowAide(false)}
          onPickAlerte={(a) => {
            // Pre-rempli un nouveau formulaire avec les donnees de l'alerte
            setShowAide(false);
            setEditingObligation({
              id: "",
              code: "",
              libelle: a.titre,
              description: a.description,
              categorie: a.categorie,
              periodicite: (a.periodicite as Periodicite) || "PONCTUELLE",
              echeanceRule: { type: "ponctuelle", description: a.description } as never,
              applicabilite: {},
              articleNumero: a.articleNumero,
              version,
              actif: true,
              ordre: 100,
              createdAt: "",
              updatedAt: "",
            });
            setShowForm(true);
          }}
        />
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

function ObligationRow({ obligation: o, onEdit, onToggle, colors }: { obligation: Obligation; onEdit: () => void; onToggle: () => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, opacity: o.actif ? 1 : 0.55 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.primary, marginRight: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42", fontSize: 12 }}>{o.code}</Text>
        </View>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, color: colors.text }} numberOfLines={1}>
          {o.libelle}
        </Text>
        <TouchableOpacity onPress={onEdit} style={{ padding: 6 }}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggle} style={{ padding: 6 }}>
          <Ionicons name={o.actif ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          <Ionicons name="pricetag-outline" size={11} /> {CATEGORIE_LABELS[o.categorie]}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          <Ionicons name="repeat-outline" size={11} /> {PERIODICITE_LABELS[o.periodicite]}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
          <Ionicons name="calendar-outline" size={11} /> {formatEcheance(o.echeanceRule)}
        </Text>
        {o.articleNumero && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
            <Ionicons name="book-outline" size={11} /> Art. {o.articleNumero}
          </Text>
        )}
        {o.simulateurCode && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.primary, fontWeight: fontWeights.semiBold }}>
            <Ionicons name="calculator-outline" size={11} /> {o.simulateurCode}
          </Text>
        )}
      </View>
    </View>
  );
}
