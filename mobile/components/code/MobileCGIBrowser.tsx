import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useTheme } from "@/lib/theme/ThemeContext";
import type { ThemeColors } from '@/lib/theme/colors';
import { useTranslation } from "react-i18next";
import { searchArticles, type SommaireNode, type ArticleData, type SearchResult } from "@/lib/data/cgi";
import { normalize } from "@/lib/data/helpers";
import { useDebounce } from "@/lib/hooks/useDebounce";
import ChapterReader from "./ChapterReader";
import ArticleText from "./ArticleText";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useHistoryStore } from "@/lib/store/history";

const NODE_ICONS: { icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { icon: "book-outline", color: "#00815d" },
  { icon: "document-text-outline", color: "#4f46e5" },
  { icon: "receipt-outline", color: "#d97706" },
  { icon: "briefcase-outline", color: "#9333ea" },
  { icon: "shield-checkmark-outline", color: "#0891b2" },
  { icon: "business-outline", color: "#dc2626" },
  { icon: "library-outline", color: "#ca8a04" },
  { icon: "folder-open-outline", color: "#059669" },
];

type Props = {
  sommaire: SommaireNode[];
};

function countArticles(node: SommaireNode): number {
  let count = node.articles?.length || 0;
  if (node.children) {
    for (const child of node.children) count += countArticles(child);
  }
  return count;
}

