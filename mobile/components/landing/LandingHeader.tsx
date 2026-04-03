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
  { name: "NORMX Compta", desc: "Comptabilite OHADA + IA", url: "https://app.normx-ai.com", color: BLUE, letter: "C" },
  { name: "NORMX Tax", desc: "Intelligence fiscale IA", url: "https://tax.normx-ai.com", color: PRIMARY, letter: "T" },
  { name: "NORMX Legal", desc: "Documents juridiques OHADA", url: "https://legal.normx-ai.com", color: PURPLE, letter: "L", soon: true },
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
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  minWidth: 240,
                  padding: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.1,
                  shadowRadius: 32,
                  elevation: 8,
                  zIndex: 200,
                }}
              >
                {PRODUCTS.map((p) => (
                  <TouchableOpacity
                    key={p.name}
                    onPress={() => { setDropdownOpen(false); Linking.openURL(p.url); }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: p.color, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 11, fontWeight: "900", color: "#fff" }}>{p.letter}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: DARK }}>{p.name}</Text>
                      <Text style={{ fontSize: 12, color: TEXT_SEC }}>{p.desc}</Text>
                    </View>
                    {p.soon && (
                      <View style={{ backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: "#9ca3af" }}>Bientot</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
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
