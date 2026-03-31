import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from '@/lib/theme/colors';

interface LogoutAllButtonProps {
  actionLoading: boolean;
  onLogoutAll: () => void;
  colors: ThemeColors;
}

export default function LogoutAllButton({
  actionLoading,
  onLogoutAll,
  colors,
}: LogoutAllButtonProps) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 20,
      }}
    >
      <TouchableOpacity
        onPress={onLogoutAll}
        disabled={actionLoading}
        style={{
          backgroundColor: `${colors.danger}15`,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#dc2626"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{ color: "#dc2626", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16 }}
          >
            {t("security.logoutAllDevices")}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