// ── Card réutilisable ──
function Card({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Liste de noeuds (tomes, parties, chapitres...) ──
function NodeListView({ nodes, onSelect, title }: {
  nodes: SommaireNode[];
  onSelect: (node: SommaireNode) => void;
  title?: string;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      {title && (
        <Text style={{ fontFamily: fonts.extraBold, fontWeight: fontWeights.extraBold, fontSize: 20, color: colors.text, marginBottom: 16 }}>
          {title}
        </Text>
      )}
      {nodes.map((node, idx) => {
        const artCount = countArticles(node);
        const hasChildren = (node.children && node.children.length > 0) || (node.articles && node.articles.length > 0);
        const ic = NODE_ICONS[idx % NODE_ICONS.length];
        return (
          <Card key={node.id} onPress={() => onSelect(node)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${ic.color}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={ic.icon} size={20} color={ic.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16, color: colors.text }}
                  numberOfLines={2}
                >
                  {node.label}
                </Text>
                {artCount > 0 && (
                  <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.textMuted, marginTop: 3 }}>
                    {artCount} article{artCount > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
              {hasChildren && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
            </View>
          </Card>
        );
      })}
      {nodes.length === 0 && (
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <Ionicons name="construct-outline" size={36} color={colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 16, color: colors.textMuted }}>
            Contenu en cours d'intégration
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Lecteur audio pour article (ligne par ligne) ──
type SpeechState = "idle" | "playing" | "paused";

// Nettoyer le texte pour la lecture vocale : supprimer marqueurs structurels
function cleanForSpeech(text: string): string {
  return text
    .replace(/\bLF\s*\d{4}\b/gi, "")              // LF 2026
    .replace(/\bCGI\s*\d{4}\b/gi, "")              // CGI 2026
    .replace(/^\(\s*[ivxlcdm]+\s*\)\s*/i, "")      // (i), (ii), (iv)
    .replace(/^\d+°\s*/, "")                        // 1°, 2°
    .replace(/^\d+[\.\)]\s*/, "")                   // 1), 2., 3)
    .replace(/^[a-z]\)\s*/i, "")                    // a), b)
    .replace(/^\d+[A-Z]?\.\d+\.\s*/, "")           // 1.2., 1A.3.
    .replace(/^\d+-\s*/, "")                        // 1-, 2-
    .replace(/^[-•○]\s*/, "")                       // -, •, ○
    .replace(/\bArt\.\s*\d+[A-Z]?\b/g, "article $&".replace("Art.", "")) // Art. 105 → article 105
    .trim();
}

function AudioPlayer({ lines, colors, onLineChange }: {
  lines: string[];
  colors: ThemeColors;
  onLineChange: (index: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [highlightIdx, setHighlightIdx] = useState<number | undefined>(undefined);
  const currentIndexRef = useRef(0);
  const stoppedRef = useRef(false);
  const totalLines = lines.filter((l) => l.length > 0).length;

  const nonEmptyIndices = useMemo(() =>
    lines.map((l, i) => (l.length > 0 ? i : -1)).filter((i) => i >= 0),
    [lines]
  );

  // Assignation directe (synchrone) — pas de useEffect
  const speakLineRef = useRef<(idx: number) => void>(() => {});
  speakLineRef.current = (idx: number) => {
    if (stoppedRef.current || idx >= nonEmptyIndices.length) {
      setSpeechState("idle");
      setHighlightIdx(undefined);
      onLineChange(undefined);
      return;
    }
    const lineIndex = nonEmptyIndices[idx];
    currentIndexRef.current = idx;
    setHighlightIdx(lineIndex);
    onLineChange(lineIndex);
    const cleaned = cleanForSpeech(lines[lineIndex]);
    if (!cleaned) {
      // Ligne vide après nettoyage, passer à la suivante
      speakLineRef.current(idx + 1);
      return;
    }
    Speech.speak(cleaned, {
      language: "fr-FR",
      rate: 0.9,
      onDone: () => speakLineRef.current(idx + 1),
      onStopped: () => {},
      onError: () => {
        setSpeechState("idle");
        setHighlightIdx(undefined);
        onLineChange(undefined);
      },
    });
  };

  const play = useCallback(() => {
    stoppedRef.current = false;
    setSpeechState("playing");
    speakLineRef.current(0);
  }, []);

  const pause = useCallback(() => {
    stoppedRef.current = true;
    Speech.stop();
    setSpeechState("paused");
  }, []);

  const resume = useCallback(() => {
    stoppedRef.current = false;
    setSpeechState("playing");
    speakLineRef.current(currentIndexRef.current);
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    Speech.stop();
    setSpeechState("idle");
    currentIndexRef.current = 0;
    setHighlightIdx(undefined);
    onLineChange(undefined);
  }, [onLineChange]);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      Speech.stop();
    };
  }, []);

  const progress = speechState === "idle"
    ? 0
    : totalLines > 0
      ? (currentIndexRef.current + 1) / totalLines
      : 0;

  return (
    <View
      style={{
        backgroundColor: `${colors.primary}12`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
      }}
    >
      {/* Boutons sur une ligne */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {/* Play / Pause */}
        <TouchableOpacity
          onPress={speechState === "playing" ? pause : speechState === "paused" ? resume : play}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={speechState === "playing" ? "pause" : "play"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Stop */}
        {speechState !== "idle" && (
          <TouchableOpacity
            onPress={stop}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.danger || "#dc2626",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="stop" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Label */}
        <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 14, color: colors.text, flex: 1 }}>
          {speechState === "playing"
            ? t("articleDetail.stop")
            : speechState === "paused"
              ? t("articleDetail.paused")
              : t("articleDetail.listen")}
        </Text>
      </View>

      {/* Barre de progression */}
      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: "hidden" }}>
        <View
          style={{
            height: 4,
            backgroundColor: colors.primary,
            borderRadius: 2,
            width: `${Math.round(progress * 100)}%`,
          }}
        />
      </View>
    </View>
  );
}

// ── Vue article détaillé ──
function ArticleDetailView({ article, onBack, codeType }: { article: ArticleData; onBack: () => void; codeType?: "cgi" | "social" }) {
  const { colors } = useTheme();
  const isFavorite = useFavoritesStore((s) => s.isFavorite(article.article));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const addHistory = useHistoryStore((s) => s.addItem);
  const scrollRef = useRef<ScrollView>(null);
  const linePositions = useRef<Record<number, number>>({});
  const [highlightIndex, setHighlightIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    addHistory({ article: article.article, titre: article.titre, code: codeType || "cgi" });
  }, [article.article]);

  const handleLineChange = useCallback((index: number | undefined) => {
    setHighlightIndex(index);
    if (index !== undefined && linePositions.current[index] !== undefined) {
      scrollRef.current?.scrollTo({ y: linePositions.current[index], animated: true });
    }
  }, []);

  const handleLineLayout = useCallback((index: number, y: number) => {
    linePositions.current[index] = y;
  }, []);

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 22, color: colors.primary, flex: 1 }}>
          {article.article}
        </Text>
        <TouchableOpacity onPress={() => toggleFavorite(article.article)} hitSlop={8} style={{ padding: 4 }}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? "#ef4444" : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
      {article.titre ? (
        <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 17, color: colors.text, marginBottom: 14 }}>
          {article.titre}
        </Text>
      ) : null}

      <AudioPlayer lines={article.texte} colors={colors} onLineChange={handleLineChange} />

      <ArticleText texte={article.texte} highlightIndex={highlightIndex} onLineLayout={handleLineLayout} />

      {article.mots_cles && article.mots_cles.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
          {article.mots_cles.map((mc, i) => (
            <Text
              key={i}
              style={{
                fontFamily: fonts.regular,
                fontWeight: fontWeights.regular,
                fontSize: 12,
                color: colors.textMuted,
                backgroundColor: colors.border,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {mc}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Texte avec surbrillance ──
function HighlightText({
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
  const nw = words.map(normalize).filter((w) => w.length > 1);
  if (!nw.length) return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;

  const escaped = nw.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const nt = normalize(text);
  const parts: { t: string; h: boolean }[] = [];
  let li = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(nt)) !== null) {
    if (m.index > li) parts.push({ t: text.slice(li, m.index), h: false });
    parts.push({ t: text.slice(m.index, m.index + m[0].length), h: true });
    li = m.index + m[0].length;
  }
  if (li < text.length) parts.push({ t: text.slice(li), h: false });
  if (!parts.length) return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, i) =>
        p.h ? <Text key={i} style={{ backgroundColor: highlightColor, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>{p.t}</Text> : <Text key={i}>{p.t}</Text>
      )}
    </Text>
  );
}

// ── Badge de pertinence ──
function ScoreBadge({ score, colors }: { score: number; colors: ThemeColors }) {
  const label = score >= 100 ? "Exact" : score >= 40 ? "Pertinent" : "Partiel";
  const bg = score >= 100 ? `${colors.success}20` : score >= 40 ? `${colors.primary}15` : `${colors.textMuted}15`;
  const fg = score >= 100 ? colors.success : score >= 40 ? colors.primary : colors.textMuted;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 10, color: fg }}>{label}</Text>
    </View>
  );
}

