import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts } from "@/lib/theme/fonts";
import { useCalculator } from "./calculator/useCalculator";
import CalculatorDisplay from "./calculator/CalculatorDisplay";
import CalculatorKeyboard from "./calculator/CalculatorKeyboard";

export default function FloatingCalculator() {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const [visible, setVisible] = useState(false);
  const { display, firstOperand, operator, handlePress } = useCalculator();

  return (
    <>
      {visible && (
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              width: isMobile ? 300 : 340,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.bold }]}>
              Calculatrice
            </Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              accessibilityLabel="Fermer la calculatrice"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <CalculatorDisplay display={display} firstOperand={firstOperand} operator={operator} />
          <CalculatorKeyboard onPress={handlePress} />
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setVisible(!visible)}
        activeOpacity={0.8}
        accessibilityLabel="Ouvrir la calculatrice"
        accessibilityRole="button"
      >
        <Ionicons name={visible ? "close" : "calculator"} size={26} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 999,
  },
  panel: {
    position: "absolute",
    bottom: 86,
    right: 20,
    borderWidth: 1,
    padding: 14,
    zIndex: 998,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});
