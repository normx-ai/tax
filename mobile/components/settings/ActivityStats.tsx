// mobile/components/settings/ActivityStats.tsx
// Section "Mon activité" avec stats personnelles et bar chart 7 jours

import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { UserStats } from "@/lib/api/user";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  stats: UserStats;
};

function StatRow({ icon, label, value, colors }: { icon: IoniconsName; label: string; value: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.icon} style={{ marginRight: 12 }} />
      <Text style={{ fontSize: 17, fontFamily: fonts.medium, fontWeight: fontWeights.medium, color: colors.text, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textMuted }}>{value}</Text>
    </View>
  );
}

export default function ActivityStats({ stats }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const cardStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden" as const,
    marginBottom: 4,
  };

  return (
    <>
      <View style={cardStyle}>
        <StatRow colors={colors} icon="chatbubble-ellipses-outline" label={t("activity.questionsThisMonth")} value={String(stats.monthQuestions)} />
        <View style={{ height: 1, backgroundColor: colors.background, marginHorizontal: 16 }} />
        <StatRow colors={colors} icon="analytics-outline" label={t("activity.questionsTotal")} value={String(stats.totalQuestions)} />
        <View style={{ height: 1, backgroundColor: colors.background, marginHorizontal: 16 }} />
        <StatRow colors={colors} icon="book-outline" label={t("activity.articlesViewed")} value={String(stats.totalArticles)} />
        <View style={{ height: 1, backgroundColor: colors.background, marginHorizontal: 16 }} />
        <StatRow colors={colors} icon="calendar-outline" label={t("activity.activeDays")} value={String(stats.activeDays)} />
      </View>

      {stats.last7Days.some((d) => d.questions > 0) && (
        <View style={{ ...cardStyle, padding: 16, marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: colors.textSecondary, marginBottom: 12 }}>
            {t("activity.last7Days")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 60, gap: 6 }}>
            {stats.last7Days.map((day) => {
              const maxQ = Math.max(...stats.last7Days.map((d) => d.questions), 1);
              const height = Math.max((day.questions / maxQ) * 48, 2);
              const dayLabel = new Date(day.date).toLocaleDateString("fr-FR", { weekday: "narrow" });
              return (
                <View key={day.date} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: colors.textMuted, marginBottom: 2 }}>
                    {day.questions > 0 ? day.questions : ""}
                  </Text>
                  <View
                    style={{
                      width: "70%",
                      height,
                      backgroundColor: day.questions > 0 ? colors.success : colors.border,
                    }}
                  />
                  <Text style={{ fontSize: 12, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textMuted, marginTop: 4 }}>
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}
