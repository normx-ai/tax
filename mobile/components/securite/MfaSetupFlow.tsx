import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
// MFA supprime — gere par Keycloak (auth.normx-ai.com/realms/normx/account)
import { fonts, fontWeights } from "@/lib/theme/fonts";

interface MfaSetupFlowProps {
  setupStep: "idle" | "qr" | "verify" | "backup";
  setupData: MfaSetupResult | null;
  totpCode: string;
  actionLoading: boolean;
  mfaEnabled: boolean;
  showDisable: boolean;
  disablePassword: string;
  onStartSetup: () => void;
  onEnableMfa: () => void;
  onChangeTotpCode: (code: string) => void;
  onRegenerateBackupCodes: () => void;
  onShowDisable: () => void;
  onCancelDisable: () => void;
  onChangeDisablePassword: (pw: string) => void;
  onDisableMfa: () => void;
  colors: any;
}

export default function MfaSetupFlow({
  setupStep,
  setupData,
  totpCode,
  actionLoading,
  mfaEnabled,
  showDisable,
  disablePassword,
  onStartSetup,
  onEnableMfa,
  onChangeTotpCode,
  onRegenerateBackupCodes,
  onShowDisable,
  onCancelDisable,
  onChangeDisablePassword,
  onDisableMfa,
  colors,
}: MfaSetupFlowProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Activate button (MFA disabled, idle) */}
      {!mfaEnabled && setupStep === "idle" && (
        <TouchableOpacity
          onPress={onStartSetup}
          disabled={actionLoading}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: "#fff", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17 }}
              >
                {t("security.enableMfa")}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* QR Code step */}
      {setupStep === "qr" && setupData && (
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
          <Text
            style={{
              fontSize: 17,
              fontFamily: fonts.semiBold,
              fontWeight: fontWeights.semiBold,
              color: colors.text,
              marginBottom: 12,
            }}
          >
            {t("security.scanQrCode")}
          </Text>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Image
              source={{ uri: setupData.qrCodeUrl }}
              style={{ width: 200, height: 200, borderRadius: 8 }}
              resizeMode="contain"
            />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: fonts.regular,
              fontWeight: fontWeights.regular,
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            {t("security.enterManually")}
          </Text>
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily:
                  Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 16,
                color: colors.text,
                textAlign: "center",
              }}
            >
              {setupData.secret}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 17,
              fontFamily: fonts.semiBold,
              fontWeight: fontWeights.semiBold,
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {t("security.enterCode")}
          </Text>
          <TextInput
            value={totpCode}
            onChangeText={(text) =>
              onChangeTotpCode(text.replace(/[^0-9]/g, ""))
            }
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            style={{
              backgroundColor: colors.background,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 22,
              fontFamily: fonts.bold,
              color: colors.text,
              textAlign: "center",
              letterSpacing: 8,
              marginBottom: 12,
            }}
          />
          <TouchableOpacity
            onPress={onEnableMfa}
            disabled={actionLoading || totpCode.length < 6}
            style={{
              backgroundColor:
                totpCode.length < 6 ? colors.textMuted : colors.primary,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{ color: "#fff", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17 }}
              >
                {t("security.activate")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* MFA enabled management */}
      {mfaEnabled && setupStep === "idle" && (
        <>
          <TouchableOpacity
            onPress={onRegenerateBackupCodes}
            disabled={actionLoading}
            style={{
              backgroundColor: colors.textSecondary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: "#fff", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16 }}
              >
                {t("security.regenerateBackup")}
              </Text>
            </View>
          </TouchableOpacity>

          {!showDisable ? (
            <TouchableOpacity
              onPress={onShowDisable}
              style={{
                backgroundColor: `${colors.danger}15`,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="shield-outline"
                  size={18}
                  color="#dc2626"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#dc2626",
                    fontFamily: fonts.semiBold,
                    fontWeight: fontWeights.semiBold,
                    fontSize: 16,
                  }}
                >
                  {t("security.disable2fa")}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: `${colors.danger}50`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.semiBold,
                  fontWeight: fontWeights.semiBold,
                  color: "#dc2626",
                  marginBottom: 8,
                }}
              >
                {t("security.confirmDisable")}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: fonts.regular,
                  fontWeight: fontWeights.regular,
                  color: colors.textSecondary,
                  marginBottom: 12,
                }}
              >
                {t("security.enterPasswordToDisable")}
              </Text>
              <TextInput
                value={disablePassword}
                onChangeText={onChangeDisablePassword}
                placeholder={t("security.passwordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 17,
                  fontFamily: fonts.regular,
                  color: colors.text,
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={onCancelDisable}
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: fonts.semiBold,
                      fontWeight: fontWeights.semiBold,
                      fontSize: 16,
                    }}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDisableMfa}
                  disabled={actionLoading || !disablePassword.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: "#dc2626",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: fonts.semiBold,
                        fontWeight: fontWeights.semiBold,
                        fontSize: 16,
                      }}
                    >
                      {t("security.disable")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
}
