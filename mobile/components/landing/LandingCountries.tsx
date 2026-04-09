import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

type Status = "available" | "published";

interface CodeEntry {
  id: string;
  name: string;
  cc: string;
  status: Status;
  region: string;
  codeLabel: string;
  badge: string;
}

const entries: CodeEntry[] = [
  { id: "CG-cgi", name: "Congo-Brazzaville", cc: "CG", status: "available", region: "CEMAC", codeLabel: "CGI 242", badge: "Disponible" },
  { id: "CG-social", name: "Congo-Brazzaville", cc: "CG", status: "published", region: "CEMAC", codeLabel: "Code Social", badge: "2025" },
  { id: "CG-hydro", name: "Congo-Brazzaville", cc: "CG", status: "published", region: "CEMAC", codeLabel: "Hydrocarbures", badge: "2025" },
  { id: "CG-douanes", name: "Congo-Brazzaville", cc: "CG", status: "published", region: "CEMAC", codeLabel: "Code Douanes", badge: "2025" },
  { id: "GA-cgi", name: "Gabon", cc: "GA", status: "published", region: "CEMAC", codeLabel: "CGI 241", badge: "CGI 2026" },
  { id: "CM-cgi", name: "Cameroun", cc: "CM", status: "published", region: "CEMAC", codeLabel: "CGI 237", badge: "CGI 2026" },
  { id: "TD-cgi", name: "Tchad", cc: "TD", status: "published", region: "CEMAC", codeLabel: "CGI 235", badge: "CGI 2026" },
  { id: "CF-cgi", name: "Centrafrique", cc: "CF", status: "published", region: "CEMAC", codeLabel: "CGI 236", badge: "CGI 2026" },
  { id: "CD-cgi", name: "R.D. Congo", cc: "CD", status: "published", region: "OHADA", codeLabel: "CGI 243", badge: "CGI 2026" },
  { id: "SN-cgi", name: "Sénégal", cc: "SN", status: "published", region: "UEMOA", codeLabel: "CGI 221", badge: "CGI 2026" },
  { id: "CI-cgi", name: "Côte d'Ivoire", cc: "CI", status: "published", region: "UEMOA", codeLabel: "CGI 225", badge: "CGI 2026" },
  { id: "ML-cgi", name: "Mali", cc: "ML", status: "published", region: "UEMOA", codeLabel: "CGI 223", badge: "CGI 2026" },
  { id: "BF-cgi", name: "Burkina Faso", cc: "BF", status: "published", region: "UEMOA", codeLabel: "CGI 226", badge: "CGI 2026" },
  { id: "BJ-cgi", name: "Bénin", cc: "BJ", status: "published", region: "UEMOA", codeLabel: "CGI 229", badge: "CGI 2026" },
  { id: "TG-cgi", name: "Togo", cc: "TG", status: "published", region: "UEMOA", codeLabel: "CGI 228", badge: "CGI 2026" },
  { id: "TG-social", name: "Togo", cc: "TG", status: "published", region: "UEMOA", codeLabel: "Code Social", badge: "2025" },
  { id: "MG-cgi", name: "Madagascar", cc: "MG", status: "published", region: "Autre", codeLabel: "CGI 261", badge: "CGI 2026" },
  { id: "MR-cgi", name: "Mauritanie", cc: "MR", status: "published", region: "Autre", codeLabel: "CGI 222", badge: "CGI 2026" },
];

const regionColors: Record<string, { bg: string; border: string; text: string }> = {
  CEMAC: { bg: "rgba(200,160,60,0.12)", border: "rgba(200,160,60,0.3)", text: "#b8860b" },
  UEMOA: { bg: "rgba(37,99,235,0.1)", border: "rgba(37,99,235,0.25)", text: "#2563eb" },
  OHADA: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)", text: "#7c3aed" },
  Autre: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)", text: "#7c3aed" },
};

