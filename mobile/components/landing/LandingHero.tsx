import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useEffect } from "react";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useAuthStore } from "@/lib/store/auth";

const PRIMARY = "#D4A843";

// Injecter les animations CSS au montage (web uniquement)
function useInjectAnimations() {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = "normx-hero-animations";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes heroFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes heroSlideRight { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes heroPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0); } 50% { box-shadow: 0 0 12px 2px rgba(212,168,67,0.12); } }
      .hero-stat { animation: heroFadeUp 0.5s ease-out both; }
      .hero-stat:nth-child(1) { animation-delay: 0.3s; }
      .hero-stat:nth-child(2) { animation-delay: 0.5s; }
      .hero-stat:nth-child(3) { animation-delay: 0.7s; }
      .hero-sidebar-item { animation: heroSlideRight 0.4s ease-out both; }
      .hero-sidebar-item:nth-child(1) { animation-delay: 0.2s; }
      .hero-sidebar-item:nth-child(2) { animation-delay: 0.3s; }
      .hero-sidebar-item:nth-child(3) { animation-delay: 0.4s; }
      .hero-sidebar-item:nth-child(4) { animation-delay: 0.5s; }
      .hero-sidebar-item:nth-child(5) { animation-delay: 0.6s; }
      .hero-sidebar-item:nth-child(6) { animation-delay: 0.7s; }
      .hero-sidebar-item:nth-child(7) { animation-delay: 0.8s; }
      .hero-sidebar-item:nth-child(8) { animation-delay: 0.9s; }
      .hero-row { animation: heroFadeUp 0.4s ease-out both; }
      .hero-row:nth-child(1) { animation-delay: 0.8s; }
      .hero-row:nth-child(2) { animation-delay: 0.9s; }
      .hero-row:nth-child(3) { animation-delay: 1.0s; }
      .hero-row:nth-child(4) { animation-delay: 1.1s; }
      .hero-row:nth-child(5) { animation-delay: 1.2s; }
      .hero-row:nth-child(6) { animation-delay: 1.3s; }
      .hero-row:nth-child(7) { animation-delay: 1.4s; }
      .hero-row:nth-child(8) { animation-delay: 1.5s; }
      .hero-row:nth-child(9) { animation-delay: 1.6s; }
      .hero-macbook { animation: heroPulse 3s ease-in-out 2s infinite; }
    `;
    document.head.appendChild(style);
  }, []);
}
const DARK = "#0F2A42";
const TEXT_SEC = "#6b7280";
const BG_WARM = "#faf8f5";

interface Props {
  isMobile: boolean;
  loaded: boolean;
}

export default function LandingHero({ isMobile, loaded }: Props) {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  useInjectAnimations();

  const stats = [
    { value: "+3 700", label: "Articles de loi" },
    { value: "16", label: "Simulateurs fiscaux" },
    { value: "IA", label: "Assistant intelligent" },
    { value: "2", label: "Codes : CGI + Social" },
  ];

  return (
    <View style={{ paddingTop: isMobile ? 60 : 100, paddingBottom: 60, paddingHorizontal: 16, backgroundColor: BG_WARM }}>
      {/* Hero 2 colonnes */}
      <View style={{
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        gap: isMobile ? 40 : 60,
      }}>
        {/* Colonne gauche — Mockup CSS Tax */}
        {!isMobile && (
          <View style={{ flex: 1, maxWidth: 540 }}>
            {/* MacBook Air frame */}
            <View style={{ backgroundColor: "#e2e2e2", borderRadius: 14, padding: 6, paddingBottom: 0, borderWidth: 1, borderColor: "#d4d4d4", ...(Platform.OS === "web" ? { animationName: "heroPulse", animationDuration: "3s", animationIterationCount: "infinite", animationDelay: "2s", animationTimingFunction: "ease-in-out" } as Record<string, string> : {}) }}>
              {/* Caméra notch */}
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#1a1a1a", alignSelf: "center", marginBottom: 4, borderWidth: 1, borderColor: "#333" }} />
              {/* Ecran */}
              <View style={{ backgroundColor: "#fff", borderRadius: 2, overflow: "hidden" }}>
                {/* Topbar mockup */}
                <View style={{ backgroundColor: DARK, height: 32, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b" }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" }} />
                  <Text style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>NORMX Tax — Simulateur ITS</Text>
                </View>
                {/* Content */}
                <View style={{ flexDirection: "row" }}>
                  {/* Sidebar */}
                  <View style={{ width: 110, backgroundColor: DARK, paddingVertical: 10, paddingHorizontal: 8, gap: 5, minHeight: 320 }}>
                    {["Dashboard", "CGI", "Code Social", "Simulateurs", "Calendrier", "Chat IA", "Audit Facture", "Mon profil"].map((item, i) => (
                      <View key={i} style={{ paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, backgroundColor: i === 3 ? "rgba(212,168,67,0.2)" : "transparent", ...(Platform.OS === "web" ? { animationName: "heroSlideRight", animationDuration: "0.4s", animationFillMode: "both", animationDelay: `${0.2 + i * 0.1}s` } as Record<string, string> : {}) }}>
                        <Text style={{ fontSize: 9, color: i === 3 ? PRIMARY : "rgba(255,255,255,0.5)", fontWeight: i === 3 ? "700" : "400" }}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Main */}
                  <View style={{ flex: 1, padding: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1f2937", marginBottom: 10 }}>Simulateur ITS</Text>
                    {/* Stats row */}
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                      {[{ val: "1 308 756", lbl: "Brut mensuel", color: PRIMARY }, { val: "48 000", lbl: "CNSS 4%", color: "#ef4444" }, { val: "111 828", lbl: "ITS mensuel", color: "#ef4444" }].map((s, i) => (
                        <View key={i} style={{ flex: 1, backgroundColor: "#f9fafb", padding: 8, borderRadius: 4, ...(Platform.OS === "web" ? { animationName: "heroFadeUp", animationDuration: "0.5s", animationFillMode: "both", animationDelay: `${0.3 + i * 0.2}s` } as Record<string, string> : {}) }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: s.color }}>{s.val}</Text>
                          <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>{s.lbl}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Table */}
                    <View style={{ backgroundColor: "#f9fafb", borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6, backgroundColor: "#f3f4f6" }}>
                        <Text style={{ flex: 2, fontSize: 7, fontWeight: "700", color: "#6b7280" }}>RUBRIQUE</Text>
                        <Text style={{ flex: 1, fontSize: 7, fontWeight: "700", color: "#6b7280", textAlign: "right" }}>MONTANT</Text>
                      </View>
                      {[
                        { label: "SALAIRE BRUT MENSUEL", val: "1 308 756", color: "#1f2937" },
                        { label: "C.N.S.S. MENSUEL - 4%", val: "- 48 000", color: "#ef4444" },
                        { label: "NET IMPOSABLE 80%", val: "1 008 605", color: "#1f2937" },
                        { label: "SALAIRE BRUT ANNUEL", val: "15 705 072", color: "#1f2937" },
                        { label: "C.N.S.S. ANNUEL", val: "- 576 000", color: "#ef4444" },
                        { label: "NET IMPOSABLE ANNUEL", val: "12 103 258", color: "#1f2937" },
                        { label: "QUOTIENT FAMILIAL", val: "3 458 074", color: PRIMARY },
                        { label: "ITS ANNUEL", val: "1 341 939", color: "#1f2937" },
                        { label: "ITS MENSUEL", val: "111 828", color: "#ef4444" },
                      ].map((row, i) => (
                        <View key={i} style={{ flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", ...(Platform.OS === "web" ? { animationName: "heroFadeUp", animationDuration: "0.4s", animationFillMode: "both", animationDelay: `${0.8 + i * 0.1}s` } as Record<string, string> : {}) }}>
                          <Text style={{ flex: 2, fontSize: 9, color: "#374151" }}>{row.label}</Text>
                          <Text style={{ flex: 1, fontSize: 9, fontWeight: "600", color: row.color, textAlign: "right" }}>{row.val}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {/* MacBook Air base — wedge design */}
            <View style={{ height: 8, backgroundColor: "#d1d1d1", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginHorizontal: 20 }}>
              <View style={{ width: 60, height: 3, backgroundColor: "#b0b0b0", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, alignSelf: "center" }} />
            </View>
            {/* Ombre */}
            <View style={{ height: 4, marginHorizontal: 40, ...(Platform.OS === "web" ? { background: "radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, transparent 70%)" } as Record<string, string> : {}) }} />
          </View>
        )}

        {/* Colonne droite — texte */}
        <View style={{ flex: 1 }}>
          {/* Badge */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(212,168,67,0.1)",
            borderRadius: 100,
            paddingVertical: 8,
            paddingHorizontal: 20,
            marginBottom: 24,
            alignSelf: isMobile ? "center" : "flex-start",
          }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: PRIMARY, letterSpacing: 0.5 }}>
              La fiscalité augmentée par l'IA
            </Text>
          </View>

          {/* Title */}
          <Text style={{
            fontFamily: fonts.bold,
            fontWeight: fontWeights.bold,
            fontSize: isMobile ? 30 : 44,
            color: DARK,
            textAlign: isMobile ? "center" : "left",
            lineHeight: isMobile ? 36 : 52,
            marginBottom: 16,
            letterSpacing: -0.5,
          }}>
            {"Simulez vos impôts,\naccédez au "}
            <Text style={{ color: PRIMARY }}>code fiscal et social</Text>
          </Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: isMobile ? 15 : 17,
            color: TEXT_SEC,
            maxWidth: 480,
            textAlign: isMobile ? "center" : "left",
            lineHeight: isMobile ? 24 : 28,
            fontFamily: fonts.regular,
            marginBottom: 32,
          }}>
            Simulateurs fiscaux et sociaux, assistant IA et +3 700 articles indexés — Code Général des Impôts et Code Social du Congo.
          </Text>

          {/* CTA buttons */}
          <View style={{ flexDirection: "row", gap: 12, alignItems: isMobile ? "center" : "flex-start", justifyContent: isMobile ? "center" : "flex-start", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={login}
              style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, backgroundColor: PRIMARY }}
            >
              <Text style={{ color: DARK, fontSize: 15, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
                Se connecter →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={register}
              style={{ paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }}
            >
              <Text style={{ color: DARK, fontSize: 15, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social proof */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Text style={{ fontSize: 13, color: TEXT_SEC }}>4.7/5</Text>
            <Text style={{ fontSize: 13, color: TEXT_SEC }}>Disponible sur Google Play</Text>
          </View>
        </View>

      </View>

      {/* Stats bar */}
      <View style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: isMobile ? 20 : 48,
        flexWrap: "wrap",
        backgroundColor: DARK,
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: isMobile ? 16 : 48,
        width: "100%",
        maxWidth: 800,
        alignSelf: "center",
        marginTop: 48,
      }}>
        {stats.map((stat, i) => (
          <View key={i} style={{ alignItems: "center", opacity: loaded ? 1 : 0 }}>
            <Text style={{ fontSize: isMobile ? 24 : 32, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: PRIMARY }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4, fontFamily: fonts.medium, fontWeight: fontWeights.medium }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
