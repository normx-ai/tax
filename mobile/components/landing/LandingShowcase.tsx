import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";
const TEXT_SEC = "#6b7280";
const GREEN = "#059669";
const BLUE = "#2563eb";
const PURPLE = "#7c3aed";
const ORANGE = "#d97706";

interface Props {
  isMobile: boolean;
}

function FeatureSection({
  isMobile,
  reverse,
  label,
  labelColor,
  title,
  description,
  checks,
  mockupIcon,
  mockupColor,
  mockupTitle,
  mockupLines,
  customMockup,
}: {
  isMobile: boolean;
  reverse?: boolean;
  label: string;
  labelColor: string;
  title: string;
  description: string;
  checks: string[];
  mockupIcon: keyof typeof Ionicons.glyphMap;
  mockupColor: string;
  mockupTitle: string;
  mockupLines: string[];
  customMockup?: React.ReactNode;
}) {
  const content = (
    <View style={{ flex: 1, minWidth: 280 }}>
      <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: labelColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        {label}
      </Text>
      <Text style={{ fontSize: isMobile ? 24 : 32, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: DARK, lineHeight: isMobile ? 30 : 40, marginBottom: 16 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 15, color: TEXT_SEC, lineHeight: 24, marginBottom: 24, fontFamily: fonts.regular }}>
        {description}
      </Text>
      {checks.map((c, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <Ionicons name="checkmark-circle" size={20} color={GREEN} style={{ marginTop: 2 }} />
          <Text style={{ fontSize: 15, color: DARK, fontFamily: fonts.regular, flex: 1 }}>{c}</Text>
        </View>
      ))}
    </View>
  );

  const mockup = (
    <View style={{ flex: 1, minWidth: 280 }}>
      <View style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        overflow: "hidden",
      }}>
        {/* Barre de fenetre */}
        <View style={{ height: 36, backgroundColor: "#f3f4f6", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)", flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f59e0b" }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" }} />
        </View>
        {/* Contenu mockup */}
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${mockupColor}15`, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={mockupIcon} size={20} color={mockupColor} />
            </View>
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: DARK }}>{mockupTitle}</Text>
          </View>
          {mockupLines.map((line, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
              <Text style={{ fontSize: 12, color: TEXT_SEC, fontFamily: fonts.regular }}>{line.split("|")[0]}</Text>
              <Text style={{ fontSize: 12, color: DARK, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>{line.split("|")[1] || ""}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{
      flexDirection: isMobile ? "column" : (reverse ? "row-reverse" : "row"),
      gap: isMobile ? 32 : 60,
      paddingVertical: 48,
      paddingHorizontal: 24,
      maxWidth: 1100,
      alignSelf: "center",
      width: "100%",
    }}>
      {content}
      {customMockup || mockup}
    </View>
  );
}

function IPhoneSimulatorMockup() {
  return (
    <View style={{ flex: 1, minWidth: 240, alignItems: "center" }}>
      {/* iPhone frame */}
      <View style={{
        backgroundColor: "#1a1a1e",
        borderRadius: 32,
        padding: 8,
        maxWidth: 280,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      }}>
        {/* Notch */}
        <View style={{ width: 80, height: 20, borderRadius: 12, backgroundColor: "#1a1a1e", alignSelf: "center", marginBottom: -10, zIndex: 1 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#333", alignSelf: "center", marginTop: 6 }} />
        </View>
        {/* Screen */}
        <View style={{ backgroundColor: "#faf8f5", borderRadius: 24, overflow: "hidden" }}>
          {/* Status bar */}
          <View style={{ height: 18, backgroundColor: DARK, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 2 }}>
            <Text style={{ fontSize: 8, fontWeight: "600", color: "rgba(255,255,255,0.7)" }}>9:41</Text>
            <View style={{ flexDirection: "row", gap: 3 }}>
              <Ionicons name="cellular" size={8} color="rgba(255,255,255,0.7)" />
              <Ionicons name="wifi" size={8} color="rgba(255,255,255,0.7)" />
              <Ionicons name="battery-full" size={8} color="rgba(255,255,255,0.7)" />
            </View>
          </View>

          {/* App header */}
          <View style={{ backgroundColor: DARK, paddingVertical: 8, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.6)" />
            <Ionicons name="calculator" size={14} color={PRIMARY} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Simulateur ITS</Text>
          </View>

          {/* Formulaire */}
          <View style={{ padding: 12, gap: 8 }}>
            {/* Champ salaire */}
            <View>
              <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 2 }}>Salaire brut mensuel</Text>
              <View style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: DARK }}>1 308 756</Text>
                <Text style={{ fontSize: 9, color: "#9ca3af" }}>FCFA</Text>
              </View>
            </View>

            {/* Situation */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 2 }}>Situation</Text>
                <View style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 9, color: DARK }}>Marie</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 2 }}>Enfants</Text>
                <View style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 9, color: DARK }}>3</Text>
                </View>
              </View>
            </View>

            {/* Separator */}
            <View style={{ height: 1, backgroundColor: `${PRIMARY}30`, marginVertical: 2 }} />

            {/* Resultats */}
            <View style={{ backgroundColor: `${PRIMARY}08`, borderRadius: 8, padding: 10, gap: 5, borderWidth: 1, borderColor: `${PRIMARY}20` }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: PRIMARY, letterSpacing: 1 }}>RESULTATS</Text>
              {[
                { label: "CNSS mensuel (4%)", val: "48 000", color: "#ef4444" },
                { label: "Net imposable 80%", val: "1 008 605", color: DARK },
                { label: "Parts fiscales", val: "3,5", color: PRIMARY },
                { label: "ITS mensuel", val: "111 828", color: "#ef4444" },
                { label: "Net a payer", val: "1 148 928", color: "#059669" },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 8, color: "#6b7280" }}>{r.label}</Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: r.color }}>{r.val}</Text>
                </View>
              ))}
            </View>

            {/* Reference article */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center", marginTop: 2 }}>
              <Ionicons name="document-text-outline" size={10} color="#9ca3af" />
              <Text style={{ fontSize: 7, color: "#9ca3af" }}>Art. 116-G CGI 2026 — Bareme ITS</Text>
            </View>
          </View>
        </View>

        {/* Home indicator */}
        <View style={{ width: 60, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginTop: 6 }} />
      </View>
    </View>
  );
}

function MacBookSocialMockup() {
  return (
    <View style={{ flex: 1, minWidth: 280 }}>
      {/* MacBook Air frame */}
      <View style={{ backgroundColor: "#e2e2e2", borderRadius: 14, padding: 6, paddingBottom: 0, borderWidth: 1, borderColor: "#d4d4d4" }}>
        {/* Camera */}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#1a1a1a", alignSelf: "center", marginBottom: 4, borderWidth: 1, borderColor: "#333" }} />
        {/* Screen */}
        <View style={{ backgroundColor: "#faf8f5", borderRadius: 2, overflow: "hidden" }}>
          {/* Topbar */}
          <View style={{ backgroundColor: DARK, height: 28, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#ef4444" }} />
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#f59e0b" }} />
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" }} />
            <Text style={{ flex: 1, textAlign: "center", fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>NORMX Tax — Code Social</Text>
          </View>

          {/* Book layout - 2 pages */}
          <View style={{ flexDirection: "row", minHeight: 300 }}>
            {/* Page gauche - Sommaire */}
            <View style={{ flex: 1, backgroundColor: "#fffdf7", padding: 14, borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.08)" }}>
              {/* Titre du livre */}
              <View style={{ alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: `${PURPLE}20` }}>
                <Ionicons name="book" size={18} color={PURPLE} />
                <Text style={{ fontSize: 10, fontWeight: "800", color: DARK, marginTop: 4, textAlign: "center" }}>CODE DU TRAVAIL</Text>
                <Text style={{ fontSize: 7, color: "#9ca3af", marginTop: 2 }}>Republique du Congo</Text>
              </View>

              {/* Sommaire */}
              <Text style={{ fontSize: 8, fontWeight: "700", color: PURPLE, letterSpacing: 1, marginBottom: 6 }}>SOMMAIRE</Text>
              {[
                { num: "I", title: "Dispositions generales" },
                { num: "II", title: "Contrat de travail" },
                { num: "III", title: "Salaire" },
                { num: "IV", title: "Conditions de travail" },
                { num: "V", title: "Hygiene et securite" },
                { num: "VI", title: "Organismes et moyens" },
                { num: "VII", title: "Syndicats professionnels" },
                { num: "VIII", title: "Differends du travail" },
                { num: "IX", title: "Penalites" },
                { num: "X", title: "Dispositions transitoires" },
              ].map((t, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 3, alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 7, color: PURPLE, fontWeight: "700", width: 18 }}>T.{t.num}</Text>
                  <Text style={{ fontSize: 7, color: "#4b5563", flex: 1 }}>{t.title}</Text>
                </View>
              ))}

              <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" }}>
                <Text style={{ fontSize: 7, color: "#9ca3af", textAlign: "center" }}>247 articles</Text>
              </View>
            </View>

            {/* Page droite - Article ouvert */}
            <View style={{ flex: 1, backgroundColor: "#fffef9", padding: 14 }}>
              {/* Breadcrumb */}
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Text style={{ fontSize: 6, color: "#9ca3af" }}>Titre II</Text>
                <Text style={{ fontSize: 6, color: "#9ca3af" }}>/</Text>
                <Text style={{ fontSize: 6, color: "#9ca3af" }}>Chapitre 2</Text>
                <Text style={{ fontSize: 6, color: "#9ca3af" }}>/</Text>
                <Text style={{ fontSize: 6, color: PURPLE }}>Section 1</Text>
              </View>

              {/* Article */}
              <Text style={{ fontSize: 11, fontWeight: "800", color: PURPLE, marginBottom: 2 }}>Art. 25</Text>
              <Text style={{ fontSize: 8, fontWeight: "600", color: DARK, marginBottom: 6 }}>Conclusion du contrat</Text>

              <Text style={{ fontSize: 7, color: "#4b5563", lineHeight: 12, marginBottom: 8 }}>
                Le contrat de travail est un accord de volontes par lequel une personne physique s'engage a mettre son activite professionnelle sous la direction et l'autorite d'une autre personne physique ou morale moyennant remuneration.
              </Text>

              <Text style={{ fontSize: 7, color: "#4b5563", lineHeight: 12, marginBottom: 10 }}>
                Le contrat de travail peut etre conclu pour une duree determinee ou pour une duree indeterminee.
              </Text>

              {/* Conventions collectives */}
              <View style={{ backgroundColor: `${PURPLE}08`, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: `${PURPLE}15` }}>
                <Text style={{ fontSize: 7, fontWeight: "700", color: PURPLE, marginBottom: 4 }}>16 CONVENTIONS COLLECTIVES</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                  {["BTP", "Petrole", "Commerce", "Industrie", "Forestiere", "NTIC", "Hotellerie", "Mines"].map((cc, i) => (
                    <View key={i} style={{ backgroundColor: "#ffffff", borderRadius: 4, paddingVertical: 2, paddingHorizontal: 5, borderWidth: 1, borderColor: `${PURPLE}20` }}>
                      <Text style={{ fontSize: 6, color: PURPLE }}>{cc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Favorite icon */}
              <View style={{ position: "absolute", top: 12, right: 12 }}>
                <Ionicons name="heart" size={12} color="#ef4444" />
              </View>
            </View>
          </View>
        </View>
      </View>
      {/* MacBook base */}
      <View style={{ height: 8, backgroundColor: "#d1d1d1", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginHorizontal: 20 }}>
        <View style={{ width: 60, height: 3, backgroundColor: "#b0b0b0", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, alignSelf: "center" }} />
      </View>
    </View>
  );
}

function CalendarMockup() {
  const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  // Avril 2026 commence un mercredi
  const dates: (number | null)[] = [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, null, null, null];
  const deadlines: Record<number, { label: string; color: string }> = {
    15: { label: "3 impots", color: "#ef4444" },
  };

  return (
    <View style={{ flex: 1, minWidth: 240, maxWidth: 360 }}>
      <View style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        overflow: "hidden",
      }}>
        {/* Header mois */}
        <View style={{ backgroundColor: DARK, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.5)" />
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>Avril 2026</Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>3 echeances ce mois</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
        </View>

        {/* Jours de la semaine */}
        <View style={{ flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
          {DAYS.map((d) => (
            <View key={d} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 9, fontWeight: "600", color: "#9ca3af" }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Grille des jours */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 3 }}>
          {dates.map((day, i) => {
            const dl = day ? deadlines[day] : null;
            const isToday = day === 1;
            return (
              <View key={i} style={{ width: `${100 / 7}%`, height: 32, padding: 1.5 }}>
                {day ? (
                  <View style={{
                    flex: 1,
                    borderRadius: 6,
                    backgroundColor: dl ? `${dl.color}10` : isToday ? `${ORANGE}12` : "transparent",
                    borderWidth: dl ? 1.5 : isToday ? 1 : 0,
                    borderColor: dl ? dl.color : isToday ? ORANGE : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: dl ? "700" : "500", color: dl ? dl.color : "#374151" }}>{day}</Text>
                    {dl && <Text style={{ fontSize: 5, fontWeight: "700", color: dl.color, marginTop: 0 }}>{dl.label}</Text>}
                  </View>
                ) : <View style={{ flex: 1 }} />}
              </View>
            );
          })}
        </View>

        {/* Liste echeances */}
        <View style={{ paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2, gap: 4 }}>
          {[
            { date: "15 avr", label: "CNSS mars 2026", icon: "alert-circle" as const, color: "#7c3aed" },
            { date: "15 avr", label: "TVA mars 2026", icon: "alert-circle" as const, color: "#ef4444" },
            { date: "15 avr", label: "Patente annuelle", icon: "alert-circle" as const, color: "#059669" },
          ].map((e, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f9fafb", borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 }}>
              <Ionicons name={e.icon} size={12} color={e.color} />
              <Text style={{ fontSize: 9, fontWeight: "700", color: e.color, width: 36 }}>{e.date}</Text>
              <Text style={{ fontSize: 10, color: "#374151", flex: 1 }}>{e.label}</Text>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: e.color }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function IPadChatMockup() {
  return (
    <View style={{ flex: 1, minWidth: 280, alignItems: "center" }}>
      {/* iPad frame */}
      <View style={{
        backgroundColor: "#1a1a1e",
        borderRadius: 24,
        padding: 10,
        maxWidth: 440,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
      }}>
        {/* Camera */}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#333", alignSelf: "center", marginBottom: 6 }} />
        {/* Screen */}
        <View style={{ backgroundColor: "#ffffff", borderRadius: 14, overflow: "hidden" }}>
          {/* App header */}
          <View style={{ backgroundColor: DARK, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="chatbubbles" size={16} color={PRIMARY} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>NORMX Tax — Assistant IA</Text>
            </View>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="add" size={14} color="rgba(255,255,255,0.6)" />
            </View>
          </View>

          {/* Chat messages */}
          <View style={{ padding: 14, gap: 12, minHeight: 300, backgroundColor: "#f9fafb" }}>
            {/* User message */}
            <View style={{ alignSelf: "flex-end", maxWidth: "80%" }}>
              <View style={{ backgroundColor: DARK, borderRadius: 14, borderBottomRightRadius: 4, paddingVertical: 10, paddingHorizontal: 14 }}>
                <Text style={{ fontSize: 12, color: "#ffffff", lineHeight: 18 }}>
                  Quel est le taux de l'IS au Congo en 2026 ?
                </Text>
              </View>
            </View>

            {/* AI response */}
            <View style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <View style={{ backgroundColor: "#ffffff", borderRadius: 14, borderBottomLeftRadius: 4, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" }}>
                <Text style={{ fontSize: 12, color: "#374151", lineHeight: 19 }}>
                  Le taux de l'impot sur les societes est fixe a 28% pour les societes residentes (art. 86-A du CGI, tome 1). Ce taux passe de 30% a 28% suite a la Loi de Finances 2026.
                </Text>
                <View style={{ marginTop: 10, gap: 4 }}>
                  <Text style={{ fontSize: 11, color: BLUE, fontWeight: "600" }}>Taux differencies :</Text>
                  <Text style={{ fontSize: 11, color: "#6b7280", lineHeight: 17 }}>
                    - 25% pour microfinance et enseignement{"\n"}- 28% pour societes minieres{"\n"}- 33% pour non-residents hors CEMAC
                  </Text>
                </View>
                {/* Citation badge */}
                <View style={{ marginTop: 10, flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  <View style={{ backgroundColor: `${BLUE}10`, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
                    <Text style={{ fontSize: 10, color: BLUE, fontWeight: "600" }}>Art. 86-A</Text>
                  </View>
                  <View style={{ backgroundColor: `${BLUE}10`, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
                    <Text style={{ fontSize: 10, color: BLUE, fontWeight: "600" }}>Directive CEMAC 0119/25</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* User follow-up */}
            <View style={{ alignSelf: "flex-end", maxWidth: "80%" }}>
              <View style={{ backgroundColor: DARK, borderRadius: 14, borderBottomRightRadius: 4, paddingVertical: 10, paddingHorizontal: 14 }}>
                <Text style={{ fontSize: 12, color: "#ffffff", lineHeight: 18 }}>
                  Et le minimum de perception ?
                </Text>
              </View>
            </View>

            {/* AI typing indicator */}
            <View style={{ alignSelf: "flex-start" }}>
              <View style={{ backgroundColor: "#ffffff", borderRadius: 14, borderBottomLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", flexDirection: "row", gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE, opacity: 0.4 }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE, opacity: 0.6 }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BLUE, opacity: 0.8 }} />
              </View>
            </View>
          </View>

          {/* Input bar */}
          <View style={{ borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)", paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ffffff" }}>
            <View style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>Posez votre question fiscale...</Text>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="send" size={14} color={DARK} />
            </View>
          </View>
        </View>

        {/* iPad home indicator */}
        <View style={{ width: 80, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginTop: 8 }} />
      </View>
    </View>
  );
}

export default function LandingShowcase({ isMobile }: Props) {
  return (
    <View>
      {/* Section 1 — Simulateurs (mock iPhone) */}
      <View style={{ backgroundColor: "#ffffff" }}>
        <FeatureSection
          isMobile={isMobile}
          label="SIMULATEURS FISCAUX"
          labelColor={PRIMARY}
          title={"Calculez vos impots\nen temps reel"}
          description="16 simulateurs conformes au CGI Congo 2026. IS, IBA, TVA, ITS, Patente, TUS et plus encore."
          checks={[
            "IS a 28%, IBA a 30% avec minimum de perception",
            "ITS bareme progressif avec quotient familial",
            "TVA, Patente, CNSS, CAMU automatiques",
            "Resultat fiscal avec reintegrations et deductions",
          ]}
          mockupIcon="calculator-outline"
          mockupColor={PRIMARY}
          mockupTitle=""
          mockupLines={[]}
          customMockup={<IPhoneSimulatorMockup />}
        />
      </View>

      {/* Section 2 — Assistant IA (mock iPad) */}
      <View style={{ backgroundColor: "#faf8f5" }}>
        <FeatureSection
          isMobile={isMobile}
          reverse
          label="ASSISTANT IA"
          labelColor={BLUE}
          title={"Posez vos questions,\nobtenez des reponses sourcees"}
          description="Un assistant IA forme sur le CGI Congo et le Code Social. Chaque reponse cite les articles de loi."
          checks={[
            "Reponses avec references aux articles du CGI",
            "Code du Travail et conventions collectives",
            "Recherche instantanee dans +3 700 articles",
            "Disponible 24h/24",
          ]}
          mockupIcon="chatbubbles-outline"
          mockupColor={BLUE}
          mockupTitle=""
          mockupLines={[]}
          customMockup={<IPadChatMockup />}
        />
      </View>

      {/* Section 3 — Code Social (mock MacBook Air) */}
      <View style={{ backgroundColor: "#ffffff" }}>
        <FeatureSection
          isMobile={isMobile}
          label="CODE SOCIAL"
          labelColor={PURPLE}
          title={"Tout le droit social\ncongolais en un clic"}
          description="Code du Travail, Code de Securite Sociale, 16 conventions collectives et textes d'application — indexes et consultables article par article."
          checks={[
            "Code du Travail : contrats, salaires, licenciement, conges",
            "16 conventions collectives (BTP, petrole, commerce...)",
            "Code de Securite Sociale : CNSS, pensions, risques pro",
            "CAMU, ONEMO, ACPE, FONEA — tous les organismes sociaux",
          ]}
          mockupIcon="book-outline"
          mockupColor={PURPLE}
          mockupTitle=""
          mockupLines={[]}
          customMockup={<MacBookSocialMockup />}
        />
      </View>

      {/* Section 4 — Calendrier fiscal */}
      <View style={{ backgroundColor: "#faf8f5" }}>
        <FeatureSection
          isMobile={isMobile}
          reverse
          label="CALENDRIER FISCAL"
          labelColor={ORANGE}
          title={"Ne manquez plus\naucune echeance"}
          description="Toutes les dates limites de declaration et de paiement, avec alertes et rappels automatiques."
          checks={[
            "Echeances IS, IBA, TVA, ITS mensuelles",
            "Declarations CNSS trimestrielles",
            "DAS annuelle (31 mars)",
            "Alertes avant chaque date limite",
          ]}
          mockupIcon="calendar-outline"
          mockupColor={ORANGE}
          mockupTitle=""
          mockupLines={[]}
          customMockup={<CalendarMockup />}
        />
      </View>
    </View>
  );
}
