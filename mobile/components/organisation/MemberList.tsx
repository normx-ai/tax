import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { OrgMember } from "@/lib/api/organization";
import type { ThemeColors } from '@/lib/theme/colors';

export const ROLE_COLORS: Record<string, string> = {
  OWNER: "#8b5cf6",
  ADMIN: "#3b82f6",
  MEMBER: "#16a34a",
  VIEWER: "#6b7280",
};

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propri\u00e9taire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
  VIEWER: "Lecteur",
};

interface MemberListProps {
  members: OrgMember[];
  isAdmin: boolean;
  isOwner: boolean;
  menuOpenId: string | null;
  onToggleMenu: (id: string | null) => void;
  onChangeRole: (member: OrgMember, role: string) => void;
  onRemoveMember: (member: OrgMember) => void;
  onTransferOwnership: (member: OrgMember) => void;
  colors: ThemeColors;
}

export default function MemberList({
  members,
  isAdmin,
  isOwner,
  menuOpenId,
  onToggleMenu,
  onChangeRole,
  onRemoveMember,
  onTransferOwnership,
  colors,
}: MemberListProps) {
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
        MEMBRES ({members.length})
      </Text>
      {members.map((member) => {
        const roleColor = ROLE_COLORS[member.role] || "#6b7280";
        const initials = (member.name || member.email).substring(0, 2).toUpperCase();
        const isMenuOpen = menuOpenId === member.userId;

        return (
          <View
            key={member.userId}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Avatar */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  backgroundColor: `${roleColor}20`,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: roleColor }}>{initials}</Text>
              </View>
              {/* Infos */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>
                  {member.name || member.email}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textMuted }}>{member.email}</Text>
              </View>
              {/* Badge r\u00f4le */}
              <View
                style={{
                  backgroundColor: `${roleColor}20`,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: roleColor }}>
                  {ROLE_LABELS[member.role] || member.role}
                </Text>
              </View>
              {/* Menu actions */}
              {isAdmin && member.role !== "OWNER" && (
                <TouchableOpacity
                  onPress={() => onToggleMenu(isMenuOpen ? null : member.userId)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Menu dropdown */}
            {isMenuOpen && isAdmin && member.role !== "OWNER" && (
              <View style={{ marginTop: 10, backgroundColor: colors.background, padding: 8 }}>
                {/* Changer r\u00f4le */}
                {(["MEMBER", "ADMIN", "VIEWER"] as const)
                  .filter((r) => r !== member.role)
                  .map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => onChangeRole(member, role)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                      }}
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={16}
                        color={colors.text}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ fontSize: 15, color: colors.text }}>
                        R\u00f4le \u2192 {ROLE_LABELS[role]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                {/* Retirer */}
                <TouchableOpacity
                  onPress={() => onRemoveMember(member)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    marginTop: 4,
                  }}
                >
                  <Ionicons
                    name="person-remove-outline"
                    size={16}
                    color="#dc2626"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 15, color: "#dc2626" }}>Retirer de l'organisation</Text>
                </TouchableOpacity>
                {/* Transf\u00e9rer propri\u00e9t\u00e9 */}
                {isOwner && (
                  <TouchableOpacity
                    onPress={() => onTransferOwnership(member)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 8,
                      paddingHorizontal: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={16}
                      color="#8b5cf6"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 15, color: "#8b5cf6" }}>
                      Transf\u00e9rer la propri\u00e9t\u00e9
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}
