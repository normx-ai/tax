import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { PermissionItem, EffectivePermissions } from "@/lib/api/permissions";
import type { ThemeColors } from '@/lib/theme/colors';

const PERMISSION_KEYS: Record<string, string> = {
  "org.view": "permLabels.orgView",
  "org.edit": "permLabels.orgEdit",
  "org.delete": "permLabels.orgDelete",
  "org.members.view": "permLabels.membersView",
  "org.members.invite": "permLabels.membersInvite",
  "org.members.remove": "permLabels.membersRemove",
  "org.members.role": "permLabels.membersRole",
  "org.billing.view": "permLabels.billingView",
  "org.billing.manage": "permLabels.billingManage",
  "analytics.view": "permLabels.analyticsView",
  "analytics.export": "permLabels.analyticsExport",
  "audit.view": "permLabels.auditView",
  "chat.use": "permLabels.chatUse",
  "code.view": "permLabels.codeView",
  "simulator.use": "permLabels.simulatorUse",
};

interface PermissionTogglesProps {
  available: PermissionItem[];
  memberEffective: EffectivePermissions;
  selectedMemberId: string;
  isOwner: boolean;
  actionLoading: boolean;
  onToggle: (userId: string, permission: string, granted: boolean) => void;
  onReset: (userId: string) => void;
  colors: ThemeColors;
}

export default function PermissionToggles({
  available,
  memberEffective,
  selectedMemberId,
  isOwner,
  actionLoading,
  onToggle,
  onReset,
  colors,
}: PermissionTogglesProps) {
  const { t } = useTranslation();

  return (
    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
      {available.map((perm) => {
        const hasIt = memberEffective.effective.includes(perm.key);
        return (
          <View key={perm.key} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>
                {t(PERMISSION_KEYS[perm.key] || perm.key)}
              </Text>
            </View>
            <Switch
              value={hasIt}
              onValueChange={() => onToggle(selectedMemberId, perm.key, hasIt)}
              disabled={!isOwner || actionLoading}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={hasIt ? colors.primary : "#f4f3f4"}
            />
          </View>
        );
      })}

      {isOwner && (
        <TouchableOpacity
          onPress={() => onReset(selectedMemberId)}
          disabled={actionLoading}
          style={{ backgroundColor: colors.background, paddingVertical: 10, alignItems: "center", marginTop: 12 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="refresh-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>{t("permissions.reset")}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
