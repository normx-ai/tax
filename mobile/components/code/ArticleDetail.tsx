// mobile/components/code/ArticleDetail.tsx
// Vue détaillée d'un article CGI avec synthèse vocale et références croisées

import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useHistoryStore } from "@/lib/store/history";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ArticleData } from "@/lib/data/cgi";
import ArticleText from "./ArticleText";
import ReferencesBlock from "./ReferencesBlock";
import { getArticleReferences, type ArticleReference } from "@/lib/api/chat";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("article");

type Props = {
  article: ArticleData;
  onBack: () => void;
  onSelectArticle?: (article: ArticleData) => void;
  codeType?: "cgi" | "social";
};

const SPEECH_MAX_CHUNK = 3_000;

export default function ArticleDetail({ article, onBack, onSelectArticle, codeType }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const favoriteIds = useFavoritesStore((s) => s.articleIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = favoriteIds.includes(article.article);
  const addHistory = useHistoryStore((s) => s.addItem);

  // Enregistrer dans l'historique au montage
  useEffect(() => {
    addHistory({
      article: article.article,
      titre: article.titre,
      code: codeType || "cgi",
    });
  }, [article.article]);
  const [speechState, setSpeechState] = useState<"idle" | "playing" | "paused">("idle");
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(undefined);
  const stoppedRef = useRef(false);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const lineIndexRef = useRef(0);
  const [references, setReferences] = useState<ArticleReference[]>([]);
  const [referencedBy, setReferencedBy] = useState<ArticleReference[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Injecter CSS pour position fixed sur web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = "audio-controls-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `[data-class="audio-controls-fixed"] { position: fixed !important; }`;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (Platform.OS === "web") {
        window.speechSynthesis?.cancel();
      } else {
        Speech.stop();
      }
      setSpeechState("idle");
      setCurrentLineIndex(undefined);
      chunkIndexRef.current = 0;
      lineIndexRef.current = 0;
    };
  }, [article]);

  // Charger les références croisées
  useEffect(() => {
    const numero = article.article.replace(/^Art\.\s*/, "").trim();
    setLoadingRefs(true);
    setReferences([]);
    setReferencedBy([]);
    getArticleReferences(numero)
      .then((data) => {
        setReferences(data.references);
        setReferencedBy(data.referencedBy);
      })
      .catch((err) => log.warn("Erreur chargement références", err))
      .finally(() => setLoadingRefs(false));
  }, [article]);

  const prepareForSpeech = (text: string): string => {
    let result = text;
    // Supprimer les blocs [NB - Loi de finances pour XXXX ...]
    result = result.replace(/\[NB[^\]]*\]/g, "");
    // Supprimer (L.F.2026), (L.F.R.2022), (L.F.2024, L.F.2025), (L.F. 2026 - nouveau), etc.
    result = result.replace(/\((?:L\.F\.(?:R\.?)?\s*\d{4}(?:\s*-\s*[^)]*)?(?:,\s*)?)+\)/g, "");
    // Supprimer L.F.2026, L.F.R.2022 isolés (hors parenthèses)
    result = result.replace(/L\.F\.(?:R\.?)?\s*\d{4}/g, "");
    // Supprimer LF 2026 (format mots-clés)
    result = result.replace(/\bLF\s+\d{4}\b/gi, "");
    // Épeler les acronymes (CGI, TVA, etc.)
    result = result.replace(/\b([A-Z]{2,6})\b/g, (match) => match.split("").join(". ") + ".");
    // Supprimer les renvois numérotés (1), (2)...
    result = result.replace(/\((\d+)\)/g, "");
    // Supprimer le symbole degré
    result = result.replace(/(\d+)°/g, "$1");
    return result;
  };

  const getChunks = (): string[] => {
    const letterNames: Record<string, string> = {
      A: "a", B: "bé", C: "cé", D: "dé", E: "e", F: "effe",
    };
    const articleName = article.article
      .replace(/Art\.\s*(\d+)\s*([A-Z])(?!\w)/g, (_, num, letter) =>
        `Article ${num} ${letterNames[letter] || letter}`)
      .replace(/Art\.\s*(\d+)(er)?/g, "Article $1$2");

    const lines = [
      articleName,
      prepareForSpeech(article.titre),
      ...article.texte.filter((t) => t.length > 0).map(prepareForSpeech),
    ];

    const chunks: string[] = [];
    let current = "";

    for (const line of lines) {
      if (current.length + line.length + 5 > SPEECH_MAX_CHUNK) {
        if (current) chunks.push(current);
        current = line;
      } else {
        current = current ? `${current} ... ${line}` : line;
      }
    }
    if (current) chunks.push(current);

    return chunks;
  };

  const speakChunk = (chunks: string[], index: number) => {
    if (stoppedRef.current || index >= chunks.length) {
      // Ne reset que si on est vraiment arrêté (pas en pause)
      if (index >= chunks.length) {
        setSpeechState("idle");
        chunkIndexRef.current = 0;
      }
      return;
    }

    chunkIndexRef.current = index;
    Speech.speak(chunks[index], {
      language: "fr-FR",
      rate: 0.9,
      onDone: () => {
        // Passer au chunk suivant seulement si pas stoppé (pause)
        if (!stoppedRef.current) {
          chunkIndexRef.current = index + 1;
          speakChunk(chunks, index + 1);
        }
      },
      onStopped: () => {
        // En pause : on garde l'index courant pour reprendre
        // Ne rien faire ici, l'état est géré dans handlePlay
      },
      onError: () => { setSpeechState("idle"); chunkIndexRef.current = 0; },
    });
  };

  const speakLineByLine = (idx: number) => {
    const nonEmpty = article.texte.map((l, i) => ({ l, i })).filter(({ l }) => l.length > 0);
    if (stoppedRef.current || idx >= nonEmpty.length) {
      setSpeechState("idle");
      setCurrentLineIndex(undefined);
      lineIndexRef.current = 0;
      return;
    }
    const { l: line, i: lineIdx } = nonEmpty[idx];
    lineIndexRef.current = idx;
    setCurrentLineIndex(lineIdx);
    const cleaned = prepareForSpeech(line);
    if (!cleaned) { speakLineByLine(idx + 1); return; }

    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.onend = () => speakLineByLine(idx + 1);
    utterance.onerror = () => { setSpeechState("idle"); setCurrentLineIndex(undefined); };
    window.speechSynthesis?.speak(utterance);
  };

  const handlePlay = async () => {
    if (speechState === "playing") {
      if (Platform.OS === "web") {
        window.speechSynthesis?.pause();
      } else {
        stoppedRef.current = true;
        await Speech.stop();
      }
      setSpeechState("paused");
      return;
    }

    if (speechState === "paused") {
      if (Platform.OS === "web") {
        window.speechSynthesis?.resume();
        setSpeechState("playing");
      } else {
        stoppedRef.current = false;
        setSpeechState("playing");
        speakChunk(chunksRef.current, chunkIndexRef.current);
      }
      return;
    }

    // Démarrer
    stoppedRef.current = false;

    if (Platform.OS === "web") {
      setSpeechState("playing");
      speakLineByLine(0);
    } else {
      chunkIndexRef.current = 0;
      chunksRef.current = getChunks();
      setSpeechState("playing");
      speakChunk(chunksRef.current, 0);
    }
  };

  const handleStop = async () => {
    stoppedRef.current = true;
    if (Platform.OS === "web") {
      window.speechSynthesis?.cancel();
    } else {
      await Speech.stop();
    }
    setSpeechState("idle");
    setCurrentLineIndex(undefined);
    chunkIndexRef.current = 0;
    lineIndexRef.current = 0;
  };

  const handleBack = () => {
    stoppedRef.current = true;
    Speech.stop();
    if (Platform.OS === "web") {
      window.speechSynthesis?.cancel();
    }
    onBack();
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1, padding: 24, paddingBottom: 80 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={handleBack} style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={{ fontFamily: fonts.medium, fontWeight: fontWeights.medium, color: colors.primary, fontSize: 17, marginLeft: 8 }}>{t("articleDetail.backToArticles")}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 16, color: colors.primary }}>{article.statut}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <Text style={{ fontFamily: fonts.heading, fontWeight: fontWeights.heading, fontSize: 30, color: colors.text, flex: 1 }}>{article.article}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(article.article)} style={{ padding: 6 }}>
          <Ionicons name={isFavorite ? "star" : "star-outline"} size={24} color={isFavorite ? "#D4A843" : colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 19, color: colors.textMuted, fontStyle: "italic", marginBottom: 24 }}>{article.titre}</Text>

      <View
        style={{
          backgroundColor: colors.card,
          padding: 20,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <ArticleText texte={article.texte} highlightIndex={currentLineIndex} />
      </View>

      {article.mots_cles.length > 0 && (
        <View>
          <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 14, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase" }}>{t("articleDetail.keywords")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {article.mots_cles.map((mc) => (
              <View key={mc} style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginBottom: 8 }}>
                <Text style={{ fontFamily: fonts.regular, fontWeight: fontWeights.regular, fontSize: 14, color: colors.primary }}>{mc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <ReferencesBlock
        references={references}
        referencedBy={referencedBy}
        loading={loadingRefs}
        onSelectArticle={onSelectArticle}
      />
    </ScrollView>
    </View>
  );
}
