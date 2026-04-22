import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/store/auth";
import { fonts, fontWeights } from "@/lib/theme/fonts";

function getInitials(prenom?: string, nom?: string) {
  return ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "U";
}

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  descKey?: string;
  route: string;
  color?: string;
  danger?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: "person-outline", labelKey: "sidebar.profile", descKey: "plus.profileDesc", route: "/(app)/profil" },
  { icon: "settings-outline", labelKey: "sidebar.settings", descKey: "plus.settingsDesc", route: "/(app)/parametres" },
  { icon: "shield-checkmark-outline", labelKey: "sidebar.security", descKey: "plus.securityDesc", route: "/(app)/securite" },
  { icon: "card-outline", labelKey: "sidebar.subscription", descKey: "plus.subscriptionDesc", route: "/(app)/abonnement" },
  { icon: "receipt-outline", labelKey: "factures.title", descKey: "plus.facturesDesc", route: "/(app)/factures" },
  { icon: "document-text-outline", labelKey: "settings.terms", route: "/legal/cgu" },
  { icon: "lock-closed-outline", labelKey: "settings.privacy", route: "/legal/confidentialite" },
  { icon: "information-circle-outline", labelKey: "settings.legalNotices", route: "/legal/mentions" },
];

export default function PlusScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);


  const initials = getInitials(user?.prenom, user?.nom);
  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || t("dashboard.user");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* User card */}
      <TouchableOpacity
        onPress={() => router.push("/(app)/profil" as Href)}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 20 }}>
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, fontWeight: fontWeights.heading, fontSize: 19, color: colors.text }}>
            {displayName}
          </Text>
          {user?.email && (
            <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: colors.textSecondary, marginTop: 2 }}>
              {user.email}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Menu items */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {MENU_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as Href)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 14,
              gap: 14,
              borderTopWidth: idx > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: `${colors.primary}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17, color: colors.text }}>
                {t(item.labelKey)}
              </Text>
              {item.descKey && (
                <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 14, color: colors.textMuted, marginTop: 1 }}>
                  {t(item.descKey)}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/logout")}
        style={{
          backgroundColor: `${colors.danger}12`,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17, color: colors.danger }}>
          {t("auth.logout")}
        </Text>
      </TouchableOpacity>

      {/* Version */}
      <Text
        style={{
          textAlign: "center",
          fontFamily: fonts.regular,
          fontWeight: fontWeights.regular,
          fontSize: 14,
          color: colors.textMuted,
          marginTop: 24,
        }}
      >
        {t("dashboard.footer")}
      </Text>
    </ScrollView>
  );
}
