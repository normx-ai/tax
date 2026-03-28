import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PRIMARY = "#D4A843";
const DARK = "#1A3A5C";
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
}) {
  const content = (
    <View style={{ flex: 1, minWidth: 280 }}>
      <Text style={{ fontSize: 12, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: labelColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        {label}
      </Text>
      <Text style={{ fontSize: isMobile ? 24 : 32, fontFamily: fonts.black, fontWeight: fontWeights.black, color: DARK, lineHeight: isMobile ? 30 : 40, marginBottom: 16 }}>
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
      {mockup}
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

      {/* Section 2 — Assistant IA */}
      <View style={{ backgroundColor: "#faf8f5" }}>
        <FeatureSection
          isMobile={isMobile}
          reverse
          label="ASSISTANT IA"
          labelColor={BLUE}
          title={"Posez vos questions,\nobtenez des réponses sourcées"}
          description="Un assistant IA formé sur le CGI Congo et le Code Social. Chaque réponse cite les articles de loi."
          checks={[
            "Réponses avec références aux articles du CGI",
            "Code du Travail et conventions collectives",
            "Recherche instantanée dans +2 200 articles",
            "Disponible 24h/24",
          ]}
          mockupIcon="chatbubbles-outline"
          mockupColor={BLUE}
          mockupTitle="Assistant IA — NORMX Tax"
          mockupLines={[
            "Question|Quel est le taux de l'IS ?",
            "Réponse|28% (Art. 10 CGI 2026)",
            "Source|Art. 10, Titre I, Livre I",
            "Taux réduit|25% pour écoles",
            "Taux majoré|33% entités étrangères",
          ]}
        />
      </View>

      {/* Section 3 — Code Social */}
      <View style={{ backgroundColor: "#ffffff" }}>
        <FeatureSection
          isMobile={isMobile}
          label="CODE SOCIAL"
          labelColor={PURPLE}
          title={"Gérez vos cotisations\net obligations sociales"}
          description="CNSS, CAMU, TUS, conventions collectives — tout le droit social congolais indexé et simulable."
          checks={[
            "CNSS : pension vieillesse 4% + patronale 8%",
            "CAMU : assurance maladie universelle",
            "16 conventions collectives du Congo",
            "Simulateur de bulletin de paie conforme",
          ]}
          mockupIcon="people-outline"
          mockupColor={PURPLE}
          mockupTitle="Cotisations sociales"
          mockupLines={[
            "CNSS salariale (PVID)|4,00%",
            "CNSS patronale (PVID)|8,00%",
            "CNSS Prestations familiales|10,03%",
            "CNSS Risques professionnels|2,25%",
            "CAMU salariale|2,27%",
            "TUS|7,50%",
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
