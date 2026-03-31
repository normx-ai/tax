import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auditApi, type AuditLog, type AuditStats } from "@/lib/api/audit";
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";

import AuditToolbar from "@/components/audit/AuditToolbar";
import AuditStatsCards from "@/components/audit/AuditStatsCards";
import ActionFilters from "@/components/audit/ActionFilters";
import AuditLogItem from "@/components/audit/AuditLogItem";
import EntityHistoryModal from "@/components/audit/EntityHistoryModal";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useTranslation } from "react-i18next";

export default function AuditScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { toast, confirm } = useToast();
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "OWNER";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [entityHistory, setEntityHistory] = useState<AuditLog[] | null>(null);
  const [entityHistoryLoading, setEntityHistoryLoading] = useState(false);
  const [showEntityHistory, setShowEntityHistory] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [retentionDays, setRetentionDays] = useState("365");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  const [filterAction, setFilterAction] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, logsData] = await Promise.all([
        auditApi.getStats(),
        auditApi.getOrganizationLogs({ page, limit, action: filterAction || undefined }),
      ]);
      setStats(statsData);
      setLogs(logsData.logs);
      setTotalPages(logsData.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("audit.unknownError"));
    } finally {
      setLoading(false);
    }
  }, [page, filterAction]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEntityHistory = async (log: AuditLog) => {
    if (!log.entityType || !log.entityId) return;
    setEntityHistoryLoading(true);
    setShowEntityHistory(true);
    try {
      const result = await auditApi.getEntityHistory(log.entityType, log.entityId);
      setEntityHistory(result.logs);
    } catch (err) {
      toast(err instanceof Error ? err.message : t("common.error"), "error");
      setShowEntityHistory(false);
    } finally {
      setEntityHistoryLoading(false);
    }
  };

  const handleCleanup = async () => {
    const days = parseInt(retentionDays, 10);
    if (isNaN(days) || days < 1) {
      toast(t("audit.invalidDays"), "error");
      return;
    }

    const ok = await confirm({
      title: t("audit.cleanup"),
      message: t("audit.cleanupConfirmMessage", { days }),
      confirmLabel: t("audit.deleteBtn"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      const result = await auditApi.cleanup(days);
      toast(t("audit.logsDeleted", { count: result.deletedCount }), "success");
      setShowCleanup(false);
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("common.error"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (action: string | null) => { setFilterAction(action); setPage(1); };
  const actions = stats ? Object.keys(stats.actionCounts) : [];

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
        <AuditToolbar
          isOwner={isOwner}
          showCleanup={showCleanup}
          retentionDays={retentionDays}
          actionLoading={actionLoading}
          onToggleCleanup={() => setShowCleanup(!showCleanup)}
          onChangeRetentionDays={(v) => setRetentionDays(v.replace(/[^0-9]/g, ""))}
          onCleanup={handleCleanup}
          onCancelCleanup={() => setShowCleanup(false)}
          onRefresh={loadData}
          colors={colors}
        />
        {error && (
          <View style={{ backgroundColor: `${colors.danger}15`, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>{error}</Text>
          </View>
        )}
        {stats && <AuditStatsCards stats={stats} colors={colors} />}
        <ActionFilters actions={actions} filterAction={filterAction} onFilterChange={handleFilterChange} colors={colors} />
        {logs.map((log) => (
          <AuditLogItem
            key={log.id}
            log={log}
            isExpanded={expandedId === log.id}
            onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            onViewEntityHistory={handleEntityHistory}
            colors={colors}
          />
        ))}
        {logs.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="document-text-outline" size={40} color={colors.disabled} />
            <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 16 }}>{t("audit.noLogs")}</Text>
          </View>
        )}
        {totalPages > 1 && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16, gap: 12 }}>
            <TouchableOpacity onPress={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: page === 1 ? colors.border : colors.primary }}>
              <Text style={{ color: page === 1 ? colors.textMuted : "#fff", fontWeight: "600", fontSize: 15 }}>{t("audit.previous")}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>{t("audit.pageOf", { page, total: totalPages })}</Text>
            <TouchableOpacity onPress={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: page === totalPages ? colors.border : colors.primary }}>
              <Text style={{ color: page === totalPages ? colors.textMuted : "#fff", fontWeight: "600", fontSize: 15 }}>{t("audit.next")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <EntityHistoryModal
        visible={showEntityHistory}
        loading={entityHistoryLoading}
        history={entityHistory}
        onClose={() => { setShowEntityHistory(false); setEntityHistory(null); }}
        colors={colors}
      />
    </View>
  );
}
