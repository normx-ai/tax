import { ReactNode, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
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

  const handleExport = async () => {
    if (!exportData) return;
    setExporting(true);
    try {
      const { exportSimulatorPdf } = await import("@/lib/api/simulator-export");
      await exportSimulatorPdf(exportData);
    } catch {
      if (Platform.OS === "web") {
        alert("Erreur lors de l'export PDF");
      }
    } finally {
      setExporting(false);
    }
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
                    borderRadius: 10,
                    backgroundColor: exporting ? colors.border : "#0F2A42",
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
