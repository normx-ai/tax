import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { analyzeDocument, getAuditHistory, getAuditDetail, DOC_TYPE_LABELS, ALL_AXES, AXE_LABELS, type AuditFactureResult, type AuditHistoryItem, type DocumentType, type AuditAxe } from "@/lib/api/audit-facture";

type FileInfo = { name: string; size: number; blob: Blob };
const DOC_TYPES: DocumentType[] = ["facture", "contrat"];

export default function AuditFacturePage() {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const [docType, setDocType] = useState<DocumentType>("facture");
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditFactureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  // Axes actifs : tous par defaut (audit complet). L'utilisateur peut en
  // desactiver pour ne verifier qu'un sous-ensemble.
  const [selectedAxes, setSelectedAxes] = useState<Set<AuditAxe>>(() => new Set(ALL_AXES));
  const [lastAxes, setLastAxes] = useState<Set<AuditAxe>>(() => new Set(ALL_AXES));
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const toggleAxe = (a: AuditAxe) => {
    setSelectedAxes((prev) => {
      const next = new Set(prev);
      if (next.has(a)) {
        if (next.size > 1) next.delete(a); // garde au moins 1 axe
      } else {
        next.add(a);
      }
      return next;
    });
    setResult(null);
    setError(null);
  };
  const selectAllAxes = () => {
    setSelectedAxes(new Set(ALL_AXES));
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    getAuditHistory().then(setHistory).catch(() => {});
  }, [result]);

  const pickFile = async () => {
    if (Platform.OS === "web") {
      inputRef.current?.click();
    } else {
      try {
        const DocumentPicker = await import("expo-document-picker");
        const res = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/jpeg", "image/png"],
          copyToCacheDirectory: true,
        });
        if (!res.canceled && res.assets?.[0]) {
          const asset = res.assets[0];
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          setFile({ name: asset.name, size: asset.size || 0, blob });
          setResult(null);
          setError(null);
        }
      } catch {
        setError("Erreur lors de la selection du fichier");
      }
    }
  };

  const handleWebFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile({ name: f.name, size: f.size, blob: f });
      setResult(null);
      setError(null);
    }
  };

  const resetAudit = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setFile(null);
    setResult(null);
    setError(null);
    setLoading(false);
    setSelectedAxes(new Set(ALL_AXES));
    setLastAxes(new Set(ALL_AXES));
    if (inputRef.current) inputRef.current.value = "";
  };

  const cancelAnalyze = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setError("Analyse annulee");
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const axes = Array.from(selectedAxes);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await analyzeDocument(file.blob, file.name, docType, axes, controller.signal);
      setResult(res);
      setLastAxes(new Set(axes));
    } catch (err) {
      const e = err as { code?: string; name?: string; response?: { data?: { error?: string } } };
      const aborted = e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError";
      if (!aborted) {
        setError(e?.response?.data?.error || "Erreur lors de l'analyse");
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const scoreColor = (found: number, total: number) => {
    const pct = found / total;
    if (pct >= 0.85) return colors.success;
    if (pct >= 0.6) return colors.warning;
    return colors.danger;
  };

  const uploadColumn = (
    <View style={{ gap: 12 }}>
      {/* Selecteur type de document + actions (annuler / nouvelle analyse) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {DOC_TYPES.map((dt) => (
          <TouchableOpacity
            key={dt}
            onPress={() => { setDocType(dt); setResult(null); setError(null); }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: docType === dt ? colors.headerBg : colors.card,
              borderWidth: 1,
              borderColor: docType === dt ? colors.headerBg : colors.border,
            }}
          >
            <Text style={{
              fontFamily: fonts.medium,
              fontWeight: fontWeights.medium,
              fontSize: 12,
              color: docType === dt ? "#fff" : colors.text,
            }}>
              {DOC_TYPE_LABELS[dt]}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        {loading && (
          <TouchableOpacity
            onPress={cancelAnalyze}
            accessibilityLabel="Arreter l'analyse"
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderWidth: 1,
              borderColor: colors.danger,
              backgroundColor: `${colors.danger}10`,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="stop-circle-outline" size={16} color={colors.danger} />
            <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 12, color: colors.danger }}>
              Arreter
            </Text>
          </TouchableOpacity>
        )}
        {(file || result) && !loading && (
          <TouchableOpacity
            onPress={resetAudit}
            accessibilityLabel="Nouvelle analyse"
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.text} />
            <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 12, color: colors.text }}>
              Nouvelle analyse
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload */}
      <TouchableOpacity
        onPress={pickFile}
        style={{
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: file ? colors.success : colors.border,
          padding: 24,
          alignItems: "center",
          backgroundColor: file ? `${colors.success}08` : colors.card,
        }}
      >
        <Ionicons name={file ? "document-text" : "cloud-upload-outline"} size={32} color={file ? colors.success : colors.textMuted} />
        {file ? (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.text }}>{file.name}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} Ko</Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 14, color: colors.text }}>
              Selectionnez un document
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              PDF, JPEG ou PNG — 10 Mo max
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {Platform.OS === "web" && (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={handleWebFile as React.ChangeEventHandler<HTMLInputElement>}
          style={{ display: "none" }}
        />
      )}

      {/* Axes a auditer */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Axes a auditer
          </Text>
          {selectedAxes.size < ALL_AXES.length && (
            <TouchableOpacity onPress={selectAllAxes} hitSlop={6}>
              <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 11, color: colors.primary }}>Tout cocher</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {ALL_AXES.map((a) => {
            const active = selectedAxes.has(a);
            return (
              <TouchableOpacity
                key={a}
                onPress={() => toggleAxe(a)}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  backgroundColor: active ? colors.headerBg : colors.card,
                  borderWidth: 1,
                  borderColor: active ? colors.headerBg : colors.border,
                }}
              >
                <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 11, color: active ? "#fff" : colors.textSecondary }}>
                  {AXE_LABELS[a]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bouton analyser */}
      <TouchableOpacity
        onPress={handleAnalyze}
        disabled={!file || loading}
        style={{
          backgroundColor: file && !loading ? colors.headerBg : colors.disabled,
          paddingVertical: 10,
          alignItems: "center",
        }}
      >
        {loading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: "#fff" }}>
              Analyse en cours...
            </Text>
          </View>
        ) : (
          <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: "#fff" }}>
            {selectedAxes.size === ALL_AXES.length ? "Analyser le document" : `Analyser (${selectedAxes.size} axe${selectedAxes.size > 1 ? "s" : ""})`}
          </Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={{ backgroundColor: `${colors.danger}15`, padding: 12 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.danger }}>{error}</Text>
        </View>
      )}
    </View>
  );

  const resultsColumn = (() => {
    if (loading) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, minHeight: 320 }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>
            Analyse en cours...
          </Text>
        </View>
      );
    }
    if (!result) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, minHeight: 320 }}>
          <Ionicons name="document-text-outline" size={48} color={colors.primary} />
          <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15, color: colors.text, marginTop: 12 }}>
            En attente d'analyse
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
            Chargez un document puis lancez l'analyse pour voir les resultats ici.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 12 }}>
        {/* Score : seulement si l'axe mentions a ete audite (le score compte les mentions) */}
        {lastAxes.has("mentions") && result.score.total > 0 && (
        <View style={{ backgroundColor: colors.card, padding: 20, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 36, color: scoreColor(result.score.found, result.score.total) }}>
            {result.score.found}/{result.score.total}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            mentions obligatoires detectees
          </Text>
        </View>
        )}

        {/* Langue */}
        {lastAxes.has("langue") && (
        <View style={{ backgroundColor: colors.card, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Ionicons name={result.langue.conforme ? "checkmark-circle" : "close-circle"} size={18} color={result.langue.conforme ? colors.success : colors.danger} />
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.text }}>Langue</Text>
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary }}>{result.langue.details}</Text>
        </View>
        )}

        {/* TVA */}
        {lastAxes.has("tva") && (
        <View style={{ backgroundColor: colors.card, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Ionicons name={result.tva.conforme ? "checkmark-circle" : "alert-circle"} size={18} color={result.tva.conforme ? colors.success : colors.warning} />
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.text }}>Taux TVA</Text>
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary }}>{result.tva.details}</Text>
          {result.tva.tauxApplique && (
            <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 12, color: colors.text, marginTop: 4 }}>
              Applique : {result.tva.tauxApplique} {result.tva.tauxAttendu ? `| Attendu : ${result.tva.tauxAttendu}` : ""}
            </Text>
          )}
        </View>
        )}

        {/* Mentions */}
        {lastAxes.has("mentions") && result.mentions.length > 0 && (
        <View style={{ backgroundColor: colors.card, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.text, marginBottom: 10 }}>
            Mentions obligatoires (Art. 32)
          </Text>
          {result.mentions.map((m, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}>
              <Ionicons name={m.present ? "checkmark-circle" : "close-circle"} size={16} color={m.present ? colors.success : colors.danger} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 13, color: colors.text }}>{m.nom}</Text>
                {m.valeur && (
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>{m.valeur}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
        )}

        {/* Risques */}
        {lastAxes.has("risques") && result.risques.length > 0 && (
          <View style={{ backgroundColor: `${colors.danger}08`, padding: 16, borderWidth: 1, borderColor: `${colors.danger}30` }}>
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.danger, marginBottom: 10 }}>
              Risques identifies
            </Text>
            {result.risques.map((r, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                <Ionicons name="warning" size={14} color={colors.danger} style={{ marginRight: 6, marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.text }}>{r.description}</Text>
                  {r.montant && <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 12, color: colors.danger, marginTop: 1 }}>{r.montant}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recommandations */}
        {lastAxes.has("recommandations") && result.recommandations.length > 0 && (
          <View style={{ backgroundColor: colors.card, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 14, color: colors.text, marginBottom: 10 }}>
              Recommandations
            </Text>
            {result.recommandations.map((r, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                <Ionicons name="bulb-outline" size={14} color={colors.primary} style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, flex: 1 }}>{r}</Text>
              </View>
            ))}
          </View>
        )}

      </View>
    );
  })();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: isMobile ? 14 : 20 }}>
        {/* Header */}
        <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 20, color: colors.text, marginBottom: 4 }}>
          Audit Documents
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
          Analysez la conformite de vos documents au CGI 2026
        </Text>

        {/* Layout 2 colonnes (desktop) / stack (mobile) */}
        {isMobile ? (
          <View style={{ gap: 20 }}>
            {uploadColumn}
            {resultsColumn}
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 20, alignItems: "flex-start" }}>
            <View style={{ flex: 0.4 }}>{uploadColumn}</View>
            <View style={{ flex: 0.6 }}>{resultsColumn}</View>
          </View>
        )}

        {/* Historique */}
        {history.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15, color: colors.text, marginBottom: 10 }}>
              Historique des audits
            </Text>
            {history.map((h) => (
              <TouchableOpacity
                key={h.id}
                onPress={async () => {
                  try {
                    const detail = await getAuditDetail(h.id);
                    setResult(detail);
                  } catch {}
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.card,
                  padding: 12,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name={h.conforme ? "checkmark-circle" : "alert-circle"}
                  size={18}
                  color={h.conforme ? colors.success : colors.warning}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 13, color: colors.text }} numberOfLines={2}>
                    {h.fileName}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                    {DOC_TYPE_LABELS[h.docType] || h.docType} — {new Date(h.createdAt).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 13, color: h.conforme ? colors.success : colors.warning }}>
                  {h.score}/{h.total}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
