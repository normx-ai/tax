import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

interface Props {
  label: string;
}

export default function SimulateurSection({ label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }}>
      <Text
        style={{
          fontSize: 11,
          fontFamily: fonts.bold,
          fontWeight: fontWeights.bold,
          color: colors.textSecondary,
          letterSpacing: 1.2,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
