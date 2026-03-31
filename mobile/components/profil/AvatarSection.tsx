import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  initials: string;
  email: string;
  colors: ThemeColors;
}

export default function AvatarSection({ initials, email, colors }: Props) {
  return (
    <View style={{ alignItems: "center", marginBottom: 28 }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 32, fontFamily: fonts.extraBold, fontWeight: fontWeights.extraBold }}>
          {initials}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
        <Text style={{ color: colors.textSecondary, fontSize: 16, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
          {email}
        </Text>
      </View>
    </View>
  );
}
