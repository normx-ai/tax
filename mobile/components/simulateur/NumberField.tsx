import { View, Text, TextInput } from "react-native";
import { formatInputNumber } from "@/lib/services/fiscal-common";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function NumberField({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 13,
          fontFamily: fonts.medium,
          fontWeight: fontWeights.medium,
          color: colors.text,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          paddingHorizontal: 14,
          height: 46,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
            color: colors.text,
          }}
          value={value}
          onChangeText={(v) => onChange(formatInputNumber(v))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
      </View>
    </View>
  );
}
