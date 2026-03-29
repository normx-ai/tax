import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useActiveCode, type CodeId } from "@/lib/context/ActiveCodeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useTranslation } from "react-i18next";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface NavItem {
  label: string;
  icon: IoniconsName;
  route?: string;
  disabled?: boolean;
}

interface ProfileItem {
  label: string;
  icon: IoniconsName;
  action: () => void;
  color?: string;
  separator?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentRoute: string;
}

interface NavItemExt extends NavItem {
  codeId?: CodeId;
}

const NAV_ITEMS: NavItemExt[] = [
  { label: "sidebar.dashboard", icon: "home-outline", route: "/(app)" },
  { label: "sidebar.code", icon: "book-outline", route: "/(app)/code", codeId: "cgi" },
  { label: "Code Social", icon: "people-outline", route: "/(app)/code", codeId: "social" },
  { label: "sidebar.simulators", icon: "calculator-outline", route: "/(app)/simulateur" },
  { label: "sidebar.calendrier", icon: "calendar-outline", route: "/(app)/calendrier" },
  { label: "sidebar.chat", icon: "chatbubbles-outline", route: "/(app)/chat" },
  { label: "sidebar.auditFacture", icon: "scan-outline", route: "/(app)/audit-facture" },
];

function isRouteActive(currentRoute: string, itemRoute: string): boolean {
  if (itemRoute === "/(app)") {
    return currentRoute === "/" || currentRoute === "/(app)";
  }
  return currentRoute.startsWith(itemRoute.replace("/(app)", ""));
}

export default function Sidebar({ collapsed, onToggle, currentRoute }: SidebarProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { activeCode, setActiveCode } = useActiveCode();

  const profileItems: ProfileItem[] = [
    {
      label: t("sidebar.profile"),
      icon: "person-outline",
      action: () => router.push("/(app)/profil"),
    },
    {
      label: t("sidebar.settings"),
      icon: "settings-outline",
      action: () => router.push("/(app)/parametres"),
    },
    {
      label: t("sidebar.logout"),
      icon: "log-out-outline",
      action: () => router.replace("/(auth)/logout"),
      color: colors.danger,
      separator: true,
    },
  ];

  const isCollapsed = collapsed;
  const sidebarWidth = isCollapsed ? 60 : 220;

  const handleNavPress = (route: string, codeId?: CodeId) => {
    if (codeId) {
      setActiveCode(codeId);
    }
    router.push(route as any);
  };

  const handleProfileAction = (action: () => void) => {
    action();
  };

  return (
    <View
      style={{
        width: sidebarWidth,
        backgroundColor: colors.sidebar,
        borderRightWidth: 1,
        borderRightColor: colors.sidebarBorder,
        paddingTop: 16,
        paddingBottom: 16,
        justifyContent: "space-between",
      }}
    >
      {/* Header : logo + bouton toggle */}
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            paddingHorizontal: isCollapsed ? 0 : 16,
            paddingVertical: 12,
            backgroundColor: "#1A3A5C",
            marginBottom: 8,
          }}
        >
          {isCollapsed ? (
            <Text style={{ color: "#D4A843", fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 24 }}>C</Text>
          ) : (
            <View>
              <Text style={{ color: "#D4A843", fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 22 }}>NORMX <Text style={{ color: "#e8e6e1" }}>AI</Text></Text>
              <Text style={{ color: "rgba(232,230,225,0.6)", fontSize: 11, fontFamily: fonts.regular }}>La fiscalité augmentée par l'IA</Text>
            </View>
          )}
          {!isCollapsed && (
            <TouchableOpacity onPress={onToggle} accessibilityLabel={t("sidebar.collapse")} accessibilityRole="button">
              <Ionicons name="chevron-back-outline" size={20} color="#e8e6e1" />
            </TouchableOpacity>
          )}
        </View>

        {isCollapsed && (
          <TouchableOpacity
            onPress={onToggle}
            style={{ alignItems: "center", paddingVertical: 8, marginBottom: 4 }}
            accessibilityLabel={t("sidebar.expand")}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-forward-outline" size={20} color="#e8e6e1" />
          </TouchableOpacity>
        )}

        {/* Navigation modules */}
        {NAV_ITEMS.map((item) => {
          const routeActive = !item.disabled && item.route ? isRouteActive(currentRoute, item.route) : false;
          // Pour les items Code : actif seulement si le bon codeId est sélectionné
          const active = item.codeId ? (routeActive && activeCode === item.codeId) : routeActive;
          const disabled = !!item.disabled;

          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => {
                if (!disabled && item.route) {
                  handleNavPress(item.route, item.codeId);
                }
              }}
              disabled={disabled}
              accessibilityLabel={t(item.label)}
              accessibilityRole="button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                paddingVertical: 10,
                paddingHorizontal: isCollapsed ? 0 : 14,
                marginHorizontal: isCollapsed ? 0 : 6,
                borderRadius: 6,
                backgroundColor: active ? colors.sidebarActive : "transparent",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? colors.accent : colors.sidebarText}
              />
              {!isCollapsed && (
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      color: active ? colors.accent : colors.sidebarText,
                      fontSize: 16,
                      fontFamily: fonts.regular,
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {t(item.label)}
                  </Text>
                  {disabled && (
                    <View
                      style={{
                        backgroundColor: colors.sidebarActive,
                        
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: colors.textMuted }}>{t("common.comingSoon")}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spacer implicite via justifyContent: space-between sur le parent */}

      {/* Section profil (bas) */}
      <View>
        <View style={{ borderTopWidth: 1, borderTopColor: colors.sidebarBorder, marginBottom: 8 }} />
        {profileItems.map((item) => (
          <View key={item.label}>
            {item.separator && (
              <View style={{ borderTopWidth: 1, borderTopColor: colors.sidebarBorder, marginHorizontal: isCollapsed ? 8 : 16, marginVertical: 4 }} />
            )}
            <TouchableOpacity
              onPress={() => handleProfileAction(item.action)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                paddingVertical: 10,
                paddingHorizontal: isCollapsed ? 0 : 16,
              }}
            >
              <Ionicons name={item.icon} size={20} color={item.color || colors.sidebarText} />
              {!isCollapsed && (
                <Text
                  style={{
                    color: item.color || colors.sidebarText,
                    fontSize: 16,
                    fontFamily: fonts.regular,
                    fontWeight: item.color ? "600" : "400",
                    marginLeft: 12,
                  }}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}
