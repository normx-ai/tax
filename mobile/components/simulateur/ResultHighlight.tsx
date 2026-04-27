import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Variant = "danger" | "success" | "primary";

type Props = {
  label: string;
  value: string;
  variant?: Variant;
  note?: string;
};

// Palette aux couleurs de marque (bleu nuit + or). On garde l'API "variant"
// pour ne pas casser les appels existants, mais on neutralise visuellement
// les variantes danger/success vers le couple bleu/or.
export default function ResultHighlight({ label, value, variant = "primary", note }: Props) {
  const { colors } = useTheme();

  // Toutes les variantes affichent le total dans la palette de marque
  const labelColor = colors.text;
  const valueColor = colors.primary;
  const bgColor = `${colors.primary}15`;
  const borderColor = colors.border;

  return (
    <View
      style={{
        backgroundColor: bgColor,
        paddingHorizontal: 16,
        paddingVertical: note ? 14 : 12,
        borderTopWidth: 1,
        borderTopColor: borderColor,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
            color: labelColor,
            flex: 1,
            paddingRight: 12,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
            color: valueColor,
          }}
        >
          {value}
        </Text>
      </View>
      {note && (
        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.regular,
            color: colors.textSecondary,
            marginTop: 6,
          }}
        >
          {note}
        </Text>
      )}
    </View>
  );
}