function toFlag(cc: string): string {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

interface Props {
  isMobile: boolean;
  loaded: boolean;
}

export default function LandingCountries({ isMobile, loaded }: Props) {
  const [region, setRegion] = useState("Tous");
  const [query, setQuery] = useState("");

  const filtered = entries.filter((c) => {
    if (region !== "Tous" && c.region !== region) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) || c.codeLabel.toLowerCase().includes(q)
    );
  });

  const regions = ["Tous", "CEMAC", "UEMOA", "Autre"];

  return (
    <View style={{ paddingVertical: 40, paddingHorizontal: 16 }}>
      <Text
        style={{
          fontFamily: fonts.headingBlack,
          fontWeight: fontWeights.headingBlack,
          fontSize: isMobile ? 26 : 40,
          color: "#e8e6e1",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Choisissez votre pays
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: "#5a5a65",
          fontSize: 16,
          fontFamily: fonts.light,
          fontWeight: fontWeights.light,
          marginBottom: 32,
        }}
      >
        Un nouveau pays chaque trimestre
      </Text>

      {/* Region filters */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {regions.map((r) => {
          const active = region === r;
          const rc = r !== "Tous" ? regionColors[r] : null;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRegion(r)}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 20,
                borderRadius: 100,
                backgroundColor: active
                  ? rc
                    ? rc.bg
                    : "rgba(255,255,255,0.06)"
                  : "transparent",
                borderWidth: 1,
                borderColor: active
                  ? rc
                    ? rc.border
                    : "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: fonts.semiBold,
                  fontWeight: fontWeights.semiBold,
                  color: active
                    ? rc
                      ? rc.text
                      : "#e8e6e1"
                    : "#5a5a65",
                }}
              >
                {r === "Autre" ? "Autres OHADA" : r}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={{ alignItems: "center", marginBottom: 36 }}>
        <TextInput
          placeholder="Rechercher un pays ou indicatif..."
          placeholderTextColor="#3a3a45"
          value={query}
          onChangeText={setQuery}
          style={{
            width: isMobile ? "100%" : 380,
            maxWidth: "100%",
            paddingVertical: 11,
            paddingHorizontal: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            backgroundColor: "rgba(255,255,255,0.015)",
            color: "#e8e6e1",
            fontSize: 16,
            fontFamily: fonts.regular,
          }}
        />
      </View>

      {/* Country grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 14,
          maxWidth: 1060,
          alignSelf: "center",
          justifyContent: "center",
        }}
      >
        {filtered.map((c) => {
          const rc = regionColors[c.region] || regionColors.Autre;
          const isAvailable = c.status === "available";
          const Wrapper = isAvailable ? TouchableOpacity : View;
          return (
            <Wrapper
              key={c.id}
              {...(isAvailable ? { onPress: () => router.push("/cgi242"), activeOpacity: 0.7 } : {})}
              style={{
                width: isMobile ? "47%" : 185,
                borderRadius: 16,
                padding: isMobile ? 16 : 22,
                alignItems: "center",
                backgroundColor: isAvailable
                  ? "rgba(200,160,60,0.05)"
                  : "rgba(255,255,255,0.015)",
                borderWidth: 1,
                borderColor: isAvailable
                  ? "rgba(200,160,60,0.2)"
                  : "rgba(255,255,255,0.06)",
                opacity: loaded ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 38,
                  marginBottom: 8,
                  opacity: isAvailable ? 1 : 0.8,
                }}
              >
                {toFlag(c.cc)}
              </Text>
              <Text
                style={{
                  fontSize: isMobile ? 18 : 22,
                  fontFamily: fonts.extraBold,
                  fontWeight: fontWeights.extraBold,
                  color: isAvailable ? GOLD : "#2563eb",
                  marginBottom: 3,
                  textAlign: "center",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {c.codeLabel}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: fonts.semiBold,
                  fontWeight: fontWeights.semiBold,
                  marginBottom: 8,
                  color: isAvailable ? "#e8e6e1" : "#5a5a65",
                  textAlign: "center",
                }}
              >
                {c.name}
              </Text>
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 14,
                  borderRadius: 100,
                  backgroundColor: isAvailable
                    ? "rgba(22,163,74,0.1)"
                    : "rgba(200,160,60,0.08)",
                  borderWidth: 1,
                  borderColor: isAvailable
                    ? "rgba(22,163,74,0.2)"
                    : "rgba(200,160,60,0.2)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.bold,
                    fontWeight: fontWeights.bold,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    color: isAvailable ? "#16a34a" : GOLD,
                  }}
                >
                  {c.badge}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: rc.text,
                  marginTop: 6,
                  fontFamily: fonts.medium,
                  fontWeight: fontWeights.medium,
                }}
              >
                {c.region}
              </Text>
            </Wrapper>
          );
        })}
      </View>

      {filtered.length === 0 && (
        <Text
          style={{
            textAlign: "center",
            padding: 40,
            color: "#3a3a45",
            fontFamily: fonts.regular,
          }}
        >
          Aucun pays ne correspond à votre recherche.
        </Text>
      )}
    </View>
  );
}
