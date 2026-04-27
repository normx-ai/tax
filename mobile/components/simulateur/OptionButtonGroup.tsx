import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: Option<T>[];
  selected: T;
  onChange: (value: T) => void;
  direction?: "row" | "column";
  fontSize?: number;
};

export default function OptionButtonGroup<T extends string>({
  options,
  selected,
  onChange,
  direction = "row",
  fontSize = 13,
}: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: direction, gap: direction === "row" ? 6 : 4, marginBottom: 10 }}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={{
              flex: direction === "row" ? 1 : undefined,
              paddingVertical: 10,
              paddingHorizontal: direction === "column" ? 14 : 8,
              alignItems: direction === "row" ? "center" : "flex-start",
              backgroundColor: isActive ? `${colors.primary}15` : colors.card,
              borderWidth: 1,
              borderColor: isActive ? colors.primary : colors.border,
            }}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={{
                color: isActive ? colors.text : colors.textSecondary,
                fontFamily: isActive ? fonts.bold : fonts.medium,
                fontWeight: isActive ? fontWeights.bold : fontWeights.medium,
                fontSize,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
