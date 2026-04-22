import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { ThemeColors } from '@/lib/theme/colors';
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ArticleData, SearchResult } from "@/lib/data/cgi";
import { normalize } from "@/lib/data/helpers";

function HighlightedText({
  text,
  words,
  style,
  highlightColor,
  numberOfLines,
}: {
  text: string;
  words: string[];
  style: import("react-native").TextStyle;
  highlightColor: string;
  numberOfLines?: number;
}) {
  if (!words.length || !text) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const normalizedWords = words.map(normalize).filter((w) => w.length > 1);
  if (!normalizedWords.length) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const escaped = normalizedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const normalizedText = normalize(text);

  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    parts.push({ text: text.slice(match.index, match.index + match[0].length), highlight: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  if (parts.length === 0) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.highlight ? (
          <Text key={i} style={{ backgroundColor: highlightColor, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>{part.text}</Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        )
      )}
    </Text>
  );
}

function RelevanceBadge({ score, colors }: { score: number; colors: ThemeColors }) {
  let label: string;
  let bg: string;
  let fg: string;

  if (score >= 100) {
    label = "Exact";
    bg = `${colors.success}20`;
    fg = colors.success;
  } else if (score >= 40) {
    label = "Pertinent";
    bg = `${colors.primary}15`;
    fg = colors.primary;
  } else {
    label = "Partiel";
    bg = `${colors.textMuted}15`;
    fg = colors.textMuted;
  }

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 11, color: fg }}>{label}</Text>
    </View>
  );
}

type Props = {
  query: string;
  results: SearchResult[];
  onSelectArticle: (article: ArticleData) => void;
};

export default function SearchResults({ query, results, onSelectArticle }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const highlightColor = `${colors.primary}25`;

  if (results.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Ionicons name="search-outline" size={64} color={colors.textMuted} />
        <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 20, color: colors.textMuted, marginTop: 16, textAlign: "center" }}>
          {t("code.noResultsFor", { query })}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 16, color: colors.textMuted, marginTop: 8, textAlign: "center" }}>
          {t("code.tryOtherTerm")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16, color: colors.primary, textTransform: "uppercase", letterSpacing: 1 }}>
          {t("code.resultsCount", { count: results.length, query })}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted }}>Triés par pertinence</Text>
      </View>

      {results.map(({ art, score, matchedWords }, i) => (
        <TouchableOpacity
          key={`${art.article}-${i}`}
          style={{
            backgroundColor: colors.card,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: score >= 100 ? `${colors.primary}40` : colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => onSelectArticle(art)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <HighlightedText
                text={art.article}
                words={matchedWords}
                highlightColor={highlightColor}
                style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 20, color: colors.text }}
              />
              <RelevanceBadge score={score} colors={colors} />
            </View>
            <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.primary }}>{art.statut}</Text>
            </View>
          </View>
          <HighlightedText
            text={art.titre}
            words={matchedWords}
            highlightColor={highlightColor}
            style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 17, color: colors.text, marginBottom: 8 }}
          />
          <HighlightedText
            text={art.texte.join(" ")}
            words={matchedWords}
            highlightColor={highlightColor}
            numberOfLines={2}
            style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 15, color: colors.textMuted }}
          />
          {art.mots_cles.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 4 }}>
              {art.mots_cles
                .filter((mc) => matchedWords.some((w) => normalize(mc).includes(normalize(w))))
                .slice(0, 4)
                .map((mc, j) => (
                  <View key={j} style={{ backgroundColor: `${colors.primary}10`, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.primary }}>{mc}</Text>
                  </View>
                ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