// ── Résultats de recherche ──
function SearchResultsView({ results, onSelect }: { results: SearchResult[]; onSelect: (art: ArticleData) => void }) {
  const { colors } = useTheme();
  const highlightColor = `${colors.primary}25`;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 15, color: colors.textSecondary }}>
          {results.length} résultat{results.length > 1 ? "s" : ""}
        </Text>
        {results.length > 0 && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted }}>Triés par pertinence</Text>
        )}
      </View>
      {results.slice(0, 50).map(({ art, score, matchedWords }, i) => (
        <Card key={`${art.article}-${i}`} onPress={() => onSelect(art)}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: score >= 100 ? `${colors.primary}20` : `${colors.primary}10`,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <HighlightText
                  text={art.article}
                  words={matchedWords}
                  highlightColor={highlightColor}
                  style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 15, color: colors.primary }}
                />
                <ScoreBadge score={score} colors={colors} />
              </View>
              {art.titre ? (
                <HighlightText
                  text={art.titre}
                  words={matchedWords}
                  highlightColor={highlightColor}
                  numberOfLines={2}
                  style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 14, color: colors.text, marginBottom: 4 }}
                />
              ) : null}
              <HighlightText
                text={art.texte.join(" ")}
                words={matchedWords}
                highlightColor={highlightColor}
                numberOfLines={2}
                style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 14, color: colors.textSecondary, lineHeight: 18 }}
              />
              {art.mots_cles.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {art.mots_cles
                    .filter((mc) => matchedWords.some((w) => normalize(mc).includes(normalize(w))))
                    .slice(0, 3)
                    .map((mc, j) => (
                      <View key={j} style={{ backgroundColor: `${colors.primary}10`, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.primary }}>{mc}</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ── Composant principal ──
export default function MobileCGIBrowser({ sommaire, codeType }: Props & { codeType?: "cgi" | "social" }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Navigation par pile de noeuds
  const [navStack, setNavStack] = useState<SommaireNode[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const searchResults = useMemo(() => searchArticles(debouncedSearch), [debouncedSearch]);

  const currentNode = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const goBack = useCallback(() => {
    setSearch("");
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (navStack.length > 0) {
      setNavStack((prev) => prev.slice(0, -1));
    }
  }, [selectedArticle, navStack]);

  const handleSelectNode = useCallback((node: SommaireNode) => {
    setSelectedArticle(null);
    setSearch("");
    setNavStack((prev) => [...prev, node]);
  }, []);

  const handleSelectArticle = useCallback((art: ArticleData) => {
    setSelectedArticle(art);
    setSearch("");
  }, []);

  const showBack = navStack.length > 0 || selectedArticle !== null;
  const isSearching = search.length >= 2 && debouncedSearch.length >= 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header navigation + recherche */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {showBack && (
            <TouchableOpacity onPress={goBack} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.input, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 16, color: colors.text, fontFamily: fonts.regular }}
              placeholder={t("code.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={(v) => { setSearch(v); setSelectedArticle(null); }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Breadcrumb */}
        {navStack.length > 0 && !isSearching && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8, gap: 4 }}>
            <TouchableOpacity onPress={() => { setNavStack([]); setSelectedArticle(null); }}>
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: colors.primary }}>CGI</Text>
            </TouchableOpacity>
            {navStack.map((node, i) => (
              <View key={node.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="chevron-forward" size={10} color={colors.textMuted} style={{ marginHorizontal: 2 }} />
                <TouchableOpacity onPress={() => { setNavStack((prev) => prev.slice(0, i + 1)); setSelectedArticle(null); }}>
                  <Text
                    style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 13, color: i === navStack.length - 1 ? colors.text : colors.primary }}
                    numberOfLines={1}
                  >
                    {node.label.length > 25 ? node.label.slice(0, 25) + "..." : node.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Contenu */}
      {isSearching ? (
        <SearchResultsView results={searchResults} onSelect={handleSelectArticle} />
      ) : selectedArticle ? (
        <ArticleDetailView article={selectedArticle} onBack={goBack} codeType={codeType} />
      ) : currentNode ? (
        <ChapterReader chapter={currentNode} colors={colors} />
      ) : (
        // Racine : liste des tomes
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Liste des noeuds */}
          {sommaire.map((node, idx) => {
            const artCount = countArticles(node);
            const hasChildren = (node.children && node.children.length > 0) || (node.articles && node.articles.length > 0);
            const ic = NODE_ICONS[idx % NODE_ICONS.length];
            return (
              <Card key={node.id} onPress={() => handleSelectNode(node)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: ic.color + "18", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={ic.icon} size={20} color={ic.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 15, color: colors.text }} numberOfLines={2}>
                      {node.label}
                    </Text>
                    {artCount > 0 && (
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {artCount} article{artCount > 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                  {hasChildren && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
