import React from "react";
import { Text, TouchableOpacity, ScrollView } from "react-native";
import { ACTION_LABELS } from "./AuditStatsCards";
import type { ThemeColors } from '@/lib/theme/colors';

interface ActionFiltersProps {
  actions: string[];
  filterAction: string | null;
  onFilterChange: (action: string | null) => void;
  colors: ThemeColors;
}

export default function ActionFilters({
  actions,
  filterAction,
  onFilterChange,
  colors,
}: ActionFiltersProps) {
  if (actions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 16 }}
    >
      <TouchableOpacity
        onPress={() => onFilterChange(null)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 6,
          backgroundColor: !filterAction ? colors.primary : colors.border,
          marginRight: 8,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: !filterAction ? "#fff" : colors.text,
          }}
        >
          Toutes
        </Text>
      </TouchableOpacity>
      {actions.map((action) => (
        <TouchableOpacity
          key={action}
          onPress={() =>
            onFilterChange(filterAction === action ? null : action)
          }
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            backgroundColor:
              filterAction === action ? colors.primary : colors.border,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: filterAction === action ? "#fff" : colors.text,
            }}
          >
            {ACTION_LABELS[action] || action}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
