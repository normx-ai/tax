import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "@/lib/store/auth";
import {
  permissionsApi,
  type MyPermissions,
  type PermissionItem,
  type EffectivePermissions,
} from "@/lib/api/permissions";
import { organizationApi, type OrgMember } from "@/lib/api/organization";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/ToastProvider";
import MyPermissionsCard from "@/components/permissions/MyPermissionsCard";
import MemberSelector from "@/components/permissions/MemberSelector";
import PermissionToggles from "@/components/permissions/PermissionToggles";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { toast, confirm } = useToast();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.entreprise_id != null ? String(user.entreprise_id) : undefined;

  const [myPerms, setMyPerms] = useState<MyPermissions | null>(null);
  const [available, setAvailable] = useState<PermissionItem[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Gestion membre
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberEffective, setMemberEffective] = useState<EffectivePermissions | null>(null);

  const isOwner = myPerms?.role === "OWNER";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myData, availData] = await Promise.all([
        permissionsApi.getMyPermissions(),
        permissionsApi.getAvailable(),
      ]);
      setMyPerms(myData);
      setAvailable(availData);

      if (orgId && (myData.role === "OWNER" || myData.role === "ADMIN")) {
        const membersData = await organizationApi.getMembers(orgId);
        setMembers(membersData.filter((m) => m.userId !== String(user?.id)));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("security.unknownError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orgId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMemberPerms = useCallback(async (userId: string) => {
    try {
      const data = await permissionsApi.getMemberEffective(userId);
      setMemberEffective(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    }
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      loadMemberPerms(selectedMemberId);
    } else {
      setMemberEffective(null);
    }
  }, [selectedMemberId, loadMemberPerms]);

  const handleTogglePermission = async (userId: string, permission: string, currentlyGranted: boolean) => {
    setActionLoading(true);
    try {
      if (currentlyGranted) {
        await permissionsApi.revokePermission(userId, permission);
      } else {
        await permissionsApi.grantPermission(userId, permission);
      }
      await loadMemberPerms(userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async (userId: string) => {
    const ok = await confirm({
      title: t("permissions.reset"),
      message: t("permissions.resetConfirm"),
      confirmLabel: t("permissions.reset"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await permissionsApi.resetToDefaults(userId);
      await loadMemberPerms(userId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t("common.error");
      toast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16 }}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {error && (
          <View style={{ backgroundColor: `${colors.danger}15`, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>{error}</Text>
          </View>
        )}

        {myPerms && (
          <MyPermissionsCard myPerms={myPerms} available={available} colors={colors} />
        )}

        {members.length > 0 && (myPerms?.role === "OWNER" || myPerms?.role === "ADMIN") && (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
              {t("permissions.memberPermissions")}
            </Text>

            <MemberSelector
              members={members}
              selectedMemberId={selectedMemberId}
              onSelect={setSelectedMemberId}
              colors={colors}
            />

            {selectedMemberId && memberEffective && (
              <PermissionToggles
                available={available}
                memberEffective={memberEffective}
                selectedMemberId={selectedMemberId}
                isOwner={isOwner}
                actionLoading={actionLoading}
                onToggle={handleTogglePermission}
                onReset={handleReset}
                colors={colors}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
