import React from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ROLE_LABELS } from "./MemberList";
import { useTranslation } from "react-i18next";
import type { ThemeColors } from '@/lib/theme/colors';

interface InviteFormProps {
  inviteEmail: string;
  inviteRole: "MEMBER" | "ADMIN";
  actionLoading: boolean;
  remainingSeats?: number;
  paidSeats?: number;
  onChangeEmail: (email: string) => void;
  onChangeRole: (role: "MEMBER" | "ADMIN") => void;
  onInvite: () => void;
  colors: ThemeColors;
}

export default function InviteForm({
  inviteEmail,
  inviteRole,
  actionLoading,
  remainingSeats,
  paidSeats,
  onChangeEmail,
  onChangeRole,
  onInvite,
  colors,
}: InviteFormProps) {
  const { t } = useTranslation();
  const noSeatsLeft = remainingSeats !== undefined && remainingSeats <= 0;
  return (
    <>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginBottom: 8,
          marginLeft: 4,
          marginTop: 16,
        }}
      >
        {t("organization.inviteMember")}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {paidSeats !== undefined && remainingSeats !== undefined && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 15, color: noSeatsLeft ? colors.danger : colors.textSecondary }}>
              {t("organization.seatsAvailableCount", { remaining: remainingSeats, total: paidSeats })}
            </Text>
          </View>
        )}
        {noSeatsLeft && (
          <View style={{ backgroundColor: `${colors.danger}15`, padding: 10, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 15 }}>
              {t("organization.noSeatsMessage")}
            </Text>
          </View>
        )}
        <TextInput
          value={inviteEmail}
          onChangeText={onChangeEmail}
          placeholder={t("organization.emailPlaceholder")}
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 17,
            color: colors.text,
            marginBottom: 12,
          }}
        />
        {/* S\u00e9lecteur r\u00f4le */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["MEMBER", "ADMIN"] as const).map((role) => (
            <TouchableOpacity
              key={role}
              onPress={() => onChangeRole(role)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: inviteRole === role ? colors.primary : colors.background,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: inviteRole === role ? "#fff" : colors.text,
                }}
              >
                {ROLE_LABELS[role]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={onInvite}
          disabled={actionLoading || !inviteEmail.trim() || noSeatsLeft}
          style={{
            backgroundColor: (!inviteEmail.trim() || noSeatsLeft) ? colors.textMuted : colors.primary,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>{t("organization.invite")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}
