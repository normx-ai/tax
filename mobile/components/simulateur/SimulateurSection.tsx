import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";

interface Props {
  label: string;
}

export default function SimulateurSection({ label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background, paddingHorizontal: 14, paddingVertical: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{label}</Text>
    </View>
  );
}
