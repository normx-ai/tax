import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  creditsUsed: number;
  creditsLimit: number;
  remaining: number;
  planColor: string;
  colors: ThemeColors;
}

export default function QuotaProgress({
  creditsUsed,
  creditsLimit,
  remaining,
  planColor,
  colors,
}: Props) {
  const progressRatio =
    creditsLimit === 0 ? 0 : Math.min(creditsUsed / creditsLimit, 1);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Ionicons name="flash-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Crédits</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          {creditsUsed} / {creditsLimit} utilisés ce mois
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: planColor }}>
          {remaining} restants
        </Text>
      </View>

      <View
        style={{
          height: 10,
          backgroundColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.round(progressRatio * 100)}%`,
            backgroundColor:
              progressRatio >= 0.9
                ? "#dc2626"
                : progressRatio >= 0.7
                  ? "#d97706"
                  : colors.accent,
          }}
        />
      </View>

      {progressRatio >= 0.9 && (
        <Text style={{ fontSize: 14, color: "#dc2626", marginTop: 6, fontWeight: "600" }}>
          Vous approchez de la limite. Achetez un pack de crédits ou passez au plan supérieur.
        </Text>
      )}

      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
        1 crédit = 1 question IA  |  1 audit = 3 crédits
      </Text>
    </View>
  );
}
