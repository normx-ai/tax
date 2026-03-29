import { View, Text, TextInput, TouchableOpacity, ScrollView, useWindowDimensions, StyleSheet, Modal, FlatList } from "react-native";
import { useState, useMemo, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { getSommaire, searchArticles, type SommaireNode, type ArticleData, type SearchResult } from "@/lib/data/cgi";
import { getSocialSommaire, searchSocialArticles } from "@/lib/data/social";
import { useHistoryStore } from "@/lib/store/history";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useResponsive } from "@/lib/hooks/useResponsive";
import TreeNode from "@/components/code/TreeNode";
import ContentPanel from "@/components/code/ContentPanel";
import ChapterReader from "@/components/code/ChapterReader";
import MobileCGIBrowser from "@/components/code/MobileCGIBrowser";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import { useActiveCode } from "@/lib/context/ActiveCodeContext";

const styles = StyleSheet.create({
  sommaire: { borderRightWidth: 1 },
  separator: { height: 1, marginHorizontal: 12, marginBottom: 4 },
});

function isDescendant(parent: SommaireNode, childId: string): boolean {
  if (!parent.children) return false;
  for (const child of parent.children) {
    if (child.id === childId) return true;
    if (isDescendant(child, childId)) return true;
  }
  return false;
}

export default function CodeCGI() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile, isTablet } = useResponsive();
  const { activeCode } = useActiveCode();

  const sommaire = useMemo(() => {
    if (activeCode === "social") return getSocialSommaire();
    if (activeCode === "hydrocarbures" || activeCode === "douanier") return [] as SommaireNode[];
    return getSommaire();
  }, [activeCode]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [selectedNode, setSelectedNode] = useState<SommaireNode | null>(null);
  const [selectedArticle, setSelectedArticleRaw] = useState<ArticleData | null>(null);
  const addHistory = useHistoryStore((s) => s.addItem);

  const setSelectedArticle = (article: ArticleData | null) => {
    setSelectedArticleRaw(article);
    if (article) {
      addHistory({
        article: article.article,
        titre: article.titre,
        code: activeCode as "cgi" | "social",
      });
    }
  };
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    // CGI
    tome1: true, "t1-p1": true, "t1-p2": true, "t1-p3": true,
    tome2: true,
    tfnc: true,
    // Code Social
    "social-livre1": true,
    "social-code-travail": true,
    "social-app": true,
    "social-tnc": true,
    "social-oit": true,
    "social-livre2": true,
    "social-css": true,
    "social-tnc-secu": true,
    "social-conv-secu": true,
    "social-livre3": true,
    "social-cc": true,
  });

  const [readerNode, setReaderNode] = useState<SommaireNode | null>(null);
  const readerNodeRef = useRef<SommaireNode | null>(null);
  const [scrollToId, setScrollToId] = useState<string | undefined>();
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const debouncedSearch = useDebounce(search, 300);
  const searchResults = useMemo(
    () => activeCode === "social" ? searchSocialArticles(debouncedSearch) : searchArticles(debouncedSearch),
    [debouncedSearch, activeCode]
  );

  if (isMobile) {
    return <MobileCGIBrowser sommaire={sommaire} />;
  }

  const sommaireWidth = isTablet ? "38%" : "32%";
  const contentWidth = isTablet ? "62%" : "68%";

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (node: SommaireNode) => {
    setSelected(node.id);
    setSelectedNode(node);
    setSelectedArticle(null);

    const hasChildren = node.children && node.children.length > 0;

    if (readerNodeRef.current && readerNodeRef.current.id === node.id) {
      setScrollToId("__top__");
      setScrollTrigger((n) => n + 1);
      return;
    }

    if (readerNodeRef.current && isDescendant(readerNodeRef.current, node.id)) {
      setScrollToId(node.id);
      setScrollTrigger((n) => n + 1);
      return;
    }

    const hasArticles = node.articles && node.articles.length > 0;
    setSearch("");
    setSelectedArticle(null);
    if (hasChildren || hasArticles) {
      readerNodeRef.current = node;
      setReaderNode(node);
      setScrollToId(undefined);
    } else {
      readerNodeRef.current = null;
      setReaderNode(null);
      setScrollToId(undefined);
    }
  };

  const handleSelectChild = (child: SommaireNode, parentId: string) => {
    setExpanded((prev) => ({ ...prev, [parentId]: true, [child.id]: true }));
    handleSelect(child);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSelectedArticle(null);
  };

  const showReader = readerNode && !selectedArticle && search.length < 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Barre de recherche */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.input, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16, color: colors.text, fontFamily: fonts.regular }}
            placeholder={t("code.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Split layout */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Sommaire */}
        <ScrollView
          style={[styles.sommaire, { width: sommaireWidth, backgroundColor: colors.card, borderRightColor: colors.border }]}
          removeClippedSubviews
        >
          <View style={{ paddingVertical: 8 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, fontWeight: fontWeights.bold, color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {activeCode === "cgi" ? "Code des Impôts" : activeCode === "social" ? "Code Social" : activeCode === "hydrocarbures" ? "Code des Hydrocarbures" : "Code Douanier"}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textMuted }}>
                {activeCode === "cgi" ? "CGI 2026 — République du Congo" : activeCode === "social" ? "Travail & Sécurité sociale — Édition 2026" : activeCode === "hydrocarbures" ? "Loi n°2024-28" : "CEMAC"}
              </Text>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            {sommaire.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="construct-outline" size={36} color={colors.textMuted} />
                <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 12, textAlign: "center", paddingHorizontal: 16 }}>
                  Contenu en cours d'intégration
                </Text>
              </View>
            ) : (
              sommaire.map((tome) => (
                <TreeNode
                  key={tome.id}
                  node={tome}
                  level={0}
                  selected={selected}
                  onSelect={handleSelect}
                  expanded={expanded}
                  onToggle={toggleExpand}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Contenu */}
        <View style={{ width: contentWidth }}>
          {showReader ? (
            <ChapterReader
              chapter={readerNode}
              colors={colors}
              scrollToId={scrollToId}
              scrollTrigger={scrollTrigger}
            />
          ) : (
            <ContentPanel
              selectedNode={selectedNode}
              selectedArticle={selectedArticle}
              onSelectArticle={setSelectedArticle}
              onSelectChild={handleSelectChild}
              searchQuery={search}
              searchResults={searchResults}
            />
          )}
        </View>
      </View>
    </View>
  );
}
