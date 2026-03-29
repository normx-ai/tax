import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

interface Props {
  isMobile: boolean;
  onScrollTo?: (section: string) => void;
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 10 }}>
      <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 20 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15, color: "#e8e6e1", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1.2 }}>
      {children}
    </Text>
  );
}

export default function LandingFooter({ isMobile, onScrollTo }: Props) {
  const { t } = useTranslation();

  return (
    <View style={{ backgroundColor: "#0F2A42", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 48, paddingBottom: 0 }}>
      <View style={{ maxWidth: 1060, width: "100%", alignSelf: "center", paddingHorizontal: 24, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 36 : 0 }}>
        {/* Marque */}
        <View style={{ flex: isMobile ? undefined : 1.3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(200,160,60,0.13)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 20, color: GOLD }}>N</Text>
            </View>
            <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 19, color: "#e8e6e1" }}>
              NORMX{" "}<Text style={{ color: GOLD }}>AI</Text>
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.light, fontWeight: fontWeights.light, fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 20 }}>
            {t("landing.footerDesc")}
          </Text>
        </View>

        {/* Produit */}
        <View style={{ flex: isMobile ? undefined : 1 }}>
          <SectionTitle>{t("landing.footerProduct")}</SectionTitle>
          <FooterLink label={t("landing.footerFeatures")} onPress={() => onScrollTo?.("features")} />
          <FooterLink label={t("landing.footerPricing")} onPress={() => onScrollTo?.("tarifs")} />
          <FooterLink label={t("landing.footerContact")} onPress={() => onScrollTo?.("contact")} />
        </View>

        {/* Légal */}
        <View style={{ flex: isMobile ? undefined : 1 }}>
          <SectionTitle>{t("landing.footerLegal")}</SectionTitle>
          <FooterLink label={t("auth.terms")} onPress={() => router.push("/legal/cgu")} />
          <FooterLink label={t("auth.privacy")} onPress={() => router.push("/legal/confidentialite")} />
          <FooterLink label={t("settings.legalNotices")} onPress={() => router.push("/legal/mentions")} />
        </View>

        {/* Contact */}
        <View style={{ flex: isMobile ? undefined : 1 }}>
          <SectionTitle>{t("landing.footerContact")}</SectionTitle>
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: GOLD, lineHeight: 20, marginBottom: 10 }}>
            info-contact@normx-ai.com
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 20 }}>
            5 rue Benjamin Raspail, 60100 Creil
          </Text>
        </View>
      </View>

      {/* Barre du bas */}
      <View style={{ maxWidth: 1060, width: "100%", alignSelf: "center", paddingHorizontal: 24, marginTop: 40, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingVertical: 20, flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "center", gap: isMobile ? 8 : 0 }}>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          {t("landing.copyright")}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          {t("landing.trademark")}
        </Text>
      </View>
    </View>
  );
}
