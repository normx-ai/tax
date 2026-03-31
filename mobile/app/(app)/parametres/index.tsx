import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Switch,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/store/auth";
import { useToast } from "@/components/ui/ToastProvider";
import { userApi, type SubscriptionInfo, type UserStats } from "@/lib/api/user";
import ActivityStats from "@/components/settings/ActivityStats";
import { useTheme } from "@/lib/theme/ThemeContext";
import SectionHeader from "@/components/parametres/SectionHeader";
import SettingsRow, { Divider } from "@/components/parametres/SettingsRow";
import ManagementLinks from "@/components/parametres/ManagementLinks";
import Constants from "expo-constants";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PLAN_LABELS: Record<string, string> = {
  FREE: "Découverte",
  STARTER: "Starter",
  PRO: "Pro",
};

export default function ParametresScreen() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { mode, toggleTheme, colors } = useTheme();
  const { confirm } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        userApi.getProfile(),
        userApi.getStats().catch(() => null),
      ]);
      setSubscription(profileData.subscription);
      setStats(statsData);
    } catch {
      // Silencieux — les données s'afficheront depuis le store
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const planLabel = subscription ? (PLAN_LABELS[subscription.plan] || subscription.plan) : "Découverte";
  const creditsUsed = subscription?.creditsUsed ?? 0;
  const creditsMax = subscription?.creditsPerMonth ?? 10;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Section Compte */}
        <SectionHeader title={t("settings.account")} colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" as const, marginBottom: 4 }}>
          <SettingsRow
            icon="mail-outline"
            label={t("settings.email")}
            value={user?.email || ""}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="lock-closed-outline"
            label={t("settings.changePassword")}
            onPress={async () => {
              const ok = await confirm({
                title: t("settings.changePassword"),
                message: t("settings.changePasswordConfirm"),
                confirmLabel: t("auth.continue"),
                cancelLabel: t("common.cancel"),
              });
              if (ok) router.push("/(auth)/forgot-password");
            }}
            showChevron
            colors={colors}
          />
        </View>

        {/* Section Sécurité */}
        <SectionHeader title={t("settings.security")} colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" as const, marginBottom: 4 }}>
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t("settings.twoFactor")}
            onPress={() => router.push("/(app)/securite" as Href)}
            showChevron
            colors={colors}
          />
        </View>

        {/* Section Apparence */}
        <SectionHeader title={t("settings.appearance")} colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" as const, marginBottom: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name={mode === "dark" ? "moon" : "sunny"} size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 17, fontFamily: fonts.medium, fontWeight: fontWeights.medium, color: colors.text, flex: 1 }}>{t("settings.darkMode")}</Text>
            <Switch
              value={mode === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Section Langue */}
        <SectionHeader title={t("settings.language")} colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" as const, marginBottom: 4 }}>
          <TouchableOpacity
            onPress={() => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="language-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 17, fontFamily: fonts.medium, fontWeight: fontWeights.medium, color: colors.text, flex: 1 }}>{t("settings.languageSelect")}</Text>
            <Text style={{ fontSize: 16, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textMuted }}>
              {i18n.language === "fr" ? "Français" : "English"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.disabled} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Section Abonnement */}
        <SectionHeader title={t("settings.subscription")} colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" as const, marginBottom: 4 }}>
          <SettingsRow icon="ribbon-outline" label={t("settings.plan")} value={planLabel} colors={colors} />
          <Divider colors={colors} />
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            label="Crédits"
            value={`${creditsUsed} / ${creditsMax} ce mois`}
            colors={colors}
          />
          {subscription?.currentPeriodEnd && (
            <>
              <Divider colors={colors} />
              <SettingsRow
                icon="calendar-outline"
                label={t("settings.renewal")}
                value={new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                colors={colors}
              />
            </>
          )}
        </View>

        {/* Section Mon activité */}
        {stats && (
          <>
            <SectionHeader title={t("settings.activity")} colors={colors} />
            <ActivityStats stats={stats} />
          </>
        )}

        {/* Section Gestion */}
        <SectionHeader title={t("settings.management")} colors={colors} />
        <ManagementLinks colors={colors} />

        {/* Section A propos */}
        <SectionHeader title={t("settings.about")} colors={colors} />
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" as const, marginBottom: 4 }}>
          <SettingsRow icon="information-circle-outline" label={t("common.version")} value={Constants.expoConfig?.version ?? "1.0.0"} colors={colors} />
          <Divider colors={colors} />
          <SettingsRow icon="book-outline" label={t("settings.edition")} value="CGI Édition 2026" colors={colors} />
          <Divider colors={colors} />
          <SettingsRow
            icon="document-text-outline"
            label={t("settings.terms")}
            onPress={() => router.push("/legal/cgu" as Href)}
            showChevron
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="lock-closed-outline"
            label={t("settings.privacy")}
            onPress={() => router.push("/legal/confidentialite" as Href)}
            showChevron
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="information-circle-outline"
            label={t("settings.legalNotices")}
            onPress={() => router.push("/legal/mentions" as Href)}
            showChevron
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}
