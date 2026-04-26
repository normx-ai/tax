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
            Version 2.0 — Dernière mise à jour : 26 avril 2026 — Conformément au RGPD (UE 2016/679) et à la loi Informatique et Libertés
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
            SIREN : 103 831 921{"\n"}
            SIRET (siège) : 103 831 921 00012{"\n"}
            RCS Amiens : 103 831 921{"\n"}
            Code APE : 62.01Z (Programmation informatique){"\n\n"}
            Déléguée à la Protection des Données (DPO) : POATY-KAMBISSI Christelle Elodie épouse MABIKA{"\n"}
            Email DPO dédié : dpo@normx-ai.com{"\n"}
            Email général : info-contact@normx-ai.com{"\n"}
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
          <View style={{ marginTop: 12, backgroundColor: "rgba(200,160,60,0.05)", padding: 12 }}>
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
            Conformément au principe de limitation de la conservation (art. 5.1.e du RGPD), vos données sont conservées pour la durée strictement nécessaire à chaque finalité :
          </Text>
          <BulletItem colors={colors}>Compte actif et données du profil : pendant toute la durée de votre inscription au Service.</BulletItem>
          <BulletItem colors={colors}>Données après suppression du Compte : archivage limité de 3 ans à compter de la suppression, justifié par la prescription civile quinquennale (art. 2224 du Code civil) et la prescription en matière de responsabilité contractuelle, afin de pouvoir répondre à toute action ou litige éventuel.</BulletItem>
          <BulletItem colors={colors}>Données fiscales et données d'organisation chargées (entités, dossiers, balances, déclarations) : exportables pendant 30 jours après résiliation, puis suppression définitive (sauf obligation légale de conservation côté Client).</BulletItem>
          <BulletItem colors={colors}>Logs de connexion : 12 mois (article L.34-1 du Code des postes et des communications électroniques).</BulletItem>
          <BulletItem colors={colors}>Pièces justificatives comptables et factures : 10 ans (article L.123-22 du Code de commerce).</BulletItem>
          <BulletItem colors={colors}>Logs d'audit applicatifs (traçabilité des accès aux Données Client) : 24 mois.</BulletItem>
          <BulletItem colors={colors}>Prompts soumis à l'assistant IA et réponses : conservation transitoire le temps strictement nécessaire à la fourniture de la réponse, sans réutilisation pour entraîner les modèles.</BulletItem>

          {/* 6. Partage */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            6. Destinataires et sous-traitants
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :
          </Text>
          <BulletItem colors={colors}>Les membres de votre Organisation, dans la limite des rôles et permissions configurés (Owner, Admin, Membre).</BulletItem>
          <BulletItem colors={colors}>Les autorités administratives ou judiciaires compétentes sur réquisition légale.</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            Conformément à l'article 28 du RGPD, NORMX AI fait appel aux sous-traitants suivants, liés par des clauses contractuelles garantissant un niveau de protection conforme :
          </Text>
          <View style={{ marginTop: 12 }}>
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>OVH SAS — Hébergement</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
                Localisation : Roubaix (France) · Certifié ISO 27001, HDS · Aucun transfert hors UE.
              </Text>
            </View>
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Anthropic PBC — Assistant IA (Claude)</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
                Localisation : San Francisco, États-Unis · Anthropic PBC est inscrit sur la liste du EU-US Data Privacy Framework (décision d'adéquation 2023/1795 du 10 juillet 2023, confirmée par le Tribunal de l'UE le 3 septembre 2025). Le transfert est par ailleurs encadré par les Clauses Contractuelles Types 2021/914 (Modules 2 et 3), incorporées au Data Processing Addendum signé avec NORMX AI (garantie cumulative).{"\n\n"}
                Sous-traitants ultérieurs d'Anthropic : Amazon Web Services et Google Cloud Platform (États-Unis), couverts par le DPA Anthropic.{"\n\n"}
                Engagements contractuels : non-utilisation des prompts pour entraîner les modèles ; rétention contractuelle des logs limitée à 7 jours maximum ; notification de toute violation de données sous 48 heures ; notification de toute demande contraignante d'autorité publique américaine sous 48 heures sauf interdiction légale.
              </Text>
            </View>
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Functional Software Inc. (Sentry) — Monitoring d'erreurs</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
                Localisation : Francfort (Allemagne) · Données techniques anonymisées, aucun contenu Client transmis volontairement.
              </Text>
            </View>
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Prestataire SMTP — Emails transactionnels</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
                Localisation : Union européenne · Acheminement des emails de notification (OTP, factures, échéances).
              </Text>
            </View>
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Société Générale Effiscience SAS (Shine) — Encaissement par virement</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
                Localisation : France · Réception des virements bancaires. Aucune donnée bancaire client n'est stockée dans la Plateforme.
              </Text>
            </View>
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 15, color: GOLD, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>Stripe Payments Europe Ltd (Stripe) — Paiement par carte bancaire</Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
                Localisation : Dublin (Irlande), avec sous-traitance ultérieure Stripe Inc. (États-Unis). Encadrement par les Clauses Contractuelles Types 2021/914 et adhésion de Stripe Inc. au EU-US Data Privacy Framework (décision 2023/1795). Stripe est certifié PCI-DSS niveau 1.{"\n\n"}
                Données traitées par Stripe : informations de carte bancaire saisies sur la page sécurisée Stripe Checkout, identifiant du client (Customer Stripe), montant et devise. Aucune donnée de carte ne transite ni n'est stockée par NORMX AI ; seuls le statut du paiement et les identifiants techniques (Customer ID, Subscription ID) sont reçus via les webhooks signés.
              </Text>
            </View>
          </View>

          {/* 7. Transferts hors UE */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            7. Transferts de données hors de l'Union européenne
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Le seul transfert hors EEE concerne l'utilisation de l'assistant IA fourni par Anthropic PBC (États-Unis). Ce transfert est encadré conformément au chapitre V du RGPD par des garanties cumulatives :
          </Text>
          <BulletItem colors={colors}>EU-US Data Privacy Framework (DPF) — décision d'adéquation 2023/1795 de la Commission européenne du 10 juillet 2023, confirmée par le Tribunal de l'UE le 3 septembre 2025. Anthropic PBC est inscrit sur la liste officielle dataprivacyframework.gov ;</BulletItem>
          <BulletItem colors={colors}>Clauses Contractuelles Types (CCT) 2021/914 du 4 juin 2021, Modules 2 (responsable → sous-traitant) et 3 (sous-traitant → sous-traitant ultérieur), incorporées au Data Processing Addendum signé entre NORMX AI et Anthropic — applicables en garantie cumulative et subsidiaire au DPF ;</BulletItem>
          <BulletItem colors={colors}>Analyse d'impact des transferts (Transfer Impact Assessment, TIA) réalisée selon les recommandations 01/2020 du Comité européen de la protection des données, tenant compte du droit américain (FISA Section 702, Executive Order 12333, CLOUD Act) et des mesures techniques, contractuelles et organisationnelles supplémentaires mises en place ;</BulletItem>
          <BulletItem colors={colors}>Engagements d'Anthropic : non-utilisation des prompts pour entraîner les modèles, rétention des logs limitée à 7 jours, notification des violations sous 48 heures, notification des demandes contraignantes d'autorités publiques américaines sous 48 heures sauf interdiction légale.</BulletItem>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 12 }}>
            Les Données Client (entités, dossiers, balances, déclarations, documents) ne sont pas transmises à Anthropic : seules les questions textuelles posées à l'assistant le sont, et l'Utilisateur est invité à ne pas y inclure d'informations confidentielles superflues.{"\n\n"}
            Une copie du TIA et des garanties mises en place est disponible sur demande à dpo@normx-ai.com.
          </Text>

          {/* 7 bis. Confidentialité données fiscales */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            8. Confidentialité des données fiscales et d'entreprise
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Outre la protection au titre du RGPD, les données fiscales et d'entreprise chargées dans la Plateforme (entités, dossiers, balances, déclarations, pièces justificatives) bénéficient d'une obligation de confidentialité métier, dans le respect notamment du secret professionnel applicable aux experts-comptables (article 21 de l'ordonnance n° 45-2138 du 19 septembre 1945) lorsque le Client y est soumis.{"\n\n"}
            Concrètement :
          </Text>
          <BulletItem colors={colors}>Cloisonnement multi-tenant : chaque Organisation accède uniquement à ses propres données ; les contrôles d'accès sont vérifiés à chaque requête côté serveur.</BulletItem>
          <BulletItem colors={colors}>Aucun accès humain par défaut : les équipes NORMX AI n'accèdent aux données d'une Organisation que sur demande explicite du Client (support, audit) et avec traçabilité.</BulletItem>
          <BulletItem colors={colors}>Pas d'utilisation à des fins d'analyse marketing ou de profilage.</BulletItem>
          <BulletItem colors={colors}>Engagement de confidentialité de cinq (5) ans après la fin du contrat, conformément aux CGU/CGV.</BulletItem>

          {/* 9. Sécurité */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            9. Sécurité des données
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

          {/* 10. Vos droits */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            10. Vos droits
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
            Pour exercer ces droits, contactez la Déléguée à la Protection des Données par email à dpo@normx-ai.com ou par courrier à NORMX AI SAS – DPO, 71 rue Daire, 80000 Amiens. Nous nous engageons à répondre dans un délai d'un mois, prolongeable de deux mois en cas de demande complexe (art. 12.3 du RGPD).
          </Text>

          {/* 11. Réclamation CNIL */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            11. Réclamation auprès de la CNIL
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL) :{"\n\n"}
            CNIL — 3 place de Fontenoy, TSA 80715{"\n"}
            75334 Paris Cedex 07{"\n"}
            Site : www.cnil.fr{"\n"}
            Téléphone : 01 53 73 22 22
          </Text>

          {/* 12. Cookies */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            12. Cookies
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            L'application utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, préférences de thème et de langue). Ces cookies sont exemptés de consentement conformément aux recommandations de la CNIL.{"\n\n"}
            Aucun cookie publicitaire, de traçage ou analytique n'est utilisé.
          </Text>

          {/* 13. Modifications */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            13. Modifications
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Nous nous réservons le droit de modifier la présente politique de confidentialité. En cas de modification substantielle, vous serez informé par notification dans l'application ou par email à l'adresse associée à votre compte, au moins 30 jours avant l'entrée en vigueur.
          </Text>

          {/* 14. Contact */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            14. Contact
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez NORMX AI :{"\n\n"}
            DPO : dpo@normx-ai.com{"\n"}
            Email général : info-contact@normx-ai.com{"\n"}
            Téléphone : 06 20 76 94 24{"\n"}
            Courrier : NORMX AI SAS – DPO, 71 rue Daire, 80000 Amiens
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
