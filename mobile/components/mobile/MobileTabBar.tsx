import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export type TabKey = "home" | "cgi" | "social" | "sim" | "cal" | "chat" | "plus";

type Tab = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: Tab[] = [
  { key: "home", label: "Home", icon: "home-outline" },
  { key: "cgi", label: "CGI", icon: "book-outline" },
  { key: "social", label: "Social", icon: "people-outline" },
  { key: "sim", label: "Simul.", icon: "stats-chart-outline" },
  { key: "chat", label: "IA", icon: "chatbubbles-outline" },
  { key: "plus", label: "Plus", icon: "ellipsis-horizontal-outline" },
];

type Props = {
  active: TabKey;
  onTabPress: (tab: TabKey) => void;
};

export default function MobileTabBar({ active, onTabPress }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={{ alignItems: "center", gap: 3, position: "relative" }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive && (
              <View
                style={{
                  position: "absolute",
                  top: -8,
                  width: 20,
                  height: 3,
                  backgroundColor: colors.primary,
                }}
              />
            )}
            <Ionicons
              name={isActive ? (tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : tab.icon}
              size={20}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text
              style={{
                fontFamily: isActive ? fonts.bold : fonts.medium,
                fontWeight: isActive ? fontWeights.bold : fontWeights.medium,
                fontSize: 12,
                color: isActive ? colors.primary : colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
