import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type AuditLog } from "@/lib/api/audit";
import { ACTION_ICONS, ACTION_LABELS, formatTimestamp } from "./AuditLogItem";
import type { ThemeColors } from '@/lib/theme/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface EntityHistoryModalProps {
  visible: boolean;
  loading: boolean;
  history: AuditLog[] | null;
  onClose: () => void;
  colors: ThemeColors;
}

export default function EntityHistoryModal({
  visible,
  loading,
  history,
  onClose,
  colors,
}: EntityHistoryModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "80%",
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "700", color: colors.text }}
            >
              Historique de l'entité
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: 40 }}
            />
          ) : (
            <ScrollView style={{ maxHeight: 500 }}>
              {history && history.length > 0 ? (
                history.map((log) => {
                  const actionInfo = ACTION_ICONS[log.action] || {
                    icon: "ellipse-outline" as IoniconsName,
                    color: colors.textMuted,
                  };
                  return (
                    <View
                      key={log.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: `${actionInfo.color}15`,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name={actionInfo.icon}
                          size={16}
                          color={actionInfo.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: colors.text,
                          }}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </Text>
                        <Text
                          style={{ fontSize: 13, color: colors.textMuted }}
                        >
                          {log.actorEmail} — {formatTimestamp(log.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    paddingVertical: 20,
                  }}
                >
                  Aucun historique
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
