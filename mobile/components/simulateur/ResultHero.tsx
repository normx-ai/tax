import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

interface Props {
  label: string;
  amount: string;
  currency?: string;
  footer?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
}

// Carte hero bleu nuit avec l'agregat principal du simulateur, alignee
// sur le style du simulateur ITS (label or, montant blanc, footer gris).
export default function ResultHero({
  label,
  amount,
  currency = "FCFA",
  footer,
  secondaryLabel,
  secondaryValue,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.headerBg,
        paddingHorizontal: 22,
        paddingVertical: 22,
        marginHorizontal: 12,
        marginTop: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.bold,
              fontWeight: fontWeights.bold,
              color: colors.primary,
              letterSpacing: 1.2,
              marginBottom: 8,
            }}
          >
            {label.toUpperCase()}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text
              style={{
                fontSize: 36,
                color: "#ffffff",
                fontFamily: fonts.headingBlack,
                fontWeight: fontWeights.headingBlack,
                letterSpacing: -0.8,
              }}
            >
              {amount}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                fontFamily: fonts.medium,
                fontWeight: fontWeights.medium,
              }}
            >
              {currency}
            </Text>
          </View>
          {footer && (
            <Text
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.75)",
                fontFamily: fonts.regular,
                marginTop: 8,
              }}
            >
              {footer}
            </Text>
          )}
        </View>

        {secondaryLabel && secondaryValue && (
          <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.6)",
                fontFamily: fonts.medium,
                fontWeight: fontWeights.medium,
                letterSpacing: 0.6,
                marginBottom: 4,
              }}
            >
              {secondaryLabel.toUpperCase()}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.primary,
                fontFamily: fonts.bold,
                fontWeight: fontWeights.bold,
              }}
            >
              {secondaryValue}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
