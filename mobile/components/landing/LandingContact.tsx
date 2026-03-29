import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

interface Props {
  isMobile: boolean;
}

export default function LandingContact({ isMobile }: Props) {
  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 24, backgroundColor: "#ffffff" }}>
      <Text
        style={{
          fontFamily: fonts.headingBlack,
          fontWeight: fontWeights.headingBlack,
          fontSize: isMobile ? 26 : 40,
          color: "#0F2A42",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Contactez-nous
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: "#5a6a7a",
          fontSize: 17,
          fontFamily: fonts.light,
          fontWeight: fontWeights.light,
          marginBottom: 40,
        }}
      >
        Une question ? Notre équipe vous répond sous 24h
      </Text>

      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: 20,
          maxWidth: 960,
          alignSelf: "center",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {/* Email */}
        <TouchableOpacity
          onPress={() => Linking.openURL("mailto:info-contact@normx-ai.com")}
          activeOpacity={0.7}
          style={{
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? undefined : 220,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(26,58,92,0.15)",
            backgroundColor: "rgba(26,58,92,0.03)",
            padding: isMobile ? 28 : 36,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "rgba(26,58,92,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="mail-outline" size={24} color="#0F2A42" />
          </View>
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontWeight: fontWeights.semiBold,
              fontSize: 17,
              color: "#0F2A42",
              marginBottom: 6,
            }}
          >
            Email
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: fonts.regular,
              fontWeight: fontWeights.regular,
              fontSize: 14,
              color: "#0F2A42",
              textAlign: "center",
            }}
          >
            info-contact@normx-ai.com
          </Text>
        </TouchableOpacity>

        {/* Localisation */}
        <View
          style={{
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? undefined : 220,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            backgroundColor: "#f8f9fa",
            padding: isMobile ? 28 : 36,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "rgba(26,58,92,0.06)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="location-outline" size={24} color="#5a5a65" />
          </View>
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontWeight: fontWeights.semiBold,
              fontSize: 17,
              color: "#0F2A42",
              marginBottom: 6,
            }}
          >
            Siège
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontWeight: fontWeights.regular,
              fontSize: 16,
              color: "#5a6a7a",
              textAlign: "center",
            }}
          >
            5 rue Benjamin Raspail, 60100 Creil
          </Text>
        </View>

        {/* Horaires */}
        <View
          style={{
            flex: isMobile ? undefined : 1,
            minWidth: isMobile ? undefined : 220,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            backgroundColor: "#f8f9fa",
            padding: isMobile ? 28 : 36,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "rgba(26,58,92,0.06)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="time-outline" size={24} color="#5a5a65" />
          </View>
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontWeight: fontWeights.semiBold,
              fontSize: 17,
              color: "#0F2A42",
              marginBottom: 6,
            }}
          >
            Support
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontWeight: fontWeights.regular,
              fontSize: 16,
              color: "#5a6a7a",
              textAlign: "center",
            }}
          >
            Lun — Ven, 8h — 18h (WAT)
          </Text>
        </View>
      </View>
    </View>
  );
}
