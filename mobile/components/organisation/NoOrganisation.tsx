import React from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ThemeColors } from '@/lib/theme/colors';

interface NoOrganisationProps {
  createName: string;
  createLoading: boolean;
  onChangeCreateName: (name: string) => void;
  onCreateOrg: () => void;
  colors: ThemeColors;
}

export default function NoOrganisation({
  createName,
  createLoading,
  onChangeCreateName,
  onCreateOrg,
  colors,
}: NoOrganisationProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Ionicons name="business-outline" size={48} color={colors.disabled} />
          <Text
            style={{
              marginTop: 12,
              color: colors.textSecondary,
              fontSize: 18,
              textAlign: "center",
            }}
          >
            Vous n'appartenez \u00e0 aucune organisation
          </Text>
        </View>

        {/* Formulaire de cr\u00e9ation */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Cr\u00e9er une organisation
          </Text>
          <TextInput
            value={createName}
            onChangeText={onChangeCreateName}
            placeholder="Nom de l'organisation"
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 17,
              color: colors.text,
              marginBottom: 12,
            }}
          />
          <TouchableOpacity
            onPress={onCreateOrg}
            disabled={createLoading || !createName.trim()}
            style={{
              backgroundColor: !createName.trim() ? colors.textMuted : colors.primary,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            {createLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>Cr\u00e9er</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lien vers invitations */}
        <TouchableOpacity
          onPress={() => router.push("/(app)/invitations")}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="mail-outline" size={22} color={colors.primary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text }}>
              Invitations re\u00e7ues
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>
              Accepter une invitation pour rejoindre une organisation
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
