import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { SommaireNode, ArticleData, SearchResult } from "@/lib/data/cgi";
import ArticleDetail from "./ArticleDetail";
import SearchResults from "./SearchResults";

type Props = {
  selectedNode: SommaireNode | null;
  selectedArticle: ArticleData | null;
  onSelectArticle: (article: ArticleData | null) => void;
  onSelectChild: (child: SommaireNode, parentId: string) => void;
  searchQuery: string;
  codeType?: "cgi" | "social";
  searchResults: SearchResult[];
};

export default function ContentPanel({
  selectedNode,
  selectedArticle,
  onSelectArticle,
  onSelectChild,
  searchQuery,
  codeType,
  searchResults,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (selectedArticle) {
    return (
      <ArticleDetail
        article={selectedArticle}
        onBack={() => onSelectArticle(null)}
        onSelectArticle={onSelectArticle}
        codeType={codeType}
      />
    );
  }

  if (searchQuery.length >= 2) {
    return (
      <SearchResults
        query={searchQuery}
        results={searchResults}
        onSelectArticle={onSelectArticle}
      />
    );
  }

  if (!selectedNode) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Ionicons name="book-outline" size={64} color={colors.textMuted} />
        <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, fontSize: 22, color: colors.textMuted, marginTop: 16, textAlign: "center" }}>
          {t("code.selectInSommaire")}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 16, color: colors.textMuted, marginTop: 8, textAlign: "center" }}>
          {t("code.navigateTree")}
        </Text>
      </View>
    );
  }

  const hasArticles = selectedNode.articles && selectedNode.articles.length > 0;
  const hasChildren = selectedNode.children && selectedNode.children.length > 0;

  return (
    <ScrollView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16, color: colors.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {hasArticles
          ? `${selectedNode.articles!.length} article${selectedNode.articles!.length > 1 ? "s" : ""}`
          : "Section"}
      </Text>
      <Text style={{ fontFamily: fonts.heading, fontWeight: fontWeights.heading, fontSize: 26, color: colors.text, marginBottom: 24 }}>{selectedNode.label}</Text>

      {hasArticles &&
        selectedNode.articles!.map((art) => (
          <TouchableOpacity
            key={art.article}
            style={{
              backgroundColor: colors.card,
              padding: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => onSelectArticle(art)}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 20, color: colors.text }}>{art.article}</Text>
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                {art.titre}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

      {hasChildren && (
        <View style={hasArticles ? { marginTop: 16 } : {}}>
          {!hasArticles && (
            <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 16, color: colors.textMuted, marginBottom: 16 }}>
              {t("code.selectSubSection")}
            </Text>
          )}
          {selectedNode.children!.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={{
                backgroundColor: colors.card,
                padding: 16,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => onSelectChild(child, selectedNode.id)}
            >
              <Ionicons name="folder-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 17, color: colors.text, flex: 1 }}>{child.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
