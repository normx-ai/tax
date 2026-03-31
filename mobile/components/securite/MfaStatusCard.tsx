import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
// MFA supprime — gere par Keycloak (auth.normx-ai.com/realms/normx/account)
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from '@/lib/theme/colors';

interface MfaStatusCardProps {
  status: MfaStatus | null;
  colors: ThemeColors;
}

export default function MfaStatusCard({ status, colors }: MfaStatusCardProps) {
  const { t } = useTranslation();
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
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={status?.enabled ? colors.success : colors.danger}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 18, fontFamily: fonts.heading, fontWeight: fontWeights.heading, color: colors.text }}
            >
              {t("security.mfa2fa")}
            </Text>
            <Text style={{ fontSize: 15, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textSecondary }}>
              {status?.enabled
                ? t("security.mfaProtects")
                : t("security.mfaNotConfigured")}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: status?.enabled ? `${colors.success}15` : `${colors.danger}15`,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.bold,
              fontWeight: fontWeights.bold,
              color: status?.enabled ? colors.success : colors.danger,
            }}
          >
            {status?.enabled ? t("security.mfaEnabled") : t("security.mfaDisabled")}
          </Text>
        </View>
      </View>
      {status?.enabled && (
        <View
          style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons
            name="key-outline"
            size={16}
            color={colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={{ fontSize: 15, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textSecondary }}>
            {t("security.backupCodesRemaining", { count: status.backupCodesRemaining })}
          </Text>
        </View>
      )}
    </View>
  );
}
