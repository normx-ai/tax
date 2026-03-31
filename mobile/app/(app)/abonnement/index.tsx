import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { subscriptionApi, type QuotaResponse } from "@/lib/api/subscription";
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/ToastProvider";
import PlanHeader, { PLAN_COLORS, STATUS_COLORS } from "@/components/abonnement/PlanHeader";
import QuotaProgress from "@/components/abonnement/QuotaProgress";
import PeriodInfo from "@/components/abonnement/PeriodInfo";
import PlansComparison from "@/components/abonnement/PlansComparison";
import SubscriptionActions from "@/components/abonnement/SubscriptionActions";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function AbonnementScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { toast, confirm } = useToast();
  const user = useAuthStore((s) => s.user);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.role === "OWNER";

  const loadQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionApi.getQuota();
      setQuota(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const errorMsg =
        axiosErr?.response?.data?.error || t("security.unknownError");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  const handleActivate = async (planName: string) => {
    const ok = await confirm({
      title: t("common.confirm"),
      message: `Activer le plan ${planName} ?`,
      confirmLabel: t("common.confirm"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await subscriptionApi.activate(planName);
      toast("Plan activé", "success");
      await loadQuota();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    const ok = await confirm({
      title: t("common.confirm"),
      message: t("abonnement.renewSubscription"),
      confirmLabel: t("common.confirm"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await subscriptionApi.renew();
      toast("Abonnement renouvelé", "success");
      await loadQuota();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const ok = await confirm({
      title: t("common.confirm"),
      message: t("abonnement.upgradeToPro"),
      confirmLabel: t("common.confirm"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await subscriptionApi.upgrade("PRO");
      toast("Plan mis à jour", "success");
      await loadQuota();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 12 }}>
          {t("abonnement.loadingSubscription")}
        </Text>
      </View>
    );
  }

  const plan = quota?.plan?.toUpperCase() || "FREE";
  const status = quota?.status?.toUpperCase() || "EXPIRED";
  const planColor = PLAN_COLORS[plan] || PLAN_COLORS.FREE;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.EXPIRED;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {error && (
          <View
            style={{
              backgroundColor: `${colors.danger}15`,
              padding: 12,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.danger, fontSize: 16, flex: 1 }}>{error}</Text>
            <TouchableOpacity onPress={loadQuota}>
              <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 15 }}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        )}

        <PlanHeader plan={plan} status={status} colors={colors} />

        <QuotaProgress
          creditsUsed={quota?.creditsUsed ?? 0}
          creditsLimit={quota?.creditsPerMonth ?? 0}
          remaining={quota?.remaining ?? 0}
          planColor={planColor}
          colors={colors}
        />

        <PeriodInfo
          status={status}
          statusColor={statusColor}
          currentPeriodStart={quota?.currentPeriodStart}
          currentPeriodEnd={quota?.currentPeriodEnd}
          colors={colors}
        />

        <PlansComparison currentPlan={plan} colors={colors} />

        {isOwner && (
          <SubscriptionActions
            plan={plan}
            status={status}
            actionLoading={actionLoading}
            onActivate={handleActivate}
            onRenew={handleRenew}
            onUpgrade={handleUpgrade}
            colors={colors}
          />
        )}

        {/* Footer CTA */}
        <View
          style={{
            backgroundColor: colors.card,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <Ionicons name="call-outline" size={28} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 4 }}>
            {t("abonnement.subscribeTitle")}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: "center", marginBottom: 12 }}>
            {t("abonnement.subscribeDesc")}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:facturation@normx-ai.com")}
            accessibilityLabel={t("abonnement.contactSubscribe")}
            accessibilityRole="button"
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>facturation@normx-ai.com</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>CGI242 v1.0.0 -- Edition 2026</Text>
          <Text style={{ fontSize: 13, color: colors.disabled, marginTop: 1 }}>NORMX AI</Text>
        </View>
      </ScrollView>
    </View>
  );
}
