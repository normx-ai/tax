import React from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import type { AdminOrganization } from "@/lib/api/admin";
import type { ThemeColors } from '@/lib/theme/colors';

type PlanKey = "FREE" | "STARTER" | "PROFESSIONAL" | "TEAM" | "ENTERPRISE";

export const PLAN_COLORS: Record<PlanKey, string> = {
  FREE: "#6b7280",
  STARTER: "#3b82f6",
  PROFESSIONAL: "#374151",
  TEAM: "#8b5cf6",
  ENTERPRISE: "#d97706",
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#16a34a",
  TRIALING: "#2563eb",
  EXPIRED: "#dc2626",
  CANCELLED: "#dc2626",
  PAST_DUE: "#d97706",
};

export function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    TRIALING: "Essai",
    EXPIRED: "Expiré",
    CANCELLED: "Annulé",
    PAST_DUE: "Impayé",
  };
  return labels[status] || status;
}

interface OrganisationCardProps {
  org: AdminOrganization;
  actionLoading: string | null;
  seatsValue: string;
  onSeatsChange: (value: string) => void;
  onActivate: (org: AdminOrganization, plan: "STARTER" | "PROFESSIONAL" | "TEAM" | "ENTERPRISE") => void;
  onRenew: (org: AdminOrganization) => void;
  colors: ThemeColors;
}

export default function OrganisationCard({ org, actionLoading, seatsValue, onSeatsChange, onActivate, onRenew, colors }: OrganisationCardProps) {
  const sub = org.subscription;
  const plan = (sub?.plan || "FREE") as PlanKey;
  const status = sub?.status || "EXPIRED";
  const planColor = PLAN_COLORS[plan] || "#6b7280";
  const statusColor = STATUS_COLORS[status] || "#6b7280";
  const quota = sub ? `${sub.questionsUsed} / ${sub.questionsPerMonth}` : "0 / 0";
  const quotaPercent = sub && sub.questionsPerMonth > 0 ? Math.min((sub.questionsUsed / sub.questionsPerMonth) * 100, 100) : 0;
  const isLoadingThis = actionLoading === org.id;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: planColor,
        marginBottom: 12,
        padding: 16,
      }}
    >
      {/* Entete org */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{org.name}</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>{org.slug}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ backgroundColor: `${planColor}20`, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: planColor }}>{plan}</Text>
          </View>
          <View style={{ backgroundColor: `${statusColor}20`, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: statusColor }}>{statusLabel(status)}</Text>
          </View>
        </View>
      </View>

      {/* Quota */}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Questions (total org.)</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{quota}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.border }}>
          <View
            style={{
              height: 6,
              width: `${quotaPercent}%` as `${number}%`,
              backgroundColor: quotaPercent > 90 ? "#dc2626" : quotaPercent > 70 ? "#d97706" : "#16a34a",
            }}
          />
        </View>
      </View>

      {/* Infos */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Expire le</Text>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{formatDate(sub?.currentPeriodEnd || null)}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Membres / Sièges</Text>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
            {org.memberCount} / {sub?.paidSeats ?? org.memberCount}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Prix total/an</Text>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{org.totalPrice > 0 ? `${org.totalPrice.toLocaleString("fr-FR")} XAF` : "-"}</Text>
        </View>
      </View>

      {/* Input sièges */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
        <Text style={{ fontSize: 15, color: colors.textSecondary }}>Sièges à activer :</Text>
        <TextInput
          value={seatsValue}
          onChangeText={(v) => onSeatsChange(v.replace(/[^0-9]/g, ""))}
          placeholder={String(Math.max(org.memberCount, 1))}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: 12,
            paddingVertical: 6,
            fontSize: 16,
            color: colors.text,
            width: 80,
            textAlign: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
      </View>

      {/* Actions */}
      {isLoadingThis ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => onActivate(org, "STARTER")}
            style={{ flex: 1, backgroundColor: "#3b82f6", paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Starter</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>69€/user/an</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onActivate(org, "PROFESSIONAL")}
            style={{ flex: 1, backgroundColor: "#374151", paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Pro</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>149€/user/an</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onActivate(org, "TEAM")}
            style={{ flex: 1, backgroundColor: "#8b5cf6", paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Team</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>299€/user/an</Text>
          </TouchableOpacity>
          {(status === "ACTIVE" || status === "EXPIRED" || status === "TRIALING") && (
            <TouchableOpacity
              onPress={() => onRenew(org)}
              style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Renouveler</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>+1 an</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
