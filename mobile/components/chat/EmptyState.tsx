// mobile/components/chat/EmptyState.tsx
// État vide du chat avec suggestions de recherches récentes

import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SearchHistoryItem } from "@/lib/api/search-history";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Props = {
  recentSearches: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
};

export default function EmptyState({ recentSearches, onSelectQuery }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ alignItems: "center", paddingTop: 60 }}>
      <Ionicons name="chatbubbles-outline" size={48} color={colors.disabled} />
      <Text style={{ color: colors.textMuted, fontFamily: fonts.heading, fontWeight: fontWeights.heading, fontSize: 18, marginTop: 12, textAlign: "center" }}>
        {t("chat.emptyState")}
      </Text>
      <Text style={{ color: colors.disabled, fontSize: 15, marginTop: 4, textAlign: "center" }}>
        {t("chat.emptyStateDesc")}
      </Text>

      {recentSearches.length > 0 && (
        <View style={{ width: "100%", marginTop: 24, paddingHorizontal: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, marginBottom: 8 }}>
            {t("chat.recentSearches")}
          </Text>
          {recentSearches.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectQuery(item.query)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.card,

                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="time-outline" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 15, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.text }} numberOfLines={1}>
                {item.query}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.disabled} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
