import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { ThemeColors } from '@/lib/theme/colors';
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { BANK, COMPANY } from "@/lib/constants/company";

const GOLD = "#D4A843";

function BulletItem({ children, colors }: { children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 6, paddingLeft: 8 }}>
      <Text style={{ fontSize: 16, color: GOLD, marginRight: 10, lineHeight: 22 }}>&#x2022;</Text>
      <Text style={{ fontSize: 16, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular, flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

function ArticleTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

function Paragraph({ children, colors }: { children: React.ReactNode; colors: ThemeColors }) {
  return (
    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
      {children}
    </Text>
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
                Conditions Générales d'Utilisation et de Vente
              </Text>
            </View>
          </View>

          {/* Séparateur doré */}
          <View style={{ height: 2, backgroundColor: GOLD, opacity: 0.3, marginBottom: 24 }} />

          <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, fontStyle: "italic", fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Version 2.0 — Dernière mise à jour : 26 avril 2026
          </Text>

          {/* Préambule */}
          <ArticleTitle>Préambule</ArticleTitle>
          <Paragraph colors={colors}>
            Les présentes Conditions Générales d'Utilisation et de Vente (ci-après « CGU/CGV ») constituent un contrat entre {COMPANY.legalName} SAS, société par actions simplifiée au capital de 1 000 €, immatriculée au RCS d'Amiens sous le numéro {COMPANY.siren} (SIRET {COMPANY.siret}, code APE {COMPANY.ape}), dont le siège social est situé au {COMPANY.address}, ci-après « NORMX AI » ou « l'Éditeur », et toute personne physique ou morale qui accède à la Plateforme, ci-après « l'Utilisateur ».{"\n\n"}
            Elles constituent simultanément :{"\n"}
            – les conditions d'utilisation de la Plateforme (CGU) pour tout Utilisateur, y compris en accès gratuit ;{"\n"}
            – les conditions générales de vente (CGV) pour tout Utilisateur souscrivant à un Plan payant, ci-après « le Client ».{"\n\n"}
            La validation du compte ou la souscription à un Plan emporte acceptation pleine et entière des présentes CGU/CGV ainsi que de la Politique de confidentialité accessible depuis l'application.
          </Paragraph>

          {/* Article 1 */}
          <ArticleTitle>Article 1 — Définitions</ArticleTitle>
          <BulletItem colors={colors}>« Plateforme » : l'ensemble des sites web, applications web et mobiles édités par NORMX AI sous la marque NORMX (Tax, Compta, Paie, États, Legal).</BulletItem>
          <BulletItem colors={colors}>« Service » : les fonctionnalités proposées par la Plateforme, accessibles en ligne en mode SaaS (Software as a Service).</BulletItem>
          <BulletItem colors={colors}>« Compte » : l'espace personnel rattaché à un Utilisateur identifié, créé via le fournisseur d'identité Keycloak (auth.normx-ai.com).</BulletItem>
          <BulletItem colors={colors}>« Organisation » : entité regroupant un ou plusieurs Comptes (cabinet, entreprise, indépendant).</BulletItem>
          <BulletItem colors={colors}>« Plan » : formule d'abonnement souscrite (Free, Pro, etc.) déterminant les fonctionnalités et quotas accessibles.</BulletItem>
          <BulletItem colors={colors}>« Données Client » : l'ensemble des données chargées ou saisies par l'Utilisateur dans la Plateforme (entités fiscales, dossiers, balances, déclarations, documents).</BulletItem>
          <BulletItem colors={colors}>« Professionnel » : Utilisateur agissant à des fins entrant dans le cadre de son activité commerciale, industrielle, artisanale, libérale ou agricole (art. liminaire du Code de la consommation).</BulletItem>
          <BulletItem colors={colors}>« Consommateur » : personne physique agissant à des fins n'entrant pas dans le cadre de son activité professionnelle.</BulletItem>

          {/* Article 2 */}
          <ArticleTitle>Article 2 — Accès au Service et création du compte</ArticleTitle>
          <Paragraph colors={colors}>
            L'accès à la Plateforme nécessite la création d'un Compte. L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour, et à maintenir la confidentialité de ses identifiants de connexion. Tout accès non autorisé constaté doit être signalé sans délai à {COMPANY.contact.support}.{"\n\n"}
            L'authentification à deux facteurs (2FA) est fortement recommandée pour les Comptes manipulant des Données Client sensibles.{"\n\n"}
            La Plateforme est accessible 24h/24, 7j/7, sous réserve des interruptions pour maintenance, mises à jour ou cas de force majeure (article 11). Une connexion Internet et un navigateur récent sont nécessaires.
          </Paragraph>

          {/* Article 3 */}
          <ArticleTitle>Article 3 — Description des services</ArticleTitle>
          <Paragraph colors={colors}>
            La Plateforme NORMX AI propose notamment :
          </Paragraph>
          <BulletItem colors={colors}>Consultation du Code Général des Impôts du Congo (CGI 242) édition 2026 et de codes fiscaux d'autres pays africains.</BulletItem>
          <BulletItem colors={colors}>Simulateurs fiscaux : ITS, IS, IS para-pétrolier, TVA, Patente, Taxe foncière, Taxe immobilière, Droits d'enregistrement, Solde de liquidation, IRF, IBA, Retenue à la source, Contribution spéciale de solidarité, Taxe sur les transferts de fonds, Centimes additionnels.</BulletItem>
          <BulletItem colors={colors}>Assistant IA fiscal pour répondre aux questions de droit fiscal congolais (article 8).</BulletItem>
          <BulletItem colors={colors}>Catalogue d'obligations fiscales et moteur d'applicabilité par entité (régime IS, secteur, forme juridique).</BulletItem>
          <BulletItem colors={colors}>Gestion d'organisation, dossiers, documents, alertes d'échéances et rappels par email.</BulletItem>
          <BulletItem colors={colors}>Mode hors-ligne pour la consultation sans connexion (selon plan).</BulletItem>

          {/* Article 4 */}
          <ArticleTitle>Article 4 — Conditions financières</ArticleTitle>
          <Paragraph colors={colors}>
            4.1 Plans et tarifs. Les Plans et leurs tarifs sont affichés dans l'application avant toute souscription. Ils peuvent évoluer ; toute évolution est sans effet sur la période d'engagement en cours.{"\n\n"}
            4.2 Devise et fiscalité. La facturation est libellée en EUR par NORMX AI SAS depuis la France. Un montant en Francs CFA (XAF) peut être affiché à titre indicatif sur la base du taux de change parité fixe BEAC (1 EUR = 655,957 XAF). Les souscriptions hors Union européenne (notamment République du Congo) sont facturées hors taxes au titre de l'export de services. NORMX AI SAS bénéficie de la franchise en base de TVA prévue à l'article 293 B du CGI français : aucune TVA n'est facturée tant que le seuil légal n'est pas dépassé. La mention « TVA non applicable, art. 293 B du CGI » figure sur les factures concernées.{"\n\n"}
            4.3 Moyens de paiement. Deux modes de paiement sont proposés :{"\n"}
            – Carte bancaire via Stripe Checkout (page sécurisée hébergée par Stripe, certifié PCI-DSS niveau 1). L'abonnement est activé immédiatement après confirmation du paiement.{"\n"}
            – Virement bancaire vers le compte ouvert au nom de NORMX AI auprès de Shine (France) :
          </Paragraph>
          <View style={{ marginTop: 8, padding: 12, backgroundColor: "rgba(200,160,60,0.06)" }}>
            <Text style={{ fontSize: 14, color: colors.text, fontFamily: fonts.regular, lineHeight: 22 }}>
              Titulaire : {BANK.holder}{"\n"}
              Banque : {BANK.name} (France){"\n"}
              IBAN : {BANK.iban}{"\n"}
              BIC : {BANK.bic}
            </Text>
          </View>
          <Paragraph colors={colors}>
            {"\n"}Le Client doit indiquer le numéro de la facture en libellé du virement. Tout autre moyen de paiement (carte, mobile money) sera annoncé dans l'application avant son activation.{"\n\n"}
            4.4 Activation. L'abonnement est activé dans un délai de deux (2) jours ouvrés à compter de la réception effective des fonds par NORMX AI. Le Client peut accélérer le traitement en transmettant la preuve du virement à {COMPANY.contact.billing}.{"\n\n"}
            4.5 Durée et reconduction. Sauf mention contraire au Plan souscrit, l'abonnement est conclu pour une durée d'un mois ou d'un an et se reconduit tacitement pour une durée identique. Le Client peut s'opposer à la reconduction depuis l'application au plus tard 7 jours avant l'échéance pour les Plans mensuels et 30 jours avant l'échéance pour les Plans annuels. Pour les Consommateurs, les dispositions de l'article L.215-1 du Code de la consommation (loi Châtel) s'appliquent : NORMX AI les informe par écrit, au plus tôt trois mois et au plus tard un mois avant le terme, de leur faculté de ne pas reconduire l'abonnement.{"\n\n"}
            4.6 Pénalités de retard (Professionnels). Conformément aux articles L.441-10 et L.441-11 du Code de commerce, tout paiement non effectué à l'échéance entraîne de plein droit l'application de pénalités de retard au taux directeur de la Banque centrale européenne majoré de 10 points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros, sans qu'aucune mise en demeure préalable ne soit nécessaire. Des frais supplémentaires justifiés peuvent être réclamés sur présentation de justificatifs.{"\n\n"}
            4.7 Suspension pour impayé. À défaut de paiement à l'échéance, et après une (1) relance restée sans effet pendant 15 jours, NORMX AI se réserve le droit de suspendre l'accès au Service jusqu'à régularisation, sans indemnité.{"\n\n"}
            4.8 Pas de remboursement au prorata. Sauf cas légal (article 6, force majeure article 11, garantie de conformité article 10), aucun remboursement au prorata n'est dû en cas de résiliation en cours de période.
          </Paragraph>

          {/* Article 5 */}
          <ArticleTitle>Article 5 — Facturation</ArticleTitle>
          <Paragraph colors={colors}>
            Une facture électronique au format PDF est émise par NORMX AI à chaque période de facturation et adressée à l'adresse email du Client. Elle est également accessible depuis l'application (rubrique Abonnement / Factures). Les factures sont conservées dix (10) ans conformément à l'article L.123-22 du Code de commerce.
          </Paragraph>

          {/* Article 6 */}
          <ArticleTitle>Article 6 — Droit de rétractation</ArticleTitle>
          <Paragraph colors={colors}>
            6.1 Consommateurs. Conformément à l'article L.221-18 du Code de la consommation, le Consommateur dispose d'un délai de quatorze (14) jours à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motif. La demande s'effectue par email à {COMPANY.contact.billing}. Le remboursement intervient dans les 14 jours suivants par virement.{"\n\n"}
            Conformément à l'article L.221-28, 13° du Code de la consommation, le Consommateur qui demande expressément l'exécution immédiate du Service avant la fin du délai de 14 jours et reconnaît perdre son droit de rétractation ne peut plus l'exercer après que le Service a été pleinement exécuté.{"\n\n"}
            6.2 Professionnels. Le droit de rétractation prévu par le Code de la consommation n'est pas applicable aux Professionnels souscrivant un Plan dans le cadre de leur activité, conformément à l'article liminaire du Code de la consommation.
          </Paragraph>

          {/* Article 7 */}
          <ArticleTitle>Article 7 — Niveau de service (SLA)</ArticleTitle>
          <Paragraph colors={colors}>
            NORMX AI s'engage en obligation de moyens à fournir un Service disponible avec un objectif de disponibilité de 99 % en moyenne mensuelle, hors fenêtres de maintenance planifiée et hors cas de force majeure.{"\n\n"}
            Les opérations de maintenance planifiée sont annoncées dans l'application au moins 48 heures à l'avance et programmées de préférence en dehors des heures ouvrées Brazzaville (UTC+1). Les correctifs de sécurité critiques peuvent être déployés sans préavis.{"\n\n"}
            Le support utilisateur est assuré par email à {COMPANY.contact.support} les jours ouvrés. NORMX AI ne s'engage à aucun délai contractuel de réponse mais s'efforce de traiter les demandes dans les meilleurs délais.
          </Paragraph>

          {/* Article 8 */}
          <ArticleTitle>Article 8 — Avertissement sur l'intelligence artificielle</ArticleTitle>
          <Paragraph colors={colors}>
            La Plateforme intègre un assistant fondé sur des modèles de langage de grande taille (notamment Claude, fourni par la société Anthropic PBC).{"\n\n"}
            L'Utilisateur reconnaît expressément que :
          </Paragraph>
          <BulletItem colors={colors}>Les réponses de l'assistant IA peuvent contenir des erreurs, des approximations ou des « hallucinations » (informations inexactes ou inventées) ;</BulletItem>
          <BulletItem colors={colors}>Elles ont un caractère purement informatif et ne constituent ni un conseil fiscal, ni un conseil juridique, ni un conseil comptable au sens des professions réglementées ;</BulletItem>
          <BulletItem colors={colors}>L'Utilisateur s'engage à valider toute information critique avant de l'utiliser à des fins opérationnelles, par recoupement avec les sources officielles (CGI, textes réglementaires, circulaires) ou par consultation d'un professionnel agréé ;</BulletItem>
          <BulletItem colors={colors}>Aucune décision automatisée produisant des effets juridiques au sens de l'article 22 du RGPD n'est prise par la Plateforme ;</BulletItem>
          <BulletItem colors={colors}>Les prompts adressés à l'assistant IA ne sont pas utilisés pour entraîner les modèles tiers, conformément aux engagements contractuels souscrits par NORMX AI auprès d'Anthropic (politique de non-rétention pour entraînement) ;</BulletItem>
          <BulletItem colors={colors}>Le service IA est fourni dans le respect des obligations de transparence du règlement (UE) 2024/1689 dit « AI Act ».</BulletItem>

          {/* Article 9 */}
          <ArticleTitle>Article 9 — Propriété intellectuelle</ArticleTitle>
          <Paragraph colors={colors}>
            La marque « NORMX AI » est enregistrée auprès de l'Institut National de la Propriété Industrielle (INPI). L'ensemble du contenu de la Plateforme (textes, graphismes, logiciels, bases de données, marques, logos) est protégé par le droit français de la propriété intellectuelle et est la propriété exclusive de NORMX AI SAS ou de ses partenaires.{"\n\n"}
            Toute reproduction, représentation, modification, publication ou exploitation, totale ou partielle, sans autorisation écrite préalable, est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.{"\n\n"}
            Les Données Client demeurent la propriété exclusive du Client. Le Client concède à NORMX AI une licence d'usage strictement nécessaire à l'exécution du Service, pour la durée du contrat et limitée à cette finalité.
          </Paragraph>

          {/* Article 10 */}
          <ArticleTitle>Article 10 — Responsabilité</ArticleTitle>
          <Paragraph colors={colors}>
            10.1 Engagement de moyens. NORMX AI est tenue d'une obligation de moyens dans la fourniture du Service.{"\n\n"}
            10.2 Garantie légale. Conformément aux articles L.224-25-12 et suivants du Code de la consommation, le Consommateur bénéficie de la garantie légale de conformité pour les contenus et services numériques.{"\n\n"}
            10.3 Limitation pour les Professionnels. Pour les Professionnels, et dans toute la mesure permise par la loi, la responsabilité totale cumulée de NORMX AI au titre du contrat, toutes causes confondues, est plafonnée au montant hors taxes effectivement payé par le Client au cours des douze (12) mois précédant le fait générateur. Sont expressément exclus de l'indemnisation les dommages indirects, notamment la perte de chance, la perte d'exploitation, la perte de chiffre d'affaires, la perte de clientèle ou l'atteinte à l'image. Cette limitation ne s'applique ni aux dommages corporels, ni à la faute lourde ou intentionnelle, ni aux engagements expressément qualifiés d'obligations de résultat.
          </Paragraph>

          {/* Article 11 */}
          <ArticleTitle>Article 11 — Force majeure</ArticleTitle>
          <Paragraph colors={colors}>
            Aucune des parties ne sera tenue responsable de l'inexécution ou du retard d'exécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil. Sont notamment considérés comme tels : grève générale, conflit armé, catastrophe naturelle, panne majeure d'un opérateur de télécommunications ou d'un prestataire d'hébergement, décision d'autorité publique, attaque informatique d'envergure rendant le Service inaccessible.{"\n\n"}
            La partie subissant l'événement notifie l'autre par tout moyen écrit dans un délai raisonnable. L'exécution des obligations est suspendue pendant la durée de l'événement. Si la force majeure se prolonge au-delà de soixante (60) jours, chacune des parties peut résilier le contrat de plein droit sans indemnité, par lettre recommandée ou email.
          </Paragraph>

          {/* Article 12 */}
          <ArticleTitle>Article 12 — Confidentialité</ArticleTitle>
          <Paragraph colors={colors}>
            Chacune des parties s'engage à conserver confidentielles toutes les informations identifiées comme telles ou présentant un caractère confidentiel par nature qu'elle reçoit de l'autre partie dans le cadre du contrat. Cet engagement vise notamment, du côté de NORMX AI, les Données Client (entités fiscales, dossiers, balances, déclarations, pièces jointes) qui ne sont accessibles qu'aux membres de l'Organisation à laquelle elles se rattachent et aux sous-traitants strictement nécessaires (article 13).{"\n\n"}
            L'engagement de confidentialité subsiste pendant toute la durée du contrat et pour une durée de cinq (5) ans à compter de sa cessation, sauf disposition légale ou réglementaire imposant une durée différente.
          </Paragraph>

          {/* Article 13 */}
          <ArticleTitle>Article 13 — Sous-traitants</ArticleTitle>
          <Paragraph colors={colors}>
            NORMX AI fait appel aux sous-traitants suivants pour la fourniture du Service :
          </Paragraph>
          <BulletItem colors={colors}>OVH SAS (hébergement) — France (Roubaix), certifié ISO 27001 ;</BulletItem>
          <BulletItem colors={colors}>Anthropic PBC (modèle d'IA Claude) — San Francisco, États-Unis. Transfert encadré cumulativement par : (i) le EU-US Data Privacy Framework (décision 2023/1795 du 10 juillet 2023, confirmée TUE 03/09/2025), Anthropic étant inscrit sur la liste officielle ; (ii) les Clauses Contractuelles Types 2021/914 Modules 2 et 3 incorporées au Data Processing Addendum signé avec NORMX AI ; (iii) un Transfer Impact Assessment (TIA) tenant compte du droit américain (FISA, EO 12333, CLOUD Act). Sous-traitants ultérieurs d'Anthropic : Amazon Web Services et Google Cloud Platform (USA), couverts par le DPA. Engagements : non-utilisation des prompts pour entraînement, rétention logs ≤ 7 jours, notification des incidents et demandes d'autorités sous 48 h ;</BulletItem>
          <BulletItem colors={colors}>Functional Software Inc. (Sentry, monitoring d'erreurs) — Allemagne (Francfort) ;</BulletItem>
          <BulletItem colors={colors}>Prestataire SMTP (envoi d'emails transactionnels) — Union européenne ;</BulletItem>
          <BulletItem colors={colors}>Société Générale Effiscience SAS (Shine, encaissement par virement) — France ;</BulletItem>
          <BulletItem colors={colors}>Stripe Payments Europe Ltd (paiement par carte bancaire) — Dublin (Irlande), avec sous-traitance ultérieure Stripe Inc. (USA) couverte par les CCT 2021/914 et le Data Privacy Framework. Stripe est certifié PCI-DSS niveau 1 ; aucune donnée de carte ne transite ni n'est stockée par NORMX AI.</BulletItem>
          <Paragraph colors={colors}>
            La liste à jour des sous-traitants est publiée dans la Politique de confidentialité. Tout changement de sous-traitant impactant les Données Client est communiqué avec un préavis raisonnable. Tous les sous-traitants sont liés par des engagements contractuels imposant un niveau de protection au moins équivalent à celui des présentes.
          </Paragraph>

          {/* Article 14 */}
          <ArticleTitle>Article 14 — Réversibilité et export des données</ArticleTitle>
          <Paragraph colors={colors}>
            À tout moment pendant la durée du contrat et jusqu'à trente (30) jours après la résiliation, le Client peut demander l'export de ses Données Client au format CSV ou JSON via l'application ou par email à {COMPANY.contact.support}.{"\n\n"}
            À l'expiration de ce délai de 30 jours, NORMX AI procède à la suppression définitive des Données Client, sauf obligation légale de conservation (notamment données de facturation conservées 10 ans, logs de connexion conservés 12 mois).{"\n\n"}
            L'opération d'export est gratuite dans la limite d'une demande tous les six mois. Au-delà, NORMX AI peut facturer un coût raisonnable couvrant les frais réels exposés.
          </Paragraph>

          {/* Article 15 */}
          <ArticleTitle>Article 15 — Résiliation</ArticleTitle>
          <Paragraph colors={colors}>
            15.1 Résiliation par l'Utilisateur. L'Utilisateur peut résilier son Compte à tout moment depuis les paramètres de l'application. La résiliation prend effet à l'échéance de la période d'engagement en cours, sans remboursement au prorata.{"\n\n"}
            15.2 Résiliation par NORMX AI. NORMX AI peut résilier le contrat de plein droit en cas de violation par l'Utilisateur des présentes CGU/CGV, après mise en demeure restée sans effet pendant quinze (15) jours. En cas de manquement grave (utilisation frauduleuse, atteinte à la sécurité, contenu illicite), la suspension peut être immédiate ; l'Utilisateur en est informé par email avec le motif.{"\n\n"}
            15.3 Conséquences. À la résiliation, l'accès au Service cesse à l'échéance. Les Données Client sont conservées 30 jours pour permettre leur export (article 14) puis supprimées.
          </Paragraph>

          {/* Article 16 */}
          <ArticleTitle>Article 16 — Données personnelles</ArticleTitle>
          <Paragraph colors={colors}>
            Le traitement des données personnelles est régi par la Politique de confidentialité, qui fait partie intégrante des présentes CGU/CGV et est accessible depuis l'application. Elle détaille les données collectées, les finalités, les bases légales, les destinataires, les durées de conservation, les transferts hors UE et les modalités d'exercice des droits.
          </Paragraph>

          {/* Article 17 */}
          <ArticleTitle>Article 17 — Médiation de la consommation</ArticleTitle>
          <Paragraph colors={colors}>
            Conformément aux dispositions du Code de la consommation concernant « le processus de médiation des litiges de la consommation », après nous avoir sollicités ({COMPANY.contact.info}) et à défaut de réponse vous satisfaisant, vous avez la possibilité de recourir gratuitement à une procédure de médiation de la consommation auprès de :{"\n\n"}
            CM2C{"\n"}
            49 rue de Ponthieu{"\n"}
            75 008 PARIS{"\n"}
            Tél : 01 89 47 00 14{"\n"}
            Site internet : https://www.cm2c.net/declarer-un-litige.php{"\n"}
            Mail : litiges@cm2c.net{"\n\n"}
            Le Consommateur peut également utiliser la plateforme européenne de règlement en ligne des litiges (RLL) :{"\n"}
            https://ec.europa.eu/consumers/odr
          </Paragraph>

          {/* Article 18 */}
          <ArticleTitle>Article 18 — Modification des CGU/CGV</ArticleTitle>
          <Paragraph colors={colors}>
            NORMX AI se réserve le droit de modifier les présentes CGU/CGV. Toute modification substantielle est notifiée à l'Utilisateur dans l'application ou par email au moins trente (30) jours avant son entrée en vigueur. La poursuite de l'utilisation du Service après cette date vaut acceptation des nouvelles conditions ; à défaut, l'Utilisateur peut résilier sans indemnité.
          </Paragraph>

          {/* Article 19 */}
          <ArticleTitle>Article 19 — Droit applicable et juridiction</ArticleTitle>
          <Paragraph colors={colors}>
            Les présentes CGU/CGV sont soumises au droit français.{"\n\n"}
            En cas de litige, une solution amiable sera recherchée préalablement à toute action contentieuse. À défaut :
          </Paragraph>
          <BulletItem colors={colors}>le Consommateur peut saisir, à son choix, la juridiction de son lieu de domicile ou la juridiction du lieu de la fourniture du Service, conformément à l'article R.631-3 du Code de la consommation ;</BulletItem>
          <BulletItem colors={colors}>les litiges opposant NORMX AI à un Professionnel relèvent de la compétence exclusive du Tribunal de commerce d'Amiens, y compris en cas de pluralité de défendeurs, d'appel en garantie ou de procédure d'urgence.</BulletItem>

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
