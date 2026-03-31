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
      {/* Section 1 — Simulateurs */}
      <View style={{ backgroundColor: "#ffffff" }}>
        <FeatureSection
          isMobile={isMobile}
          label="SIMULATEURS FISCAUX"
          labelColor={PRIMARY}
          title={"Calculez vos impôts\nen temps réel"}
          description="16 simulateurs conformes au CGI Congo 2026. IS, IBA, TVA, ITS, Patente, TUS et plus encore."
          checks={[
            "IS à 28%, IBA à 30% avec minimum de perception",
            "ITS barème progressif avec quotient familial",
            "TVA, Patente, CNSS, CAMU automatiques",
            "Résultat fiscal avec réintégrations et déductions",
          ]}
          mockupIcon="calculator-outline"
          mockupColor={PRIMARY}
          mockupTitle="Simulateur IS — CGI 2026"
          mockupLines={[
            "Produits d'exploitation|45 000 000 FCFA",
            "Charges d'exploitation|38 500 000 FCFA",
            "Résultat comptable|6 500 000 FCFA",
            "Réintégrations fiscales|1 200 000 FCFA",
            "Résultat fiscal|7 700 000 FCFA",
            "IS (28%)|2 156 000 FCFA",
          ]}
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

      {/* Section 3 — Code Social */}
      <View style={{ backgroundColor: "#ffffff" }}>
        <FeatureSection
          isMobile={isMobile}
          label="CODE DU TRAVAIL & CONVENTIONS"
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
          mockupTitle="Sommaire — Code Social"
          mockupLines={[
            "Code du Travail|10 titres, 247 articles",
            "Securite Sociale|Loi 004-86",
            "Conventions collectives|16 secteurs",
            "CAMU (Loi 19-2023)|Assurance maladie",
            "Risques professionnels|Loi 2012-18",
            "Age de retraite|Loi 2024-48",
          ]}
        />
      </View>

      {/* Section 4 — Calendrier */}
      <View style={{ backgroundColor: "#faf8f5" }}>
        <FeatureSection
          isMobile={isMobile}
          reverse
          label="CALENDRIER FISCAL"
          labelColor={ORANGE}
          title={"Ne manquez plus\naucune échéance"}
          description="Toutes les dates limites de déclaration et de paiement, avec alertes et rappels automatiques."
          checks={[
            "Échéances IS, IBA, TVA, ITS mensuelles",
            "Déclarations CNSS trimestrielles",
            "DAS annuelle (31 mars)",
            "Alertes avant chaque date limite",
          ]}
          mockupIcon="calendar-outline"
          mockupColor={ORANGE}
          mockupTitle="Prochaines échéances"
          mockupLines={[
            "15 avril 2026|Acompte IS T1",
            "20 avril 2026|TVA mars 2026",
            "15 mai 2026|ITS avril 2026",
            "15 juin 2026|Acompte IS T2",
            "30 juin 2026|CNSS T2 2026",
          ]}
        />
      </View>
    </View>
  );
}
