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

function MappingRow({ finalite, base, colors }: { finalite: string; base: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 6, paddingLeft: 8 }}>
      <Text style={{ fontSize: 16, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular, flex: 1 }}>
        {finalite}
      </Text>
      <Text style={{ fontSize: 15, color: GOLD, lineHeight: 22, fontFamily: fonts.medium, fontWeight: fontWeights.medium, flex: 1 }}>
        {base}
      </Text>
    </View>
  );
}

export default function ConfidentialitePublicScreen() {
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
                Politique de confidentialité
              </Text>
            </View>
          </View>

          {/* Séparateur doré */}
          <View style={{ height: 2, backgroundColor: GOLD, opacity: 0.3, marginBottom: 24 }} />

          <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, fontStyle: "italic", fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Dernière mise à jour : 1er mars 2026 — Conformément au RGPD (UE 2016/679) et à la loi Informatique et Libertés
          </Text>

          {/* 1. Responsable */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            1. Responsable du traitement
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Le responsable du traitement des données personnelles collectées via la plateforme NORMX AI est :{"\n\n"}
            NORMX AI SAS{"\n"}
            Société par Actions Simplifiée au capital de 1 000 €{"\n"}
            Siège social : 71 rue Daire, 80000 Amiens{"\n"}
            RCS Compiègne : 941 200 169{"\n\n"}
            Référente protection des données : Christelle MABIKA{"\n"}
            Email : info-contact@normx-ai.com{"\n"}
            Téléphone : 06 20 76 94 24
          </Text>

          {/* 2. Données collectées */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            2. Données collectées
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Nous collectons les données suivantes :
          </Text>
          <BulletItem colors={colors}>Données d'identification : nom, prénom, adresse email</BulletItem>
          <BulletItem colors={colors}>Données de connexion : logs de connexion, adresse IP, type d'appareil</BulletItem>
          <BulletItem colors={colors}>Données d'utilisation : historique des recherches, questions posées à l'IA, simulations effectuées</BulletItem>
          <BulletItem colors={colors}>Données d'organisation : appartenance à une entreprise, rôle</BulletItem>
          <BulletItem colors={colors}>Données de paiement : les paiements sont traités par des prestataires tiers sécurisés ; nous ne stockons pas vos données bancaires</BulletItem>

          {/* 3. Finalités et bases légales */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            3. Finalités et bases légales du traitement
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Conformément à l'article 6 du RGPD, chaque traitement repose sur une base légale :
          </Text>
          <View style={{ marginTop: 12, backgroundColor: "rgba(200,160,60,0.05)", borderRadius: 8, padding: 12 }}>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold, flex: 1 }}>Finalité</Text>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold, flex: 1 }}>Base légale</Text>
            </View>
            <MappingRow finalite="Gestion du compte et authentification" base="Exécution du contrat (art. 6.1.b)" colors={colors} />
            <MappingRow finalite="Fourniture des services (CGI, simulations, chat IA)" base="Exécution du contrat (art. 6.1.b)" colors={colors} />
            <MappingRow finalite="Amélioration et personnalisation du service" base="Intérêt légitime (art. 6.1.f)" colors={colors} />
            <MappingRow finalite="Gestion des abonnements et facturation" base="Exécution du contrat (art. 6.1.b)" colors={colors} />
            <MappingRow finalite="Obligations légales et fiscales" base="Obligation légale (art. 6.1.c)" colors={colors} />
            <MappingRow finalite="Cookies non essentiels" base="Consentement (art. 6.1.a)" colors={colors} />
          </View>

          {/* 4. Intelligence artificielle */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            4. Utilisation de l'intelligence artificielle
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            L'application intègre un assistant basé sur l'intelligence artificielle pour répondre aux questions fiscales. À ce titre :{"\n\n"}
            Les questions posées à l'assistant IA sont transmises à un fournisseur de modèle de langage tiers pour générer les réponses. Ces échanges peuvent impliquer un transfert de données vers des serveurs situés hors de l'Union européenne (voir section 7).{"\n\n"}
            L'assistant IA ne prend aucune décision automatisée ayant des effets juridiques au sens de l'article 22 du RGPD. Les réponses fournies sont purement informatives et ne constituent pas un conseil fiscal professionnel.{"\n\n"}
            Aucun profilage au sens du RGPD n'est effectué à partir de vos données.
          </Text>

          {/* 5. Durée */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            5. Durée de conservation
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Vos données personnelles sont conservées pendant la durée de votre inscription au service, puis archivées pendant une durée de 3 ans à compter de la suppression de votre compte, conformément aux obligations légales applicables.{"\n\n"}
            Les logs de connexion sont conservés 12 mois conformément à la législation française (LCEN).{"\n\n"}
            Les données de facturation sont conservées 10 ans conformément au Code de commerce.
          </Text>

          {/* 6. Partage */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            6. Destinataires des données
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Vos données ne sont pas vendues à des tiers. Elles peuvent être partagées avec :
          </Text>
          <BulletItem colors={colors}>Les membres de votre organisation (données de profil)</BulletItem>
          <BulletItem colors={colors}>Nos sous-traitants techniques (hébergement : OVH SAS, envoi d'emails, monitoring : Sentry)</BulletItem>
          <BulletItem colors={colors}>Notre fournisseur de service d'IA (pour le traitement des questions posées à l'assistant)</BulletItem>
          <BulletItem colors={colors}>Les autorités compétentes sur demande légale</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            Tous nos sous-traitants sont liés par des clauses contractuelles garantissant la sécurité et la confidentialité de vos données.
          </Text>

          {/* 7. Transferts hors UE */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            7. Transferts de données hors de l'Union européenne
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Certaines données peuvent être transférées vers des pays situés hors de l'Espace économique européen (EEE), notamment dans le cadre de l'utilisation de l'assistant IA (serveurs aux États-Unis).{"\n\n"}
            Ces transferts sont encadrés par des garanties appropriées conformément au chapitre V du RGPD :{"\n"}
          </Text>
          <BulletItem colors={colors}>Clauses contractuelles types (CCT) adoptées par la Commission européenne</BulletItem>
          <BulletItem colors={colors}>Évaluation de l'impact du transfert (Transfer Impact Assessment)</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            Vous pouvez obtenir une copie des garanties mises en place en contactant : info-contact@normx-ai.com.{"\n\n"}
            L'hébergement principal des données est assuré par OVH SAS en France (Roubaix), certifié ISO 27001. Le monitoring d'erreurs (Sentry) utilise des serveurs européens (Francfort, Allemagne).
          </Text>

          {/* 8. Sécurité */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            8. Sécurité des données
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées conformément à l'article 32 du RGPD :
          </Text>
          <BulletItem colors={colors}>Chiffrement des données en transit (TLS) et au repos</BulletItem>
          <BulletItem colors={colors}>Authentification à deux facteurs (2FA)</BulletItem>
          <BulletItem colors={colors}>Journalisation et surveillance des accès</BulletItem>
          <BulletItem colors={colors}>Sauvegardes régulières</BulletItem>
          <BulletItem colors={colors}>Restriction d'accès selon le principe du moindre privilège</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés, nous vous en informerons dans les meilleurs délais, conformément à l'article 34 du RGPD. La CNIL sera notifiée dans les 72 heures suivant la constatation de la violation (article 33 du RGPD).
          </Text>

          {/* 9. Vos droits */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            9. Vos droits
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
          </Text>
          <BulletItem colors={colors}>Droit d'accès à vos données personnelles (art. 15)</BulletItem>
          <BulletItem colors={colors}>Droit de rectification des données inexactes (art. 16)</BulletItem>
          <BulletItem colors={colors}>Droit à l'effacement — droit à l'oubli (art. 17)</BulletItem>
          <BulletItem colors={colors}>Droit à la limitation du traitement (art. 18)</BulletItem>
          <BulletItem colors={colors}>Droit à la portabilité de vos données (art. 20)</BulletItem>
          <BulletItem colors={colors}>Droit d'opposition au traitement (art. 21)</BulletItem>
          <BulletItem colors={colors}>Droit de retirer votre consentement à tout moment, sans affecter la licéité du traitement antérieur (art. 7.3)</BulletItem>
          <BulletItem colors={colors}>Droit de définir des directives relatives au sort de vos données après votre décès (loi Informatique et Libertés, art. 85)</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            Pour exercer ces droits, contactez-nous par email à info-contact@normx-ai.com ou par courrier à NORMX AI SAS, 71 rue Daire, 80000 Amiens. Nous nous engageons à répondre dans un délai d'un mois, prolongeable de deux mois en cas de demande complexe (art. 12.3 du RGPD).
          </Text>

          {/* 10. Réclamation CNIL */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            10. Réclamation auprès de la CNIL
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL) :{"\n\n"}
            CNIL — 3 place de Fontenoy, TSA 80715{"\n"}
            75334 Paris Cedex 07{"\n"}
            Site : www.cnil.fr{"\n"}
            Téléphone : 01 53 73 22 22
          </Text>

          {/* 11. Cookies */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            11. Cookies
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            L'application utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, préférences de thème et de langue). Ces cookies sont exemptés de consentement conformément aux recommandations de la CNIL.{"\n\n"}
            Aucun cookie publicitaire, de traçage ou analytique n'est utilisé.
          </Text>

          {/* 12. Modifications */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            12. Modifications
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Nous nous réservons le droit de modifier la présente politique de confidentialité. En cas de modification substantielle, vous serez informé par notification dans l'application ou par email à l'adresse associée à votre compte, au moins 30 jours avant l'entrée en vigueur.
          </Text>

          {/* 13. Contact */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            13. Contact
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez NORMX AI :{"\n\n"}
            Email : info-contact@normx-ai.com{"\n"}
            Téléphone : 06 20 76 94 24{"\n"}
            Courrier : NORMX AI SAS, 71 rue Daire, 80000 Amiens
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
