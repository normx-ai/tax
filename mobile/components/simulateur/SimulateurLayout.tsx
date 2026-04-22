import { ReactNode, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SimulateurEmptyState from "./SimulateurEmptyState";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

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
      if (Platform.OS === "web") {
        alert("Erreur lors de l'export PDF");
      }
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.rowContainer, { flexDirection: isMobile ? "column" : "row" }]}>
        {/* SAISIE */}
        <ScrollView style={{ width: isMobile ? "100%" : "50%" }} contentContainerStyle={styles.scrollContent}>
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
            { width: isMobile ? "100%" : "50%" },
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
                  <Ionicons name="download-outline" size={18} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontSize: 14, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
                    {exporting ? "Export en cours..." : "Exporter en PDF"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : <SimulateurEmptyState message={emptyMessage} />}
        </ScrollView>
      </View>

      {/* Apercu PDF avant telechargement (web uniquement) */}
      {Platform.OS === "web" && (
        <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={handleClosePreview}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ backgroundColor: "#ffffff", width: "100%", maxWidth: 900, height: "90%", overflow: "hidden", flexDirection: "column" }}>
              {/* Header modal */}
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
              {/* Iframe PDF */}
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
