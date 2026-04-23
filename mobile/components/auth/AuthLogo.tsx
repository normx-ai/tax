import { View, Text, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Props = {
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { logoW: 140, logoH: 28, tagFont: 11, taxFont: 16 },
  md: { logoW: 170, logoH: 34, tagFont: 13, taxFont: 20 },
  lg: { logoW: 200, logoH: 40, tagFont: 13, taxFont: 22 },
};

export default function AuthLogo({ size = "md" }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const s = SIZES[size];

  return (
    <View style={{ alignItems: "center", marginBottom: size === "lg" ? 36 : 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: size === "lg" ? 8 : 6 }}>
        <View style={{ backgroundColor: "#fff", padding: 6 }}>
          <Image
            source={require("@/assets/logo-horizontal.png")}
            style={{ width: s.logoW, height: s.logoH, resizeMode: "contain" }}
          />
        </View>
        <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: s.taxFont, color: colors.primary }}>
          Tax
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: s.tagFont, color: colors.textMuted, marginTop: size === "lg" ? 6 : 4 }}>
        {t("auth.tagline")}
      </Text>
    </View>
  );
}
