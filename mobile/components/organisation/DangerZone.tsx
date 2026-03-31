import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from '@/lib/theme/colors';

interface DangerZoneProps {
  actionLoading: boolean;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  colors: ThemeColors;
}

export default function DangerZone({
  actionLoading,
  onDelete,
  onRestore,
  onPermanentDelete,
  colors,
}: DangerZoneProps) {
  return (
    <View
      style={{
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 20,
      }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginBottom: 12,
          marginLeft: 4,
        }}
      >
        ZONE DANGER
      </Text>
      <TouchableOpacity
        onPress={onDelete}
        disabled={actionLoading}
        style={{
          backgroundColor: "#fef2f2",
          paddingVertical: 14,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="trash-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
          <Text style={{ color: "#dc2626", fontWeight: "600", fontSize: 16 }}>
            Supprimer l'organisation
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onRestore}
        disabled={actionLoading}
        style={{
          backgroundColor: "#f0fdf4",
          paddingVertical: 14,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="refresh-outline" size={18} color="#16a34a" style={{ marginRight: 8 }} />
          <Text style={{ color: "#16a34a", fontWeight: "600", fontSize: 16 }}>
            Restaurer l'organisation
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onPermanentDelete}
        disabled={actionLoading}
        style={{
          backgroundColor: "#dc2626",
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="nuclear-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
            Supprimer d\u00e9finitivement
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
