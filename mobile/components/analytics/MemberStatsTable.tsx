import { View, Text } from "react-native";
import type { MemberStat } from "@/lib/api/analytics";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  memberStats: MemberStat[];
  formatDate: (iso: string) => string;
  colors: ThemeColors;
}

export default function MemberStatsTable({ memberStats, formatDate, colors }: Props) {
  if (memberStats.length === 0) return null;

  return (
    <>
      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
        STATISTIQUES MEMBRES
      </Text>
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 20 }}>
        {memberStats.map((member, index) => {
          const initials = (member.name || member.email).substring(0, 2).toUpperCase();
          return (
            <View
              key={member.userId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.background,
              }}
            >
              <View style={{ width: 34, height: 34, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#3b82f6" }}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{member.name || member.email}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>
                  Dernière activité : {member.lastActive ? formatDate(member.lastActive) : "-"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{member.questionsCount}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>questions</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}
