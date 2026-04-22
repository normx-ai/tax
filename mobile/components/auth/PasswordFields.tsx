import { memo } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { useResponsive } from "@/lib/hooks/useResponsive";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  onChangePassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onToggleShowPassword: () => void;
  colors: ThemeColors;
}

export default memo(function PasswordFields({
  password,
  confirmPassword,
  showPassword,
  onChangePassword,
  onChangeConfirmPassword,
  onToggleShowPassword,
  colors,
}: Props) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const inputStyle = {
    width: "100%" as const,
    backgroundColor: colors.input,
    padding: isMobile ? 10 : 12,
    fontSize: isMobile ? 15 : 16,
    color: colors.text,
  };

  return (
    <View style={{ flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 12 : 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: "600", color: colors.text, marginBottom: isMobile ? 6 : 8 }}>
          {t("auth.password")} <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        <View>
          <TextInput
            style={{ ...inputStyle, paddingRight: 48 }}
            placeholder={t("auth.passwordPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={{ position: "absolute", right: 12, top: 12 }}
            onPress={onToggleShowPassword}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        <PasswordStrengthIndicator password={password} colors={colors} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: isMobile ? 13 : 14, fontWeight: "600", color: colors.text, marginBottom: isMobile ? 6 : 8 }}>
          {t("common.confirm")} <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        <TextInput
          style={inputStyle}
          placeholder={t("common.confirm")}
          placeholderTextColor={colors.textMuted}
          value={confirmPassword}
          onChangeText={onChangeConfirmPassword}
          secureTextEntry={!showPassword}
        />
      </View>
    </View>
  );
});
