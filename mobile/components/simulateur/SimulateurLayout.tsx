import { ReactNode, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SimulateurEmptyState from "./SimulateurEmptyState";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useToast } from "@/components/ui/ToastProvider";

interface ExportLine {
  label: string;
  value: string;
  type?: "header" | "normal" | "result" | "total";
}

interface SimulateurLayoutProps {
  title: string;
  subtitle?: string;
  description: string;
  legalRef?: string;
  emptyMessage: string;
  hasResult: boolean;
  inputSection: ReactNode;
  resultSection: ReactNode;
  exportData?: {
    simulatorName: string;
    inputs: Record<string, string>;
    results: ExportLine[];
    reference?: string;
  };
}

/**
 * Layout partagé pour toutes les pages simulateur (D1).
 * Gère le responsive deux colonnes, le titre, la description et l'état vide.
 */
export default function SimulateurLayout({
  title,
  subtitle,
  description,
  legalRef,
  emptyMessage,
  hasResult,
  inputSection,
  resultSection,
  exportData,
}: SimulateurLayoutProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>("");

  const handleExport = async () => {
    if (!exportData) return;
    setExporting(true);
    try {
      const { fetchSimulatorPdf, downloadSimulatorPdf } = await import("@/lib/api/simulator-export");
      const { url, filename } = await fetchSimulatorPdf(exportData);
      if (Platform.OS === "web") {
        // Web : afficher l'apercu dans un modal avant telechargement
        setPreviewUrl(url);
        setPreviewFilename(filename);
      } else {
        // Mobile : share natif (l'OS gere l'apercu)
        await downloadSimulatorPdf(url, filename);
      }
    } catch {
      toast("Erreur lors de l'export PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleClosePreview = async () => {
    if (previewUrl) {
      const { releaseSimulatorPdf } = await import("@/lib/api/simulator-export");
      releaseSimulatorPdf(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFilename("");
  };

  const handleConfirmDownload = async () => {
    if (!previewUrl) return;
    const { downloadSimulatorPdf } = await import("@/lib/api/simulator-export");
    await downloadSimulatorPdf(previewUrl, previewFilename);
    await handleClosePreview();
  };

  // Desktop : 3 colonnes 20/40/40. Mobile : stack vertical + modale pour l'apercu.
  const threeColumns = !isMobile;
  const showPreviewColumn = threeColumns && Platform.OS === "web";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.rowContainer, { flexDirection: isMobile ? "column" : "row" }]}>
        {/* SAISIE */}
        <ScrollView
          style={{ width: isMobile ? "100%" : showPreviewColumn ? "20%" : "50%" }}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
          <View style={[styles.descriptionBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.descriptionText, { color: colors.text }]}>{description}</Text>
          </View>

          {inputSection}

          {legalRef && (
            <Text style={[styles.legalRef, { color: colors.textMuted }]}>{legalRef}</Text>
          )}
        </ScrollView>

        {/* RÉSULTATS */}
        <ScrollView
          style={[
            { width: isMobile ? "100%" : showPreviewColumn ? "40%" : "50%" },
            isMobile
              ? { borderTopWidth: 1, borderTopColor: colors.border }
              : { borderLeftWidth: 1, borderLeftColor: colors.border },
          ]}
          contentContainerStyle={styles.resultScrollContent}
        >
          {hasResult ? (
            <>
              {resultSection}
              {exportData && (
                <TouchableOpacity
                  onPress={handleExport}
                  disabled={exporting}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginHorizontal: 12,
                    marginTop: 16,
                    paddingVertical: 12,
                    backgroundColor: exporting ? colors.border : colors.headerBg,
                  }}
                >
                  <Ionicons name={showPreviewColumn ? "eye-outline" : "download-outline"} size={18} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontSize: 14, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
                    {exporting ? "Generation en cours..." : showPreviewColumn ? "Générer l'aperçu" : "Exporter en PDF"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : <SimulateurEmptyState message={emptyMessage} />}
        </ScrollView>

        {/* APERCU PDF (desktop web uniquement) */}
        {showPreviewColumn && (
          <View
            style={{
              width: "40%",
              borderLeftWidth: 1,
              borderLeftColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            {previewUrl ? (
              <View style={{ flex: 1, flexDirection: "column" }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: colors.text }}>Aperçu avant export</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity onPress={handleConfirmDownload} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.primary }}>
                      <Ionicons name="download-outline" size={14} color="#0F2A42" />
                      <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#0F2A42" }}>Télécharger</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClosePreview} style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.border }}>
                      <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: colors.text }}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* @ts-ignore iframe est valide sur web */}
                <iframe src={previewUrl} style={{ border: 0, width: "100%", flex: 1, minHeight: 0 }} title="Aperçu PDF" />
              </View>
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
                <Ionicons name="document-text-outline" size={44} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 10, fontFamily: fonts.regular }}>
                  {hasResult ? "Cliquez sur « Générer l'aperçu » pour visualiser le PDF avant export" : "L'aperçu du PDF apparaîtra ici après calcul et génération"}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Apercu PDF en modal (mobile web) */}
      {!showPreviewColumn && Platform.OS === "web" && (
        <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={handleClosePreview}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ backgroundColor: "#ffffff", width: "100%", maxWidth: 900, height: "90%", overflow: "hidden", flexDirection: "column" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#111827" }}>Aperçu du PDF</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={handleConfirmDownload} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primary }}>
                    <Ionicons name="download-outline" size={16} color="#0F2A42" />
                    <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#0F2A42" }}>Télécharger</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClosePreview} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#e5e7eb" }}>
                    <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: "#374151" }}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {previewUrl && (
                <View style={{ flex: 1 }}>
                  {/* @ts-ignore iframe est valide sur web */}
                  <iframe src={previewUrl} style={{ border: 0, width: "100%", height: "100%" }} title="Aperçu PDF" />
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  resultScrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: fontWeights.heading,
    fontFamily: fonts.heading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  descriptionBox: {
    marginBottom: 12,
    padding: 12,
  },
  descriptionText: {
    fontSize: 15,
  },
  legalRef: {
    fontSize: 14,
    marginTop: 12,
  },
});
