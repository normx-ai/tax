// mobile/components/chat/HistoryPanel.tsx
// Panneau latéral d'historique des conversations avec recherche

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Conversation } from "@/lib/api/chat";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { TFunction } from "i18next";

interface DateGroup {
  label: string;
  items: Conversation[];
}

function formatRelativeDate(dateStr: string, t: TFunction): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t("chat.timeJustNow");
  if (diffMins < 60) return `${t("chat.timeAgo")} ${diffMins} ${t("chat.timeMinutes")}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${t("chat.timeAgo")} ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return t("chat.timeYesterday");
  if (diffDays < 7) return `${t("chat.timeAgo")} ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function groupByDate(conversations: Conversation[], t: TFunction): DateGroup[] {
  const groups: Map<string, Conversation[]> = new Map();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const monthKeys = [
    "months.january", "months.february", "months.march", "months.april",
    "months.may", "months.june", "months.july", "months.august",
    "months.september", "months.october", "months.november", "months.december",
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt || conv.createdAt);
    if (isNaN(date.getTime())) continue;
    const convDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let label: string;
    if (convDay.getTime() === today.getTime()) {
      label = t("chat.timeToday");
    } else if (convDay.getTime() === yesterday.getTime()) {
      label = t("chat.timeYesterday");
    } else if (convDay.getTime() > weekAgo.getTime()) {
      const days = Math.round((today.getTime() - convDay.getTime()) / 86400000);
      label = `${t("chat.timeAgo")} ${days} jours`;
    } else {
      label = `${t(monthKeys[date.getMonth()])} ${date.getFullYear()}`;
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(conv);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

type Props = {
  conversations: Conversation[];
  loading: boolean;
  activeConversationId: string | null;
  onNewConversation: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, title: string | null) => void;
  onClose: () => void;
};

export default function HistoryPanel({
  conversations,
  loading,
  activeConversationId,
  onNewConversation,
  onLoadConversation,
  onDeleteConversation,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? conversations.filter((c) =>
        (c.title || "").toLowerCase().includes(search.toLowerCase())
      )
    : conversations;
  const dateGroups = groupByDate(filtered, t);

  return (
    <>
      {/* Header panneau */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.sidebarText, fontSize: 18, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
          {t("chat.history")}
        </Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel={t("chat.closeHistory")}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Bouton nouvelle conversation */}
      <TouchableOpacity
        onPress={onNewConversation}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginHorizontal: 12,
          marginTop: 12,
          marginBottom: 8,
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
        }}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 16, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
          {t("chat.newConversation")}
        </Text>
      </TouchableOpacity>

      {/* Champ de recherche */}
      <View
        style={{
          marginHorizontal: 12,
          marginBottom: 8,
          backgroundColor: colors.input,
          borderRadius: 10,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
        }}
      >
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={{
            flex: 1,
            color: colors.sidebarText,
            fontSize: 15,
            fontFamily: fonts.regular,
            paddingVertical: 8,
            marginLeft: 8,
          }}
          placeholder={t("chat.searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des conversations */}
      {loading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={{ color: colors.textMuted, fontSize: 15, marginTop: 8 }}>
            {t("common.loading")}
          </Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={{ paddingTop: 40, alignItems: "center", paddingHorizontal: 20 }}>
          <Ionicons name="chatbubbles-outline" size={32} color={colors.disabled} />
          <Text style={{ color: colors.textMuted, fontSize: 15, marginTop: 8, textAlign: "center" }}>
            {t("chat.noConversations")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={dateGroups}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: group }) => (
            <View>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  fontFamily: fonts.bold,
                  fontWeight: fontWeights.bold,
                  textTransform: "uppercase",
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 6,
                }}
              >
                {group.label}
              </Text>
              {group.items.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <TouchableOpacity
                    key={conv.id}
                    onPress={() => onLoadConversation(conv.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginHorizontal: 8,
                      marginBottom: 2,
                      borderRadius: 10,
                      backgroundColor: isActive ? `${colors.primary}18` : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: isActive ? `${colors.primary}25` : `${colors.textMuted}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={14} color={isActive ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: isActive ? colors.accent : colors.sidebarText,
                          fontSize: 15,
                          fontFamily: isActive ? fonts.semiBold : fonts.regular,
                          fontWeight: isActive ? fontWeights.semiBold : fontWeights.regular,
                        }}
                      >
                        {conv.title || t("chat.untitled")}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 2 }}>
                        {conv._count?.messages ?? 0} {(conv._count?.messages ?? 0) > 1 ? t("chat.messages") : t("chat.message")} · {formatRelativeDate(conv.updatedAt, t)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onDeleteConversation(conv.id, conv.title)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t("chat.deleteConversation")}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}
    </>
  );
}
