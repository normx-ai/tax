import React from "react";
import { View, Text } from "react-native";
import { type AuditStats } from "@/lib/api/audit";
import type { ThemeColors } from '@/lib/theme/colors';

export const ACTION_LABELS: Record<string, string> = {
  CREATE: "Cr\u00e9ation",
  UPDATE: "Modification",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  LOGOUT: "D\u00e9connexion",
  INVITE: "Invitation",
  EXPORT: "Export",
  GRANT: "Attribution",
  REVOKE: "R\u00e9vocation",
};

interface AuditStatsCardsProps {
  stats: AuditStats;
  colors: ThemeColors;
}

export default function AuditStatsCards({
  stats,
  colors,
}: AuditStatsCardsProps) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          padding: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#3b82f6" }}>
          {stats.totalLogs}
        </Text>
        <Text style={{ fontSize: 13, color: "#3b82f6", fontWeight: "500" }}>
          Total
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          padding: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#8b5cf6" }}>
          {stats.uniqueActors}
        </Text>
        <Text style={{ fontSize: 13, color: "#8b5cf6", fontWeight: "500" }}>
          Acteurs
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          padding: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#16a34a" }}>
          {ACTION_LABELS[stats.mostFrequentAction] || stats.mostFrequentAction}
        </Text>
        <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500" }}>
          Action principale
        </Text>
      </View>
    </View>
  );
}
