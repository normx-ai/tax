import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Invitation } from "@/lib/api/organization";
import { ROLE_LABELS } from "./MemberList";
import type { ThemeColors } from '@/lib/theme/colors';

interface PendingInvitationsProps {
  invitations: Invitation[];
  isAdmin: boolean;
  onCancelInvitation: (id: string) => void;
  colors: ThemeColors;
}

export default function PendingInvitations({
  invitations,
  isAdmin,
  onCancelInvitation,
  colors,
}: PendingInvitationsProps) {
  if (invitations.length === 0) {
    return null;
  }

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
        }}
      >
        INVITATIONS EN ATTENTE ({invitations.length})
      </Text>
      {invitations.map((inv) => (
        <View
          key={inv.id}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="mail-outline" size={20} color="#d97706" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{inv.email}</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>
              R\u00f4le : {ROLE_LABELS[inv.role] || inv.role}
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity onPress={() => onCancelInvitation(inv.id)} style={{ padding: 6 }}>
              <Ionicons name="close-circle-outline" size={22} color="#dc2626" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </>
  );
}
