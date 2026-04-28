import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { ThemeColors } from '@/lib/theme/colors';
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 8, paddingLeft: 8 }}>
      <Text style={{ fontSize: 16, color: colors.textMuted, lineHeight: 22, fontFamily: fonts.medium, fontWeight: fontWeights.medium, width: 200 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, color: colors.text, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular, flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

export default function MentionsLegalesScreen() {
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
                Mentions légales
              </Text>
            </View>
          </View>

          {/* Séparateur doré */}
          <View style={{ height: 2, backgroundColor: GOLD, opacity: 0.3, marginBottom: 24 }} />

          <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, fontStyle: "italic", fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)
          </Text>

          {/* 1. Éditeur */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 24, marginBottom: 10 }}>
            1. Éditeur de l'application
          </Text>
          <InfoRow label="Dénomination sociale" value="NORMX AI" colors={colors} />
          <InfoRow label="Sigle" value="NX" colors={colors} />
          <InfoRow label="Forme juridique" value="Société par Actions Simplifiée (SAS)" colors={colors} />
          <InfoRow label="Capital social" value="1 000 €" colors={colors} />
          <InfoRow label="Siège social" value="71 rue Daire, 80000 Amiens" colors={colors} />
          <InfoRow label="SIREN" value="103 831 921" colors={colors} />
          <InfoRow label="SIRET (siège)" value="103 831 921 00012" colors={colors} />
          <InfoRow label="RCS" value="Amiens — 103 831 921" colors={colors} />
          <InfoRow label="Code APE" value="62.01Z — Programmation informatique" colors={colors} />
          <InfoRow label="EUID" value="FR8002.103831921" colors={colors} />
          <InfoRow label="TVA" value="Non applicable, art. 293 B du CGI (franchise en base)" colors={colors} />
          <InfoRow label="Marque" value="« NORMX AI » — déposée auprès de l'INPI" colors={colors} />
          <InfoRow label="Date d'immatriculation" value="2 avril 2026" colors={colors} />
          <InfoRow label="Téléphone" value="06 20 76 94 24" colors={colors} />
          <InfoRow label="Email" value="info-contact@normx-ai.com" colors={colors} />

          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 22, fontFamily: fonts.regular, fontWeight: fontWeights.regular, marginTop: 16, fontStyle: "italic" }}>
            NORMX AI SAS commercialise ses services principalement à destination de professionnels établis hors de l'Union européenne (notamment République du Congo). Les prestations correspondantes sont facturées hors taxes au titre de l'export de services. Pour les Clients établis en France ou dans l'Union européenne, la franchise en base de TVA prévue à l'article 293 B du CGI s'applique tant que le seuil légal n'est pas dépassé.
          </Text>

          {/* 2. Directeur de publication */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            2. Directrice de la publication
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            POATY-KAMBISSI Christelle Elodie épouse MABIKA, en qualité de Directrice de la publication.
          </Text>

          {/* 3. Hébergeur */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            3. Hébergeur
          </Text>
          <InfoRow label="Dénomination" value="OVH SAS" colors={colors} />
          <InfoRow label="Siège social" value="2 rue Kellermann, 59100 Roubaix, France" colors={colors} />
          <InfoRow label="Téléphone" value="1007 (depuis la France)" colors={colors} />
          <InfoRow label="Site web" value="www.ovhcloud.com" colors={colors} />
          <InfoRow label="Certification" value="ISO 27001" colors={colors} />

          {/* 4. Objet */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            4. Objet de l'application
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            NORMX AI est une plateforme numérique SaaS éditée par NORMX AI SAS, proposant des outils de comptabilité (SYSCOHADA/SYCEBNL), de fiscalité (CGI Congo 2026, code social), de gestion de la paie, de génération d'états financiers et de documents juridiques conformes au droit OHADA, assistés par intelligence artificielle.
          </Text>

          {/* 5. Propriété intellectuelle */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            5. Propriété intellectuelle
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            La marque « NORMX AI » est enregistrée auprès de l'Institut National de la Propriété Industrielle (INPI).{"\n\n"}
            L'ensemble du contenu de l'application (structure, textes, graphismes, images, logiciels, bases de données, marques, logos) est la propriété exclusive de NORMX AI SAS ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable, est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
          </Text>

          {/* 6. Données personnelles */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            6. Données personnelles
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            Le traitement des données personnelles est détaillé dans notre Politique de confidentialité, accessible depuis le menu de l'application. Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez de droits sur vos données. Pour toute question, contactez : info-contact@normx-ai.com.{"\n\n"}
            Vous pouvez également introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL) : www.cnil.fr
          </Text>

          {/* 7. Médiation */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            7. Médiation de la consommation
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            Conformément aux dispositions du Code de la consommation concernant « le processus de médiation des litiges de la consommation », après nous avoir sollicités et à défaut de réponse vous satisfaisant, vous avez la possibilité de recourir gratuitement à une procédure de médiation de la consommation auprès de :{"\n\n"}
            CM2C{"\n"}
            49 rue de Ponthieu{"\n"}
            75 008 PARIS{"\n"}
            Tél : 01 89 47 00 14{"\n"}
            Site internet : https://www.cm2c.net/declarer-un-litige.php{"\n"}
            Mail : litiges@cm2c.net{"\n\n"}
            Vous pouvez également utiliser la plateforme européenne de règlement en ligne des litiges :{"\n"}
            https://ec.europa.eu/consumers/odr
          </Text>

          {/* 8. Droit applicable */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            8. Droit applicable
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront compétents.
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
