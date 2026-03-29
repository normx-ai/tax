import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const GOLD = "#D4A843";

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32, gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "rgba(200,160,60,0.13)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 24, color: GOLD }}>N</Text>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 22, color: colors.text }}>
                NORMX <Text style={{ color: GOLD }}>AI</Text>
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: colors.textMuted }}>
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
          <InfoRow label="Forme juridique" value="Société par Actions Simplifiée (SAS)" colors={colors} />
          <InfoRow label="Capital social" value="1 000 €" colors={colors} />
          <InfoRow label="Siège social" value="5 rue Benjamin Raspail, 60100 Creil" colors={colors} />
          <InfoRow label="RCS" value="Compiègne — 941 200 169" colors={colors} />
          <InfoRow label="Téléphone" value="06 20 76 94 24" colors={colors} />
          <InfoRow label="Email" value="info-contact@normx-ai.com" colors={colors} />

          {/* 2. Directeur de publication */}
          <Text style={{ fontSize: 19, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: GOLD, marginTop: 28, marginBottom: 10 }}>
            2. Directrice de la publication
          </Text>
          <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, fontFamily: fonts.regular, fontWeight: fontWeights.regular, paddingLeft: 8 }}>
            Christelle MABIKA, en qualité de Présidente de NORMX AI SAS.
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
            Conformément aux articles L.612-1 et suivants du Code de la consommation, en cas de litige non résolu par notre service client, vous pouvez recourir gratuitement au médiateur de la consommation dont nous relevons :{"\n\n"}
            Médiateur : en cours de désignation{"\n\n"}
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
            NORMX AI SAS — 5 rue Benjamin Raspail, 60100 Creil — info-contact@normx-ai.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
