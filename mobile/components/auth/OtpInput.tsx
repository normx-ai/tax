import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  code: string;
  cooldown: number;
  onChangeCode: (code: string) => void;
  onResend: () => void;
  onSubmit?: () => void;
  colors: ThemeColors;
}

export default function OtpInput({ code, cooldown, onChangeCode, onResend, onSubmit, colors }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
        {t("auth.codePlaceholder")}
      </Text>
      <TextInput
        style={{ width: "100%", backgroundColor: colors.input, padding: 12, textAlign: "center", fontSize: 26, letterSpacing: 4, color: colors.text, marginBottom: 24 }}
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
          onChangeCode(cleaned);
        }}
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </>
  );
}
