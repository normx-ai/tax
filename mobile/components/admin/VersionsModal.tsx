import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { obligationsApi, VersionStat } from "@/lib/api/obligations";

interface Props {
  versionActive: string;
  onClose: () => void;
  onSelectVersion: (version: string) => void;
}

export default function VersionsModal({ versionActive, onClose, onSelectVersion }: Props) {
  const { colors } = useTheme();
  const { toast, confirm } = useToast();
  const [versions, setVersions] = useState<VersionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);

  const load = () => {
    setLoading(true);
    obligationsApi.listVersions()
      .then(setVersions)
      .catch(err => toast(err instanceof Error ? err.message : "Erreur", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCloneToNext = async () => {
    if (versions.length === 0) {
      toast("Aucune version à cloner", "info");
      return;
    }
    const sourceVersion = versions[0].version;
    const targetVersion = String(parseInt(sourceVersion, 10) + 1);
    const ok = await confirm({
      title: `Cloner ${sourceVersion} vers ${targetVersion} ?`,
      message: `Toutes les obligations de ${sourceVersion} seront copiées dans la version ${targetVersion}. À utiliser quand la nouvelle loi de finances paraît.`,
      confirmLabel: "Cloner",
      cancelLabel: "Annuler",
    });
    if (!ok) return;
    setCloning(true);
    try {
      const r = await obligationsApi.clonerVersion(sourceVersion, targetVersion);
      toast(r.cloned > 0 ? `${r.cloned} obligations clonées vers ${targetVersion}` : r.message, r.cloned > 0 ? "success" : "info");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setCloning(false);
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
            Versions du catalogue
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            Une version par année fiscale (loi de finances)
          </Text>
        </View>
        <TouchableOpacity onPress={handleCloneToNext} disabled={cloning} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.primary, opacity: cloning ? 0.6 : 1 }}>
          {cloning ? <ActivityIndicator size="small" color="#0F2A42" /> : <Ionicons name="copy-outline" size={16} color="#0F2A42" />}
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, color: "#0F2A42", fontSize: 13 }}>
            Cloner
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : versions.length === 0 ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.regular, color: colors.text, fontWeight: fontWeights.semiBold, marginTop: 12 }}>
            Catalogue vide
          </Text>
          <Text style={{ fontFamily: fonts.regular, color: colors.textSecondary, textAlign: "center", marginTop: 6, fontSize: 13 }}>
            Créez votre première obligation pour générer une version.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
          {versions.map(v => {
            const isActive = v.version === versionActive;
            return (
              <TouchableOpacity
                key={v.version}
                onPress={() => onSelectVersion(v.version)}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: isActive ? colors.primary : colors.border,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    backgroundColor: isActive ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 18, color: isActive ? "#0F2A42" : colors.text }}>
                    {v.version}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.text }}>
                      Version {v.version}
                    </Text>
                    {isActive && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.primary }}>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 9, fontWeight: fontWeights.bold, color: "#0F2A42" }}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary }}>
                    {v.actifs} actives sur {v.total} obligations
                  </Text>
                  {v.derniereModif && (
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      Dernière modif. : {new Date(v.derniereModif).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </Text>
                  )}
                </View>
                {!isActive && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
