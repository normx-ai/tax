import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
// MFA supprime — gere par Keycloak (auth.normx-ai.com/realms/normx/account)
// Auth API supprime — Keycloak gere login/logout
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import MfaStatusCard from "@/components/securite/MfaStatusCard";
import MfaSetupFlow from "@/components/securite/MfaSetupFlow";
import BackupCodesDisplay from "@/components/securite/BackupCodesDisplay";
import LogoutAllButton from "@/components/securite/LogoutAllButton";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type SetupStep = "idle" | "qr" | "verify" | "backup";

export default function SecuriteScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { toast, confirm } = useToast();
  const logout = useAuthStore((s) => s.logout);
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Setup flow
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [setupData, setSetupData] = useState<MfaSetupResult | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable flow
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await // mfaApi.getStatus();
      setStatus(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("security.unknownError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleStartSetup = async () => {
    setActionLoading(true);
    try {
      const data = await // mfaApi.setup();
      setSetupData(data);
      setSetupStep("qr");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    if (!totpCode.trim()) return;
    setActionLoading(true);
    try {
      const result = await // mfaApi.enable(totpCode.trim());
      setBackupCodes(result.backupCodes);
      setSetupStep("backup");
      setTotpCode("");
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("security.invalidCode");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!disablePassword.trim()) return;

    const ok = await confirm({
      title: t("security.disable2fa"),
      message: t("security.disableConfirmMsg"),
      confirmLabel: t("security.disable"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await // mfaApi.disable(disablePassword.trim());
      setDisablePassword("");
      setShowDisable(false);
      toast("2FA désactivée", "success");
      await loadStatus();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t("common.error");
      toast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const ok = await confirm({
      title: t("security.regenerateBackup"),
      message: t("security.regenerateConfirm"),
      confirmLabel: t("security.regenerate"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      const result = await // mfaApi.regenerateBackupCodes();
      setBackupCodes(result.backupCodes);
      setSetupStep("backup");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t("common.error");
      toast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    const ok = await confirm({
      title: t("security.logoutAllDevices"),
      message: t("security.logoutAllConfirm"),
      confirmLabel: t("security.logoutAll"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await // authApi.logoutAll();
      await logout();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t("common.error");
      toast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      await Clipboard.setStringAsync(backupCodes.join("\n"));
      toast(t("security.codesCopied"), "success");
    } catch {
      toast(t("security.codesCopyError"), "error");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {error && (
          <View style={{ backgroundColor: `${colors.danger}15`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16, fontFamily: fonts.medium, fontWeight: fontWeights.medium }}>{error}</Text>
          </View>
        )}

        <MfaStatusCard status={status} colors={colors} />

        <MfaSetupFlow
          setupStep={setupStep}
          setupData={setupData}
          totpCode={totpCode}
          actionLoading={actionLoading}
          mfaEnabled={!!status?.enabled}
          showDisable={showDisable}
          disablePassword={disablePassword}
          onStartSetup={handleStartSetup}
          onEnableMfa={handleEnableMfa}
          onChangeTotpCode={setTotpCode}
          onRegenerateBackupCodes={handleRegenerateBackupCodes}
          onShowDisable={() => setShowDisable(true)}
          onCancelDisable={() => { setShowDisable(false); setDisablePassword(""); }}
          onChangeDisablePassword={setDisablePassword}
          onDisableMfa={handleDisableMfa}
          colors={colors}
        />

        {setupStep === "backup" && (
          <BackupCodesDisplay
            backupCodes={backupCodes}
            onCopy={copyBackupCodes}
            onDone={() => { setSetupStep("idle"); setBackupCodes([]); }}
            colors={colors}
          />
        )}

        <LogoutAllButton
          actionLoading={actionLoading}
          onLogoutAll={handleLogoutAll}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}
