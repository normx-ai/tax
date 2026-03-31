import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  analyticsApi,
  type DashboardData,
  type TimeSeriesPoint,
  type MemberStat,
  type PopularSearch,
  type ResponseTimeStats,
  type FeatureUsage,
} from "@/lib/api/analytics";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/ToastProvider";
import PeriodSelector from "@/components/analytics/PeriodSelector";
import MemberStatsTable from "@/components/analytics/MemberStatsTable";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStat[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [responseTimes, setResponseTimes] = useState<ResponseTimeStats | null>(null);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, tsData, msData, psData, rtData, fuData] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getTimeSeries(days),
        analyticsApi.getMemberStats(),
        analyticsApi.getPopularSearches(10).catch(() => []),
        analyticsApi.getResponseTimes().catch(() => null),
        analyticsApi.getFeatureUsage().catch(() => null),
      ]);
      setDashboard(dashData);
      setTimeSeries(tsData);
      setMemberStats(msData);
      setPopularSearches(psData);
      setResponseTimes(rtData);
      setFeatureUsage(fuData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("security.unknownError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await analyticsApi.exportCsv(days);
      toast(t("security.exportSuccess"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("security.exportError");
      toast(msg, "error");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const maxCount = timeSeries.length > 0 ? Math.max(...timeSeries.map((p) => p.count), 1) : 1;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16 }}>{t("common.loading")}</Text>
      </View>
    );
  }

  const statCards: { label: string; value: string | number; icon: IoniconsName; color: string }[] = dashboard
    ? [
        { label: t("analytics.totalQuestions"), value: dashboard.totalQuestions, icon: "chatbubble-ellipses-outline", color: "#3b82f6" },
        { label: t("analytics.trend"), value: `${dashboard.trend > 0 ? "+" : ""}${dashboard.trend}%`, icon: "trending-up-outline", color: dashboard.trend >= 0 ? "#16a34a" : "#dc2626" },
        { label: t("analytics.activeMembers"), value: `${dashboard.activeMembers}/${dashboard.totalMembers}`, icon: "people-outline", color: "#8b5cf6" },
        { label: t("analytics.thisMonth"), value: dashboard.questionsThisMonth, icon: "calendar-outline", color: "#d97706" },
      ]
    : [];

  // Usage par fonctionnalité — barre de répartition
  const featureTotal = featureUsage ? featureUsage.chat + featureUsage.search + featureUsage.audit : 0;
  const featureBars = featureUsage && featureTotal > 0
    ? [
        { label: t("analytics.featureChat"), count: featureUsage.chat, pct: Math.round((featureUsage.chat / featureTotal) * 100), color: "#3b82f6", icon: "chatbubble-ellipses" as IoniconsName },
        { label: t("analytics.featureSearch"), count: featureUsage.search, pct: Math.round((featureUsage.search / featureTotal) * 100), color: "#8b5cf6", icon: "search" as IoniconsName },
        { label: t("analytics.featureAudit"), count: featureUsage.audit, pct: Math.round((featureUsage.audit / featureTotal) * 100), color: "#d97706", icon: "document-text" as IoniconsName },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Toolbar: period selector + refresh */}
        <PeriodSelector days={days} onChangeDays={setDays} onRefresh={loadData} colors={colors} />

        {error && (
          <View style={{ backgroundColor: `${colors.danger}15`, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>{error}</Text>
          </View>
        )}

        {/* Stats cards 2x2 */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {statCards.map((card) => (
            <View
              key={card.label}
              style={{
                width: "48%",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
              }}
            >
              <View style={{ width: 36, height: 36, backgroundColor: `${card.color}15`, justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
                <Ionicons name={card.icon} size={18} color={card.color} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{card.value}</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Temps de réponse IA */}
        {responseTimes && responseTimes.totalResponses > 0 && (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
              {t("analytics.responseTimeTitle")}
            </Text>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20, flexDirection: "row", justifyContent: "space-around" }}>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="timer-outline" size={20} color="#3b82f6" />
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 }}>
                  {(responseTimes.avgResponseTimeMs / 1000).toFixed(1)}s
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("analytics.avgTime")}</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="flash-outline" size={20} color="#16a34a" />
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 }}>
                  {(responseTimes.minResponseTimeMs / 1000).toFixed(1)}s
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("analytics.minTime")}</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="code-working-outline" size={20} color="#d97706" />
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 }}>
                  {responseTimes.avgTokensPerResponse}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("analytics.avgTokens")}</Text>
              </View>
            </View>
          </>
        )}

        {/* Usage par fonctionnalité */}
        {featureBars.length > 0 && (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
              {t("analytics.featureUsageTitle")}
            </Text>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 }}>
              {/* Barre de répartition */}
              <View style={{ flexDirection: "row", height: 24, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                {featureBars.map((f) => (
                  <View key={f.label} style={{ width: `${f.pct}%` as `${number}%`, backgroundColor: f.color, minWidth: f.pct > 0 ? 2 : 0 }} />
                ))}
              </View>
              {/* Légende */}
              {featureBars.map((f) => (
                <View key={f.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: f.color, marginRight: 8 }} />
                  <Ionicons name={f.icon} size={14} color={f.color} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>{f.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{f.count}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>({f.pct}%)</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Time series */}
        {timeSeries.length > 0 && (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
              {t("analytics.activityDays", { days })}
            </Text>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 }}>
              {timeSeries.slice(-14).map((point) => {
                const widthPercent = Math.max((point.count / maxCount) * 100, 2);
                return (
                  <View key={point.date} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 50 }}>{formatDate(point.date)}</Text>
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <View
                        style={{
                          height: 16,
                          width: `${widthPercent}%` as `${number}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, width: 30, textAlign: "right" }}>{point.count}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Recherches populaires */}
        {popularSearches.length > 0 && (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
              {t("analytics.popularSearches")}
            </Text>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 }}>
              {popularSearches.map((s, i) => (
                <View key={s.query} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottomWidth: i < popularSearches.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ width: 24, height: 24, backgroundColor: `${colors.primary}15`, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.text, flex: 1 }} numberOfLines={1}>{s.query}</Text>
                  <View style={{ backgroundColor: `${colors.primary}15`, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>{s.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Stats membres */}
        <MemberStatsTable memberStats={memberStats} formatDate={formatDate} colors={colors} />

        {/* Export CSV */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          style={{ backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center" }}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>{t("analytics.exportCsv")}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
