import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from '@/lib/theme/colors';

interface BackupCodesDisplayProps {
  backupCodes: string[];
  onCopy: () => void;
  onDone: () => void;
  colors: ThemeColors;
}

export default function BackupCodesDisplay({
  backupCodes,
  onCopy,
  onDone,
  colors,
}: BackupCodesDisplayProps) {
  const { t } = useTranslation();
  if (backupCodes.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Ionicons
          name="warning-outline"
          size={20}
          color="#d97706"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{ fontSize: 17, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: colors.text }}
        >
          {t("security.backupCodesTitle")}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 15,
          fontFamily: fonts.regular,
          fontWeight: fontWeights.regular,
          color: colors.textSecondary,
          marginBottom: 12,
        }}
      >
        {t("security.backupCodesDesc")}
      </Text>
      <View
        style={{
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
        }}
      >
        {backupCodes.map((code, i) => (
          <Text
            key={i}
            style={{
              fontFamily:
                Platform.OS === "ios" ? "Menlo" : "monospace",
              fontSize: 16,
              color: colors.text,
              lineHeight: 24,
              textAlign: "center",
            }}
          >
            {code}
          </Text>
        ))}
      </View>
      <TouchableOpacity
        onPress={onCopy}
        style={{
          backgroundColor: colors.textSecondary,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="copy-outline"
            size={16}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: "#fff", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16 }}>
            {t("security.copyCodes")}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDone}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16 }}>
          {t("security.codesSaved")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
