import { ReactNode } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import SimulateurEmptyState from "./SimulateurEmptyState";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

interface SimulateurLayoutProps {
  title: string;
  subtitle?: string;
  description: string;
  legalRef?: string;
  emptyMessage: string;
  hasResult: boolean;
  inputSection: ReactNode;
  resultSection: ReactNode;
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
}: SimulateurLayoutProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();

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
          {hasResult ? resultSection : <SimulateurEmptyState message={emptyMessage} />}
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
