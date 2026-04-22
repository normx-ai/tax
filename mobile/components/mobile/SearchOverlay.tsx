import { useState, useEffect, useRef, useMemo, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { ThemeColors } from '@/lib/theme/colors';
import { useTranslation } from "react-i18next";
import { searchArticles, type SearchResult } from "@/lib/data/cgi";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { normalize } from "@/lib/data/helpers";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const QUICK_LINKS: { icon: keyof typeof Ionicons.glyphMap; labelKey: string; route: string }[] = [
  { icon: "book-outline", labelKey: "sidebar.code", route: "/(app)/code" },
  { icon: "stats-chart-outline", labelKey: "sidebar.simulators", route: "/(app)/simulateur" },
  { icon: "chatbubbles-outline", labelKey: "sidebar.chat", route: "/(app)/chat" },
  { icon: "calendar-outline", labelKey: "sidebar.calendrier", route: "/(app)/calendrier" },
];

const HighlightedText = memo(function HighlightedText({
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

  // Construire une regex avec tous les mots
  const escaped = normalizedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const normalizedText = normalize(text);

  // Trouver les positions des matchs dans le texte normalisé
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
          <Text
            key={i}
            style={{
              backgroundColor: highlightColor,
              fontFamily: fonts.bold,
              fontWeight: fontWeights.bold,
            }}
          >
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        )
      )}
    </Text>
  );
});

const RelevanceBadge = memo(function RelevanceBadge({ score, colors }: { score: number; colors: ThemeColors }) {
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
      <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 10, color: fg }}>
        {label}
      </Text>
    </View>
  );
});

export default function SearchOverlay({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<TextInput>(null);

  const results: SearchResult[] = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return searchArticles(debouncedQuery).slice(0, 30);
  }, [debouncedQuery]);

  const highlightColor = `${colors.primary}25`;

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setQuery("");
    }
  }, [visible]);

  const handleSelectArticle = (art: SearchResult["art"]) => {
    onClose();
    router.push("/(app)/code" as Href);
  };

  const handleQuickLink = (route: string) => {
    onClose();
    router.push(route as Href);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header recherche */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingTop: 14,
            paddingBottom: 10,
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.input,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 17,
                color: colors.text,
                fontFamily: fonts.regular,
              }}
              placeholder={t("code.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Résultats de recherche */}
          {debouncedQuery.length >= 2 ? (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontWeight: fontWeights.semiBold,
                    fontSize: 15,
                    color: colors.textSecondary,
                  }}
                >
                  {results.length} {t("code.article")}(s)
                </Text>
                {results.length > 0 && (
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted }}>
                    Triés par pertinence
                  </Text>
                )}
              </View>
              {results.map(({ art, score, matchedWords }, i) => (
                <TouchableOpacity
                  key={`${art.article}-${i}`}
                  onPress={() => handleSelectArticle(art)}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: score >= 100 ? `${colors.primary}40` : colors.border,
                    padding: 14,
                    marginBottom: 8,
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: score >= 100 ? `${colors.primary}20` : `${colors.primary}10`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <HighlightedText
                        text={art.article}
                        words={matchedWords}
                        highlightColor={highlightColor}
                        style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 15, color: colors.primary }}
                      />
                      <RelevanceBadge score={score} colors={colors} />
                    </View>
                    {art.titre && (
                      <HighlightedText
                        text={art.titre}
                        words={matchedWords}
                        highlightColor={highlightColor}
                        numberOfLines={2}
                        style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 14, color: colors.text, marginTop: 2 }}
                      />
                    )}
                    <HighlightedText
                      text={art.texte.join(" ")}
                      words={matchedWords}
                      highlightColor={highlightColor}
                      numberOfLines={2}
                      style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 }}
                    />
                    {/* Mots-clés matchés */}
                    {art.mots_cles.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {art.mots_cles
                          .filter((mc) => matchedWords.some((w) => normalize(mc).includes(normalize(w))))
                          .slice(0, 4)
                          .map((mc, j) => (
                            <View
                              key={j}
                              style={{
                                backgroundColor: `${colors.primary}10`,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                              }}
                            >
                              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.primary }}>
                                {mc}
                              </Text>
                            </View>
                          ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {results.length === 0 && (
                <View style={{ alignItems: "center", paddingTop: 40 }}>
                  <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                  <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 16, color: colors.textMuted, marginTop: 12 }}>
                    {t("common.noResults")}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
                    Essayez avec des termes différents ou un numéro d'article
                  </Text>
                </View>
              )}
            </>
          ) : (
            /* Liens rapides quand pas de recherche */
            <>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontWeight: fontWeights.bold,
                  fontSize: 17,
                  color: colors.text,
                  marginBottom: 14,
                }}
              >
                {t("dashboard.quickActions")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {QUICK_LINKS.map((link) => (
                  <TouchableOpacity
                    key={link.route}
                    onPress={() => handleQuickLink(link.route)}
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 16,
                      width: "48%",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: `${colors.primary}15`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={link.icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15, color: colors.text }}>
                      {t(link.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
