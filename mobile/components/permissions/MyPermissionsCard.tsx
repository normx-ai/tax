import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { MyPermissions, PermissionItem } from "@/lib/api/permissions";
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

const ROLE_KEYS: Record<string, string> = {
  OWNER: "permLabels.roleOwner",
  ADMIN: "permLabels.roleAdmin",
  MEMBER: "permLabels.roleMember",
  VIEWER: "permLabels.roleViewer",
};

export const ROLE_COLORS: Record<string, string> = {
  OWNER: "#8b5cf6",
  ADMIN: "#3b82f6",
  MEMBER: "#16a34a",
  VIEWER: "#6b7280",
};

interface MyPermissionsCardProps {
  myPerms: MyPermissions;
  available: PermissionItem[];
  colors: ThemeColors;
}

export default function MyPermissionsCard({ myPerms, available, colors }: MyPermissionsCardProps) {
  const { t } = useTranslation();

  return (
    <>
      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
        {t("permissions.memberPermissions")}
      </Text>
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <Ionicons name="person-circle-outline" size={24} color={colors.text} style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text, flex: 1 }}>{t("permLabels.myRole")}</Text>
          <View style={{ backgroundColor: `${ROLE_COLORS[myPerms.role] || "#6b7280"}20`, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: ROLE_COLORS[myPerms.role] || "#6b7280" }}>
              {t(ROLE_KEYS[myPerms.role] || myPerms.role)}
            </Text>
          </View>
        </View>
        {available.map((perm) => {
          const perms = Array.isArray(myPerms.permissions) ? myPerms.permissions : [];
          const hasIt = perms.includes(perm.key);
          return (
            <View key={perm.key} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
              <Ionicons name={hasIt ? "checkmark-circle" : "close-circle"} size={18} color={hasIt ? "#16a34a" : "#dc2626"} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>{t(PERMISSION_KEYS[perm.key] || perm.key)}</Text>
            </View>
          );
        })}
      </View>
    </>
  );
}
