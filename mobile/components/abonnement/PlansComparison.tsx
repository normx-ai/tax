import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PLAN_COLORS, PLAN_BG, PLANS_INFO } from "./PlanHeader";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  currentPlan: string;
  colors: ThemeColors;
}

export default function PlansComparison({ currentPlan, colors }: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Ionicons name="layers-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Nos offres</Text>
      </View>

      {PLANS_INFO.map((planInfo) => {
        const isCurrentPlan = planInfo.name === currentPlan;
        const color = PLAN_COLORS[planInfo.name] || PLAN_COLORS.FREE;
        const bg = PLAN_BG[planInfo.name] || PLAN_BG.FREE;

        return (
          <View
            key={planInfo.name}
            style={{
              backgroundColor: colors.card,
              padding: 16,
              marginBottom: 10,
              borderWidth: isCurrentPlan ? 2 : 1,
              borderColor: isCurrentPlan ? color : colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: color,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
                    {planInfo.label}
                  </Text>
                </View>
                {isCurrentPlan && (
                  <View
                    style={{
                      backgroundColor: bg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color, fontSize: 13, fontWeight: "700" }}>Plan actuel</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
                {planInfo.price}
              </Text>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8, fontStyle: "italic" }}>
              {planInfo.priceDetail}
            </Text>

            {planInfo.features.map((feature, idx) => (
              <View
                key={idx}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: idx < planInfo.features.length - 1 ? 6 : 0 }}
              >
                <Ionicons name="checkmark-circle" size={16} color={color} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, color: colors.text }}>{feature}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {/* Packs credits */}
      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="flash-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Packs crédits</Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 10 }}>
          Besoin de plus ? Achetez des crédits supplémentaires valides sans limite de temps.
        </Text>
        {[
          { credits: 30, price: "8 EUR" },
          { credits: 80, price: "18 EUR" },
          { credits: 200, price: "35 EUR" },
        ].map((pack) => (
          <View
            key={pack.credits}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              marginBottom: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{pack.credits} crédits</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>{pack.price}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
          1 crédit = 1 question IA  |  1 audit document = 3 crédits
        </Text>
      </View>
    </View>
  );
}
