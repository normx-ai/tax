import React from "react";
import { View, Text } from "react-native";
import type { ThemeColors } from '@/lib/theme/colors';

interface AdminStatsGridProps {
  totalOrgs: number;
  activeCount: number;
  trialCount: number;
  expiredCount: number;
  colors: ThemeColors;
}

export default function AdminStatsGrid({ totalOrgs, activeCount, trialCount, expiredCount, colors }: AdminStatsGridProps) {
  const items = [
    { label: "Total", value: totalOrgs, color: colors.text, bg: colors.background },
    { label: "Actifs", value: activeCount, color: "#16a34a", bg: `${colors.card}` },
    { label: "Essai", value: trialCount, color: "#2563eb", bg: `${colors.card}` },
    { label: "Expirés", value: expiredCount, color: "#dc2626", bg: `${colors.card}` },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
      {items.map((s) => (
        <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: s.color }}>{s.value}</Text>
          <Text style={{ fontSize: 13, color: s.color, fontWeight: "500" }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
