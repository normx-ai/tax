import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type AuditLog } from "@/lib/api/audit";
import type { ThemeColors } from '@/lib/theme/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

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

export const ACTION_ICONS: Record<
  string,
  { icon: IoniconsName; color: string }
> = {
  CREATE: { icon: "add-circle-outline", color: "#16a34a" },
  UPDATE: { icon: "create-outline", color: "#3b82f6" },
  DELETE: { icon: "trash-outline", color: "#dc2626" },
  LOGIN: { icon: "log-in-outline", color: "#8b5cf6" },
  LOGOUT: { icon: "log-out-outline", color: "#6b7280" },
  INVITE: { icon: "mail-outline", color: "#d97706" },
  EXPORT: { icon: "download-outline", color: "#0891b2" },
  GRANT: { icon: "key-outline", color: "#16a34a" },
  REVOKE: { icon: "close-circle-outline", color: "#dc2626" },
};

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AuditLogItemProps {
  log: AuditLog;
  isExpanded: boolean;
  onToggle: () => void;
  onViewEntityHistory: (log: AuditLog) => void;
  colors: ThemeColors;
}

export default function AuditLogItem({
  log,
  isExpanded,
  onToggle,
  onViewEntityHistory,
  colors,
}: AuditLogItemProps) {
  const actionInfo = ACTION_ICONS[log.action] || {
    icon: "ellipse-outline" as IoniconsName,
    color: colors.textMuted,
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: `${actionInfo.color}15`,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={actionInfo.icon} size={18} color={actionInfo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: colors.text }}
            >
              {ACTION_LABELS[log.action] || log.action}
            </Text>
            <View
              style={{
                backgroundColor: colors.background,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.textSecondary,
                }}
              >
                {log.entityType}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>
            {log.actorEmail}
          </Text>
          <Text style={{ fontSize: 13, color: colors.disabled }}>
            {formatTimestamp(log.createdAt)}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textMuted}
        />
      </View>

      {isExpanded && (
        <View style={{ marginTop: 10 }}>
          {log.changes && (
            <View
              style={{
                backgroundColor: colors.background,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                Changements :
              </Text>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === "ios" ? "Menlo" : "monospace",
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                {JSON.stringify(log.changes, null, 2)}
              </Text>
            </View>
          )}
          {log.entityType && log.entityId && (
            <TouchableOpacity
              onPress={() => onViewEntityHistory(log)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
              }}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
                Historique complet de cette entité
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
