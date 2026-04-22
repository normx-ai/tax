import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts } from "@/lib/theme/fonts";

type ButtonDef = { label: string; type: "digit" | "op" | "action" | "equal" };

const BUTTONS: ButtonDef[][] = [
  [
    { label: "C", type: "action" },
    { label: "±", type: "action" },
    { label: "%", type: "action" },
    { label: "÷", type: "op" },
  ],
  [
    { label: "7", type: "digit" },
    { label: "8", type: "digit" },
    { label: "9", type: "digit" },
    { label: "×", type: "op" },
  ],
  [
    { label: "4", type: "digit" },
    { label: "5", type: "digit" },
    { label: "6", type: "digit" },
    { label: "-", type: "op" },
  ],
  [
    { label: "1", type: "digit" },
    { label: "2", type: "digit" },
    { label: "3", type: "digit" },
    { label: "+", type: "op" },
  ],
  [
    { label: "0", type: "digit" },
    { label: "00", type: "digit" },
    { label: ".", type: "digit" },
    { label: "=", type: "equal" },
  ],
];

type Props = {
  onPress: (label: string, type: string) => void;
};

export default function CalculatorKeyboard({ onPress }: Props) {
  const { colors } = useTheme();

  const getButtonStyle = (type: string) => {
    if (type === "equal") return { backgroundColor: colors.primary };
    if (type === "op") return { backgroundColor: `${colors.primary}20` };
    return { backgroundColor: colors.card };
  };

  const getTextStyle = (type: string, label: string) => {
    if (type === "equal") return { color: "#fff" };
    if (type === "op") return { color: colors.primary };
    if (label === "C") return { color: colors.danger };
    return { color: colors.text };
  };

  return (
    <View style={styles.keyboard}>
      {BUTTONS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((btn) => (
            <TouchableOpacity
              key={btn.label}
              style={[styles.button, getButtonStyle(btn.type)]}
              onPress={() => onPress(btn.label, btn.type)}
              activeOpacity={0.7}
              accessibilityLabel={btn.label}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, getTextStyle(btn.type, btn.label), { fontFamily: fonts.semiBold }]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "600",
  },
});
