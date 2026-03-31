import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Organization } from "@/lib/api/organization";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from '@/lib/theme/colors';

interface OrgHeaderProps {
  org: Organization;
  isAdmin: boolean;
  editingName: boolean;
  newOrgName: string;
  actionLoading: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveName: () => void;
  onChangeNewName: (name: string) => void;
  colors: ThemeColors;
}

export default function OrgHeader({
  org,
  isAdmin,
  editingName,
  newOrgName,
  actionLoading,
  onStartEdit,
  onCancelEdit,
  onSaveName,
  onChangeNewName,
  colors,
}: OrgHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="business" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          {editingName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={newOrgName}
                onChangeText={onChangeNewName}
                placeholder={org.name}
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  fontSize: 18,
                  color: colors.text,
                }}
                autoFocus
              />
              <TouchableOpacity onPress={onSaveName} disabled={actionLoading || !newOrgName.trim()}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onCancelEdit}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontFamily: fonts.heading, fontWeight: fontWeights.heading, color: colors.text }}>{org.name}</Text>
              {isAdmin && (
                <TouchableOpacity onPress={onStartEdit} style={{ marginLeft: 8 }}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>
            {org.plan || "Gratuit"} — {org.memberCount} membre{org.memberCount > 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}
