import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PRIMARY = "#D4A843";
const DARK = "#0F2A42";

interface Props {
  isMobile: boolean;
}

const ADVANTAGES = [
  {
    icon: "shield-checkmark-outline" as const,
    title: "Conforme LF 2026",
    description: "Mis a jour avec l'instruction d'application n042-2025 de la Direction de la Reglementation. Taux IS a 28%, nouveau bareme ITS, IBA autonome.",
    color: "#059669",
  },
  {
    icon: "flash-outline" as const,
    title: "IA entrainee sur le CGI Congo",
    description: "L'assistant cite les articles exacts du Code, pas des reponses generiques. Recherche hybride (mots-cles + vectorielle) sur 3 700+ articles.",
    color: "#2563eb",
  },
  {
    icon: "globe-outline" as const,
    title: "Fiscal + Social en un seul outil",
    description: "CGI Tome 1 et 2, Code du Travail, Code de Securite Sociale, 16 conventions collectives, CNSS, CAMU, TUS — tout est la.",
    color: "#7c3aed",
  },
  {
    icon: "calculator-outline" as const,
    title: "16 simulateurs precis",
    description: "IS, IBA, ITS, TVA, IRCM, IRF, Patente, Paie, CNSS, Cession de parts — calculs conformes au CGI 2026 avec minimum de perception.",
    color: PRIMARY,
  },
  {
    icon: "lock-closed-outline" as const,
    title: "Securise et multi-tenant",
    description: "Chaque cabinet ou entreprise a son espace isole. Authentification SSO via Keycloak, donnees chiffrees, heberge en Europe.",
    color: "#dc2626",
  },
  {
    icon: "phone-portrait-outline" as const,
    title: "Web, mobile et hors-ligne",
    description: "Disponible sur navigateur, Google Play et en mode hors-ligne. Consultez le Code et simulez vos impots meme sans connexion.",
    color: "#d97706",
  },
];

export default function LandingWhyUs({ isMobile }: Props) {
  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 16, backgroundColor: "#ffffff" }}>
      <Text style={{
        fontFamily: fonts.headingBlack,
        fontWeight: fontWeights.headingBlack,
        fontSize: isMobile ? 26 : 36,
        color: DARK,
        textAlign: "center",
        marginBottom: 8,
      }}>
        Pourquoi choisir NORMX Tax ?
      </Text>
      <Text style={{
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
        fontFamily: fonts.regular,
        marginBottom: 40,
        maxWidth: 600,
        alignSelf: "center",
      }}>
        La seule plateforme qui reunit le Code des Impots, le Code Social et l'intelligence artificielle pour le Congo
      </Text>

      <View style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 20,
        maxWidth: 1100,
        alignSelf: "center",
        width: "100%",
        justifyContent: "center",
      }}>
        {ADVANTAGES.map((adv, i) => (
          <View key={i} style={{
            width: isMobile ? "100%" : "30%",
            minWidth: isMobile ? undefined : 300,
            flexGrow: 1,
            backgroundColor: "#f8f9fa",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.06)",
            padding: isMobile ? 24 : 28,
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: `${adv.color}12`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
              <Ionicons name={adv.icon} size={24} color={adv.color} />
            </View>
            <Text style={{
              fontSize: 18,
              fontFamily: fonts.bold,
              fontWeight: fontWeights.bold,
              color: DARK,
              marginBottom: 8,
            }}>
              {adv.title}
            </Text>
            <Text style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 22,
              fontFamily: fonts.regular,
            }}>
              {adv.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
