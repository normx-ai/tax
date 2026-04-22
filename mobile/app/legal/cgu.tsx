import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { ThemeColors } from '@/lib/theme/colors';
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

function BulletItem({ children, colors }: { children: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 6, paddingLeft: 8 }}>
      <Text style={{ fontSize: 16, color: GOLD, marginRight: 10, lineHeight: 22 }}>&#x2022;</Text>
      <Text style={{ fontSize: 16, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular, flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

export default function CGUPublicScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 20, paddingBottom: 60 }}>
        {/* Bouton retour */}
        <View style={{ width: "100%", maxWidth: 794 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
            <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 16, color: colors.textMuted, marginLeft: 6 }}>Retour</Text>
          </TouchableOpacity>
        </View>

        {/* Page A4 */}
        <View style={{
          width: "100%",
          maxWidth: 794,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 48,
          paddingVertical: 56,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}>
          {/* En-tête */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32, gap: 16 }}>
            <Image
              source={require("@/assets/logo-horizontal.png")}
              style={{ width: 180, height: 35, resizeMode: "contain" }}
            />
            <View style={{ flex: 1, paddingLeft: 4, borderLeftWidth: 1, borderLeftColor: colors.border }}>
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: colors.textMuted, paddingLeft: 12 }}>
                Conditions Générales d'Utilisation
              </Text>
            </View>
          </View>

          {/* Séparateur doré */}
          <View style={{ height: 2, backgroundColor: GOLD, opacity: 0.3, marginBottom: 24 }} />

          <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, fontStyle: "italic", fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Dernière mise à jour : 1er mars 2026
          </Text>

          {/* Article 1 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 1 — Objet
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme NORMX AI, éditée par NORMX AI SAS, société par actions simplifiée au capital de 1 000 €, immatriculée au RCS d'Amiens sous le numéro 103 831 921, dont le siège social est situé au 71 rue Daire, 80000 Amiens.{"\n\n"}
            NORMX AI est une plateforme numérique comprenant les produits suivants : NORMX Tax (fiscalité et simulations), NORMX Compta (comptabilité), NORMX Paie (gestion de la paie), NORMX États (états financiers) et NORMX Legal (documents juridiques OHADA).{"\n\n"}
            L'utilisation de l'application implique l'acceptation pleine et entière des présentes CGU ainsi que de la Politique de confidentialité accessible depuis l'application.
          </Text>

          {/* Article 2 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 2 — Accès au service
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            L'accès à l'application nécessite la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour, et à maintenir la confidentialité de ses identifiants de connexion. Tout accès non autorisé doit être signalé immédiatement à info-contact@normx-ai.com.{"\n\n"}
            L'application est accessible 24h/24, 7j/7, sous réserve des interruptions pour maintenance ou cas de force majeure.
          </Text>

          {/* Article 3 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 3 — Description des services
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            CGI 242 propose les services suivants :
          </Text>
          <BulletItem colors={colors}>Consultation intégrale des Codes Généraux des Impôts des pays d'Afrique</BulletItem>
          <BulletItem colors={colors}>14 simulateurs fiscaux : ITS, IS, TVA, Patente, Taxe foncière, Taxe immobilière, Droits d'enregistrement, Solde de liquidation, IRF, IBA, Retenue à la source, Contribution spéciale de solidarité, Taxe sur les transferts de fonds, Centimes additionnels</BulletItem>
          <BulletItem colors={colors}>Assistant IA pour les questions fiscales</BulletItem>
          <BulletItem colors={colors}>Recherche vocale intégrée</BulletItem>
          <BulletItem colors={colors}>Mode hors-ligne pour la consultation sans connexion</BulletItem>
          <BulletItem colors={colors}>Alertes sur les modifications législatives</BulletItem>
          <BulletItem colors={colors}>Gestion d'organisation et de membres</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            Les réponses de l'assistant IA et les résultats des simulateurs ont un caractère purement informatif et ne constituent en aucun cas un conseil fiscal, juridique ou comptable professionnel.
          </Text>

          {/* Article 4 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 4 — Abonnements et tarification
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            L'application propose différents plans d'abonnement dont les tarifs sont affichés dans l'application avant toute souscription. Les prix sont exprimés en Francs CFA (XAF) et sont soumis aux taxes applicables.{"\n\n"}
            Le renouvellement est annuel sauf résiliation expresse de l'utilisateur avant l'échéance, via les paramètres de l'application.{"\n\n"}
            Les moyens de paiement acceptés sont indiqués lors du processus de souscription.
          </Text>

          {/* Article 5 — Droit de rétractation */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 5 — Droit de rétractation
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la souscription pour exercer votre droit de rétractation, sans avoir à justifier de motif ni à payer de pénalité.{"\n\n"}
            Pour exercer ce droit, adressez votre demande par email à info-contact@normx-ai.com en indiquant vos nom, prénom et les détails de votre abonnement. Le remboursement sera effectué dans un délai de 14 jours suivant la réception de votre demande, via le même moyen de paiement utilisé lors de la souscription.{"\n\n"}
            Toutefois, conformément à l'article L.221-28 du Code de la consommation, si vous avez expressément demandé le début de l'exécution du service avant la fin du délai de rétractation et reconnu perdre ainsi votre droit de rétractation, celui-ci ne pourra plus être exercé.
          </Text>

          {/* Article 6 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 6 — Propriété intellectuelle
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            La marque « NORMX AI » est enregistrée auprès de l'Institut National de la Propriété Industrielle (INPI).{"\n\n"}
            L'ensemble du contenu de l'application (textes, graphismes, logiciels, bases de données, marques, logos) est protégé par le droit de la propriété intellectuelle et est la propriété exclusive de NORMX AI SAS. Toute reproduction ou représentation, totale ou partielle, est interdite sans autorisation préalable écrite, conformément aux articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </Text>

          {/* Article 7 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 7 — Responsabilités
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Les informations fournies par l'application, y compris les réponses de l'assistant IA et les résultats des simulateurs, ont un caractère informatif et ne sauraient se substituer à un conseil fiscal professionnel. L'utilisateur est seul responsable de l'usage qu'il fait des informations fournies.{"\n\n"}
            NORMX AI s'engage à fournir un service conforme aux descriptions de l'application. Conformément aux articles L.224-25-12 et suivants du Code de la consommation, l'utilisateur bénéficie de la garantie légale de conformité pour les contenus et services numériques.{"\n\n"}
            En cas de défaut de conformité, l'utilisateur peut demander la mise en conformité du service. Si la mise en conformité est impossible ou entraîne des coûts disproportionnés, l'utilisateur peut obtenir une réduction de prix ou la résolution du contrat.
          </Text>

          {/* Article 8 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 8 — Résiliation
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            L'utilisateur peut résilier son compte à tout moment depuis les paramètres de l'application.{"\n\n"}
            NORMX AI se réserve le droit de suspendre ou résilier un compte en cas de violation avérée des présentes CGU, après mise en demeure restée sans effet pendant 15 jours. En cas de manquement grave (utilisation frauduleuse, atteinte à la sécurité), la suspension peut être immédiate. L'utilisateur sera informé par email des motifs de la suspension ou résiliation.
          </Text>

          {/* Article 9 — Données personnelles */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 9 — Données personnelles
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Le traitement des données personnelles des utilisateurs est régi par notre Politique de confidentialité, qui fait partie intégrante des présentes CGU et est accessible depuis l'application. La Politique de confidentialité détaille les données collectées, les finalités du traitement, les droits des utilisateurs et les modalités d'exercice de ces droits.
          </Text>

          {/* Article 10 — Médiation */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 10 — Médiation de la consommation
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Conformément aux articles L.612-1 et suivants du Code de la consommation, en cas de litige non résolu par notre service client (info-contact@normx-ai.com), l'utilisateur consommateur peut recourir gratuitement à un médiateur de la consommation.{"\n\n"}
            Médiateur désigné : en cours de désignation.{"\n\n"}
            L'utilisateur peut également utiliser la plateforme européenne de règlement en ligne des litiges (RLL) :{"\n"}
            https://ec.europa.eu/consumers/odr
          </Text>

          {/* Article 11 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 11 — Modification des CGU
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            NORMX AI se réserve le droit de modifier les présentes CGU. En cas de modification substantielle, l'utilisateur sera informé par notification dans l'application ou par email au moins 30 jours avant l'entrée en vigueur des nouvelles conditions. L'utilisation continue du service après cette date vaudra acceptation des nouvelles CGU.
          </Text>

          {/* Article 12 */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            Article 12 — Droit applicable et juridiction
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Les présentes CGU sont soumises au droit français.{"\n\n"}
            En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. À défaut de résolution amiable, le consommateur pourra saisir le tribunal compétent de son lieu de domicile conformément aux dispositions du Code de la consommation, ou tout autre tribunal compétent.{"\n\n"}
            Pour les utilisateurs professionnels, les tribunaux d'Amiens seront seuls compétents.
          </Text>

          {/* Séparateur bas */}
          <View style={{ height: 1, backgroundColor: colors.border, marginTop: 40, marginBottom: 20 }} />
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            NORMX AI SAS — 71 rue Daire, 80000 Amiens — info-contact@normx-ai.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
