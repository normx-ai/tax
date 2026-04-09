import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";

interface Props {
  isMobile: boolean;
}

const TESTIMONIALS = [
  {
    quote: "NORMX Tax m'a fait gagner 3 heures par semaine sur mes declarations fiscales. Le simulateur ITS est d'une precision remarquable.",
    name: "Expert-Comptable",
    role: "Cabinet Brazzaville",
    icon: "person-circle-outline" as const,
  },
  {
    quote: "L'assistant IA repond a mes questions fiscales avec les references exactes du CGI. C'est comme avoir un fiscaliste disponible 24h/24.",
    name: "Directeur Financier",
    role: "PME industrielle",
    icon: "business-outline" as const,
  },
  {
    quote: "Le Code Social avec les 16 conventions collectives nous a permis de regulariser nos bulletins de paie en quelques jours.",
    name: "DRH",
    role: "Societe petroliere",
    icon: "people-circle-outline" as const,
  },
];

const TRUST_BADGES = [
  { value: "CGI 2026", label: "Loi de Finances" },
  { value: "Directive CEMAC", label: "Conforme 0119/25" },
  { value: "+3 700", label: "Articles indexes" },
  { value: "99.9%", label: "Disponibilite" },
];

export default function LandingTrust({ isMobile }: Props) {
  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 16, backgroundColor: "#faf8f5" }}>
      {/* Badges de confiance */}
      <View style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: isMobile ? 16 : 40,
        flexWrap: "wrap",
        marginBottom: 48,
        maxWidth: 900,
        alignSelf: "center",
      }}>
        {TRUST_BADGES.map((badge, i) => (
          <View key={i} style={{ alignItems: "center", minWidth: 100 }}>
            <Text style={{ fontSize: isMobile ? 18 : 22, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: PRIMARY }}>
              {badge.value}
            </Text>
            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontFamily: fonts.regular, textAlign: "center" }}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Titre */}
      <Text style={{
        fontFamily: fonts.headingBlack,
        fontWeight: fontWeights.headingBlack,
        fontSize: isMobile ? 26 : 36,
        color: DARK,
        textAlign: "center",
        marginBottom: 8,
      }}>
        Ils font confiance a NORMX Tax
      </Text>
      <Text style={{
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
        fontFamily: fonts.regular,
        marginBottom: 40,
      }}>
        Experts-comptables, entreprises et administrations au Congo-Brazzaville
      </Text>

      {/* Temoignages */}
      <View style={{
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
        maxWidth: 1100,
        alignSelf: "center",
        width: "100%",
      }}>
        {TESTIMONIALS.map((t, i) => (
          <View key={i} style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
            padding: isMobile ? 24 : 28,
          }}>
            {/* Etoiles */}
            <View style={{ flexDirection: "row", gap: 2, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={16} color={PRIMARY} />
              ))}
            </View>
            {/* Citation */}
            <Text style={{
              fontSize: 15,
              color: "#374151",
              lineHeight: 24,
              fontFamily: fonts.regular,
              fontStyle: "italic",
              marginBottom: 20,
            }}>
              "{t.quote}"
            </Text>
            {/* Auteur */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${PRIMARY}15`,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Ionicons name={t.icon} size={22} color={PRIMARY} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: DARK }}>
                  {t.name}
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280", fontFamily: fonts.regular }}>
                  {t.role}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
