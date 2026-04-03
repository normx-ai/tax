import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useAuthStore } from "@/lib/store/auth";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";
const TEXT_SEC = "#6b7280";
const PURPLE = "#7c3aed";
const BLUE = "#2563eb";

const PRODUCTS = [
  { name: "NORMX AI", desc: "Plateforme principale", url: "https://normx-ai.com", color: "#08080d", letter: "N" },
  { name: "NORMX Compta", desc: "Comptabilite SYSCOHADA, etats financiers et paie", url: "https://app.normx-ai.com", color: BLUE, letter: "C" },
  { name: "NORMX Tax", desc: "Simulateur fiscal CGI 2026 et assistant IA", url: "https://tax.normx-ai.com", color: PRIMARY, letter: "T" },
  { name: "NORMX Legal", desc: "Documents juridiques OHADA automatises", url: "https://legal.normx-ai.com", color: PURPLE, letter: "L", soon: true },
];

interface Props {
  isMobile: boolean;
  onScrollTo?: (section: string) => void;
}

export default function LandingHeader({ isMobile, onScrollTo }: Props) {
  const login = useAuthStore((s) => s.login);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<View>(null);

  // Close dropdown on outside click (web only)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: MouseEvent) => {
      const el = dropdownRef.current as unknown as HTMLElement | null;
      if (el && !el.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 64,
        paddingHorizontal: 24,
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.08)",
        backgroundColor: "rgba(255,255,255,0.92)",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: PRIMARY,
          }}
        >
          <Text style={{ fontFamily: fonts.black, fontWeight: fontWeights.black, fontSize: 16, color: DARK }}>
            N
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 20, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: DARK, lineHeight: 22 }}>
            NORMX <Text style={{ color: PRIMARY }}>Tax</Text>
          </Text>
          <Text style={{ fontSize: 11, color: TEXT_SEC, fontFamily: fonts.regular, lineHeight: 14 }}>
            La fiscalité augmentée par l'IA
          </Text>
        </View>
      </View>

      {/* Navigation */}
      {!isMobile && (
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <TouchableOpacity onPress={() => onScrollTo?.("features")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Fonctionnalités
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onScrollTo?.("tarifs")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Tarifs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onScrollTo?.("contact")} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
            <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
              Contact
            </Text>
          </TouchableOpacity>

          {/* Dropdown Produits */}
          <View ref={dropdownRef} style={{ position: "relative" }}>
            <TouchableOpacity
              onPress={() => setDropdownOpen(!dropdownOpen)}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 14, color: "#6b7280", fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
                Produits ▾
              </Text>
            </TouchableOpacity>
            {dropdownOpen && (
              <View
                style={{
                  position: "absolute",
                  top: "100%",
                  right: -100,
                  marginTop: 4,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.08)",
                  borderRadius: 16,
                  width: 520,
                  padding: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 20 },
                  shadowOpacity: 0.12,
                  shadowRadius: 60,
                  elevation: 12,
                  zIndex: 200,
                }}
              >
                {/* Header */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: DARK, marginBottom: 4 }}>Produits</Text>
                  <Text style={{ fontSize: 13, color: TEXT_SEC }}>Suite logicielle pour les professionnels de l'espace OHADA</Text>
                </View>
                {/* Grid 2 colonnes */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                  {PRODUCTS.map((p) => (
                    <TouchableOpacity
                      key={p.name}
                      onPress={() => { setDropdownOpen(false); Linking.openURL(p.url); }}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        width: "48%",
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: p.color, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 14, fontWeight: "900", color: "#fff" }}>{p.letter}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: DARK }}>{p.name}</Text>
                          {p.soon && (
                            <View style={{ backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 9, fontWeight: "600", color: "#9ca3af" }}>Bientot</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 16, marginTop: 2 }}>{p.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Footer */}
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", alignItems: "center" }}>
                  <TouchableOpacity onPress={() => { setDropdownOpen(false); Linking.openURL("https://normx-ai.com#products"); }}>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: PRIMARY }}>Voir tous les produits →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* CTA → Keycloak */}
      <TouchableOpacity
        onPress={login}
        style={{
          paddingVertical: 9,
          paddingHorizontal: isMobile ? 16 : 22,
          borderRadius: 8,
          backgroundColor: DARK,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {isMobile ? (
          <Ionicons name="log-in-outline" size={20} color="#ffffff" />
        ) : (
          <Text style={{ color: "#ffffff", fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 14 }}>
            Connexion
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
