import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useAuthStore } from "@/lib/store/auth";
import { getAccountUrl } from "@/lib/auth/keycloak";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useToast } from "@/components/ui/ToastProvider";

export default function SecuriteScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { toast, confirm } = useToast();
  const logout = useAuthStore((s) => s.logout);
  const accountUrl = getAccountUrl();

  const openKeycloakAccount = () => {
    if (Platform.OS === "web") {
      window.open(accountUrl, "_blank");
    } else {
      Linking.openURL(accountUrl);
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
    await logout();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 18, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: colors.text }}>
            {t("security.mfa2fa")}
          </Text>
        </View>
        <Text style={{ fontSize: 15, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 }}>
          {t("security.managedByKeycloak")}
        </Text>
        <TouchableOpacity
          onPress={openKeycloakAccount}
          style={{ backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="open-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: "#fff", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16 }}>
              {t("security.manageAccount")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 }}>
        <TouchableOpacity
          onPress={handleLogoutAll}
          style={{ backgroundColor: `${colors.danger}15`, paddingVertical: 14, alignItems: "center" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 8 }} />
            <Text style={{ color: "#dc2626", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16 }}>
              {t("security.logoutAllDevices")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
