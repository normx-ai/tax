import { memo } from "react";
import { View, Text, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  email: string;
  emailError: string;
  emailChecking: boolean;
  onChangeEmail: (email: string) => void;
  onBlur?: () => void;
  colors: ThemeColors;
}

export default memo(function EmailField({ email, emailError, onChangeEmail, onBlur, colors }: Props) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const inputStyle = {
    width: "100%" as const,
    backgroundColor: colors.input,
    padding: isMobile ? 10 : 12,
    fontSize: isMobile ? 15 : 16,
    color: colors.text,
    borderRadius: 8,
  };

  return (
    <>
      <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: "600", color: colors.text, marginBottom: isMobile ? 6 : 8 }}>
        Email <Text style={{ color: colors.danger }}>*</Text>
      </Text>
      <TextInput
        style={{ ...inputStyle, marginBottom: emailError ? 4 : (isMobile ? 12 : 16), borderWidth: emailError ? 1 : 0, borderColor: emailError ? colors.danger : "transparent" }}
        placeholder={t("auth.emailPlaceholder")}
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={onChangeEmail}
        onBlur={onBlur}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {emailError ? (
        <Text style={{ color: colors.danger, fontSize: 14, marginBottom: isMobile ? 8 : 12 }}>{emailError}</Text>
      ) : null}
    </>
  );
});
