import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function TableRow({
  label,
  value,
  bg,
  bold,
  color,
}: {
  label: string;
  value: string;
  bg?: string;
  bold?: boolean;
  color?: string;
}) {
  const { colors } = useTheme();
  const isNegative = value.trim().startsWith("-") || value.trim().startsWith("−");
  const valueColor = color || (isNegative ? colors.textSecondary : colors.text);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: bg || "transparent",
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: color || colors.textSecondary,
          fontFamily: bold ? fonts.medium : fonts.regular,
          fontWeight: bold ? fontWeights.medium : "400",
          flex: 1,
          paddingRight: 12,
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: valueColor,
          fontFamily: fonts.medium,
          fontWeight: fontWeights.medium,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
