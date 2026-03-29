import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";

type Variant = "danger" | "success" | "primary";

type Props = {
  label: string;
  value: string;
  variant?: Variant;
  note?: string;
};

export default function ResultHighlight({ label, value, variant = "danger", note }: Props) {
  const { colors } = useTheme();

  const variantColor = variant === "danger" ? colors.danger : variant === "success" ? colors.success : colors.primary;
  const bgColor = variant === "success" ? colors.citationsBg : variantColor + "10";

  return (
    <View
      style={{
        backgroundColor: bgColor,
        paddingHorizontal: 14,
        paddingVertical: note ? 12 : 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: variantColor }}>{label}</Text>
        <Text style={{ fontSize: 20, fontWeight: "400", color: variantColor }}>{value}</Text>
      </View>
      {note && (
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{note}</Text>
      )}
    </View>
  );
}
