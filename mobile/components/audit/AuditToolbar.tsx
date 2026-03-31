import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from '@/lib/theme/colors';

interface AuditToolbarProps {
  isOwner: boolean;
  showCleanup: boolean;
  retentionDays: string;
  actionLoading: boolean;
  onToggleCleanup: () => void;
  onChangeRetentionDays: (v: string) => void;
  onCleanup: () => void;
  onCancelCleanup: () => void;
  onRefresh: () => void;
  colors: ThemeColors;
}

export default function AuditToolbar({
  isOwner,
  showCleanup,
  retentionDays,
  actionLoading,
  onToggleCleanup,
  onChangeRetentionDays,
  onCleanup,
  onCancelCleanup,
  onRefresh,
  colors,
}: AuditToolbarProps) {
  return (
    <>
      {/* Toolbar: refresh + cleanup */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: 12,
          gap: 8,
        }}
      >
        {isOwner && (
          <TouchableOpacity
            onPress={onToggleCleanup}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${colors.danger}15`,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#dc2626"
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: "#dc2626", fontSize: 15, fontWeight: "600" }}>
              Nettoyage RGPD
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onRefresh} style={{ padding: 8 }}>
          <Ionicons name="refresh-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Formulaire nettoyage RGPD */}
      {showCleanup && isOwner && (
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: `${colors.danger}50`,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#dc2626",
              marginBottom: 8,
            }}
          >
            Nettoyage RGPD
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              marginBottom: 12,
            }}
          >
            Supprimer les logs plus anciens que le nombre de jours
            spécifié.
          </Text>
          <TextInput
            value={retentionDays}
            onChangeText={onChangeRetentionDays}
            placeholder="365"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 17,
              color: colors.text,
              marginBottom: 12,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={onCancelCleanup}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCleanup}
              disabled={actionLoading}
              style={{
                flex: 1,
                backgroundColor: "#dc2626",
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
                >
                  Nettoyer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}
