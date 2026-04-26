import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { adminApi, AdminOrganization, AdminSeatRequest } from "@/lib/api/admin";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/ToastProvider";
import AdminStatsGrid from "@/components/admin/AdminStatsGrid";
import OrganisationCard from "@/components/admin/OrganisationCard";
import SeatRequestsList from "@/components/admin/SeatRequestsList";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function AdminScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { toast, confirm } = useToast();
  const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seatsInput, setSeatsInput] = useState<Record<string, string>>({});
  const [seatRequests, setSeatRequests] = useState<AdminSeatRequest[]>([]);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, requests] = await Promise.all([
        adminApi.getOrganizations(),
        adminApi.getSeatRequests(),
      ]);
      setOrgs(data);
      setSeatRequests(requests);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("security.unknownError");
      if (msg.includes("403") || msg.includes("refuse")) {
        setError(t("admin.accessDenied"));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  const handleActivate = async (org: AdminOrganization, plan: "STARTER" | "PROFESSIONAL" | "TEAM" | "ENTERPRISE") => {
    const seats = parseInt(seatsInput[org.id] || "", 10);
    if (!seats || seats < 1) {
      toast(t("admin.enterSeats"), "error");
      return;
    }
    if (seats < org.memberCount) {
      toast(t("admin.seatsLessThanMembers"), "error");
      return;
    }
    const n = seats;
    const basePrices: Record<string, number> = { STARTER: 69, PROFESSIONAL: 149, TEAM: 299, ENTERPRISE: 500 };
    const base = basePrices[plan] || 299;
    const discount = n >= 10 ? 0.20 : n >= 5 ? 0.15 : n >= 3 ? 0.10 : 0;
    const unitPrice = Math.round(base * (1 - discount));
    const totalPrice = unitPrice * n;
    const confirmMsg = `${n} ${t("admin.seats")} x ${unitPrice}€ = ${totalPrice}€/an`;

    const ok = await confirm({
      title: `${t("admin.confirmActivation")} ${plan} — "${org.name}" ?`,
      message: confirmMsg,
      confirmLabel: t("security.activate"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    doActivate(org.id, plan, n);
  };

  const doActivate = async (orgId: string, plan: "STARTER" | "PROFESSIONAL" | "TEAM" | "ENTERPRISE", paidSeats: number) => {
    setActionLoading(orgId);
    try {
      await adminApi.activateSubscription(orgId, plan, paidSeats);
      toast(t("security.activate") + " — OK", "success");
      await loadOrgs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async (org: AdminOrganization) => {
    const ok = await confirm({
      title: t("admin.confirmRenewal"),
      message: `Renouveler l'abonnement de "${org.name}" pour 1 an ?`,
      confirmLabel: t("admin.renew"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    doRenew(org.id);
  };

  const doRenew = async (orgId: string) => {
    setActionLoading(orgId);
    try {
      await adminApi.renewSubscription(orgId);
      toast("Abonnement renouvelé", "success");
      await loadOrgs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveSeatRequest = async (req: AdminSeatRequest) => {
    const ok = await confirm({
      title: t("seatRequest.approveTitle"),
      message: `${t("seatRequest.approveConfirm", { seats: req.additionalSeats, org: req.organization.name, price: req.totalPrice.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") })}`,
      confirmLabel: t("seatRequest.approve"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;
    setActionLoading(req.id);
    try {
      await adminApi.approveSeatRequest(req.id);
      toast(t("seatRequest.approved"), "success");
      await loadOrgs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSeatRequest = async (req: AdminSeatRequest) => {
    const ok = await confirm({
      title: t("seatRequest.rejectTitle"),
      message: t("seatRequest.rejectConfirm", { seats: req.additionalSeats, org: req.organization.name }),
      confirmLabel: t("seatRequest.reject"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(req.id);
    try {
      await adminApi.rejectSeatRequest(req.id, rejectNotes[req.id]);
      toast(t("seatRequest.rejected"), "success");
      setRejectNotes((prev) => { const next = { ...prev }; delete next[req.id]; return next; });
      await loadOrgs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const totalOrgs = orgs.length;
  const activeCount = orgs.filter(o => o.subscription?.status === "ACTIVE").length;
  const trialCount = orgs.filter(o => o.subscription?.status === "TRIALING").length;
  const expiredCount = orgs.filter(o => o.subscription?.status === "EXPIRED").length;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16 }}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 24 }}>
        <Ionicons name="shield-outline" size={48} color={colors.danger} />
        <Text style={{ marginTop: 12, color: colors.danger, fontSize: 18, fontWeight: "600", textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.primary }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <AdminStatsGrid
          totalOrgs={totalOrgs}
          activeCount={activeCount}
          trialCount={trialCount}
          expiredCount={expiredCount}
          colors={colors}
        />

        {/* Acces rapide aux outils admin */}
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 13, color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Outils administrateur
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <AdminToolCard
            icon="document-text-outline"
            title="Catalogue obligations"
            subtitle="Gérer les obligations fiscales (ITS, TVA, IS, MP, CFPB, patente…)"
            onPress={() => router.push("/admin/obligations" as never)}
            colors={colors}
          />
          <AdminToolCard
            icon="bar-chart-outline"
            title="Analytics"
            subtitle="Statistiques d'usage de la plateforme"
            onPress={() => router.push("/analytics" as never)}
            colors={colors}
          />
          <AdminToolCard
            icon="document-attach-outline"
            title="Audit logs"
            subtitle="Journal des actions sensibles"
            onPress={() => router.push("/audit" as never)}
            colors={colors}
          />
          <AdminToolCard
            icon="key-outline"
            title="Permissions"
            subtitle="Rôles et droits d'accès des utilisateurs"
            onPress={() => router.push("/permissions" as never)}
            colors={colors}
          />
        </View>

        {/* Demandes de sièges en attente */}
        <SeatRequestsList
          seatRequests={seatRequests}
          actionLoading={actionLoading}
          rejectNotes={rejectNotes}
          onRejectNoteChange={(id, note) => setRejectNotes((prev) => ({ ...prev, [id]: note }))}
          onApprove={handleApproveSeatRequest}
          onReject={handleRejectSeatRequest}
          colors={colors}
        />

        {orgs.map(org => (
          <OrganisationCard
            key={org.id}
            org={org}
            actionLoading={actionLoading}
            seatsValue={seatsInput[org.id] || ""}
            onSeatsChange={(v) => setSeatsInput(prev => ({ ...prev, [org.id]: v }))}
            onActivate={handleActivate}
            onRenew={handleRenew}
            colors={colors}
          />
        ))}

        {orgs.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="business-outline" size={40} color={colors.disabled} />
            <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 16 }}>{t("admin.noOrganizations")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface AdminToolCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function AdminToolCard({ icon, title, subtitle, onPress, colors }: AdminToolCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, minWidth: 240, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View style={{ width: 44, height: 44, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={22} color="#0F2A42" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.bold, fontSize: 14, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
