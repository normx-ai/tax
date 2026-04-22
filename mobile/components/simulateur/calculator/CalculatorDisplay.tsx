import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Props = {
  display: string;
  firstOperand: number | null;
  operator: string | null;
};

function formatOperandDisplay(value: number): string {
  const str = String(value);
  const parts = str.split(".");
  const formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return formatted + (parts.length > 1 ? "." + parts[1] : "");
}

export default function CalculatorDisplay({ display, firstOperand, operator }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {operator && (
        <Text style={[styles.operatorIndicator, { color: colors.textMuted }]}>
          {formatOperandDisplay(firstOperand ?? 0)} {operator}
        </Text>
      )}
      <Text
        style={[
          styles.displayText,
          {
            color: colors.text,
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
            fontSize: display.length > 12 ? 24 : 32,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    minHeight: 72,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  operatorIndicator: {
    fontSize: 16,
    marginBottom: 4,
  },
  displayText: {
    fontSize: 34,
    textAlign: "right",
  },
});
