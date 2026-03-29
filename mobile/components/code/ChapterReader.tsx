import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import type { SommaireNode } from "@/lib/data/types";
import type { ArticleData } from "@/lib/data/types";
import ArticleText from "./ArticleText";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from "@/lib/theme/colors";

type Props = {
  chapter: SommaireNode;
  colors: ThemeColors;
  scrollToId?: string;
  scrollTrigger?: number;
};

type SpeechState = "idle" | "playing" | "paused";

// Nettoyer le texte pour la lecture vocale
function cleanForSpeech(text: string): string {
  return text
    .replace(/\bLF\s*\d{4}\b/gi, "")
    .replace(/\bCGI\s*\d{4}\b/gi, "")
    .replace(/^\(\s*[ivxlcdm]+\s*\)\s*/i, "")
    .replace(/^\d+°\s*/, "")
    .replace(/^\d+[\.\)]\s*/, "")
    .replace(/^[a-z]\)\s*/i, "")
    .replace(/^\d+[A-Z]?\.\d+\.\s*/, "")
    .replace(/^\d+-\s*/, "")
    .replace(/^[-•○]\s*/, "")
    .trim();
}

function useSpeech(article: ArticleData) {
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [currentLineIndex, setCurrentLineIndex] = useState<number | undefined>(undefined);
  const stoppedRef = useRef(false);
  const currentNonEmptyIdx = useRef(0);

  const nonEmptyIndices = useMemo(() =>
    article.texte.map((l, i) => (l.length > 0 ? i : -1)).filter((i) => i >= 0),
    [article.texte]
  );

  // Assignation synchrone — toujours à jour, pas de useEffect
  const speakLineRef = useRef<(idx: number) => void>(() => {});
  speakLineRef.current = (idx: number) => {
    if (stoppedRef.current || idx >= nonEmptyIndices.length) {
      setSpeechState("idle");
      setCurrentLineIndex(undefined);
      return;
    }
    const lineIndex = nonEmptyIndices[idx];
    currentNonEmptyIdx.current = idx;
    setCurrentLineIndex(lineIndex);
    const cleaned = cleanForSpeech(article.texte[lineIndex]);
    if (!cleaned) {
      speakLineRef.current(idx + 1);
      return;
    }

    if (Platform.OS === "web") {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = "fr-FR";
      utterance.rate = 0.9;
      utterance.onend = () => speakLineRef.current(idx + 1);
      utterance.onerror = () => { setSpeechState("idle"); setCurrentLineIndex(undefined); };
      window.speechSynthesis?.speak(utterance);
    } else {
      Speech.speak(cleaned, {
        language: "fr-FR",
        rate: 0.9,
        onDone: () => speakLineRef.current(idx + 1),
        onStopped: () => {},
        onError: () => { setSpeechState("idle"); setCurrentLineIndex(undefined); },
      });
    }
  };

  const play = useCallback(() => {
    stoppedRef.current = false;
    setSpeechState("playing");
    speakLineRef.current(0);
  }, []);

  const pause = useCallback(() => {
    if (Platform.OS === "web") {
      window.speechSynthesis?.pause();
    } else {
      stoppedRef.current = true;
      Speech.stop();
    }
    setSpeechState("paused");
  }, []);

  const resume = useCallback(() => {
    if (Platform.OS === "web") {
      window.speechSynthesis?.resume();
      setSpeechState("playing");
    } else {
      stoppedRef.current = false;
      setSpeechState("playing");
      speakLineRef.current(currentNonEmptyIdx.current);
    }
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (Platform.OS === "web") {
      window.speechSynthesis?.cancel();
    } else {
      Speech.stop();
    }
    setSpeechState("idle");
    currentNonEmptyIdx.current = 0;
    setCurrentLineIndex(undefined);
  }, []);

  useEffect(() => {
    return () => { stoppedRef.current = true; Speech.stop(); };
  }, [article]);

  return { speechState, currentLineIndex, play, pause, resume, stop };
}

function ArticleBlock({ article, colors, scrollRef }: { article: ArticleData; colors: ThemeColors; scrollRef?: React.RefObject<ScrollView | null> }) {
  const { speechState, currentLineIndex, play, pause, resume, stop } = useSpeech(article);
  const linePositions = useRef<Record<number, number>>({});
  const blockY = useRef(0);

  const handleLineLayout = useCallback((index: number, y: number) => {
    linePositions.current[index] = y;
  }, []);

  // Défilement auto vers la ligne courante
  useEffect(() => {
    if (currentLineIndex !== undefined && linePositions.current[currentLineIndex] !== undefined && scrollRef?.current) {
      scrollRef.current.scrollTo({
        y: blockY.current + linePositions.current[currentLineIndex],
        animated: true,
      });
    }
  }, [currentLineIndex, scrollRef]);

  return (
    <View
      style={{ marginBottom: 20 }}
      onLayout={(e) => { blockY.current = e.nativeEvent.layout.y; }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 17, color: article.article ? colors.text : colors.primary, flex: 1 }}>
          {article.article ? `${article.article} — ${article.titre}` : article.titre}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 }}>
          {/* Play / Pause */}
          <TouchableOpacity
            onPress={speechState === "playing" ? pause : speechState === "paused" ? resume : play}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: colors.accent,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={speechState === "playing" ? "pause" : "volume-high"}
              size={12}
              color={colors.sidebarText}
            />
          </TouchableOpacity>
          {/* Stop */}
          {speechState !== "idle" && (
            <TouchableOpacity
              onPress={stop}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: colors.danger,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="stop" size={12} color={colors.sidebarText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ArticleText texte={article.texte} highlightIndex={currentLineIndex} onLineLayout={handleLineLayout} />
      {article.mots_cles && article.mots_cles.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 }}>
          {article.mots_cles.map((mc: string, i: number) => (
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
      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16, opacity: 0.5 }} />

      {/* Bouton audio fixe en bas à droite quand lecture active */}
      {speechState !== "idle" && Platform.OS === "web" && (
        <View
          // @ts-ignore
          dataSet={{ class: "audio-controls-fixed" }}
          style={{ bottom: 20, left: 20, flexDirection: "row", gap: 8, zIndex: 999,
            ...(Platform.OS === "web" ? { position: "fixed" } : { position: "absolute" }) as Record<string, string>
          }}>
          <TouchableOpacity
            onPress={stop}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
          >
            <Ionicons name="stop" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={speechState === "playing" ? pause : resume}
            style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 28, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
          >
            <Ionicons name={speechState === "playing" ? "pause" : "play"} size={18} color={colors.sidebarText} />
            <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, color: colors.sidebarText, fontSize: 14, marginLeft: 6 }}>
              {speechState === "playing" ? "Pause" : "Reprendre"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type PositionEntry = { y: number; parentId?: string };

function getAbsoluteY(positions: Record<string, PositionEntry>, id: string): number | undefined {
  let y = 0;
  let current: string | undefined = id;
  while (current) {
    const entry: PositionEntry | undefined = positions[current];
    if (!entry) return undefined;
    y += entry.y;
    current = entry.parentId;
  }
  return y;
}

type NodeBlockProps = {
  node: SommaireNode;
  colors: ThemeColors;
  positions: React.MutableRefObject<Record<string, PositionEntry>>;
  parentId?: string;
  depth: number;
  scrollRef?: React.RefObject<ScrollView | null>;
};

function NodeBlock({ node, colors, positions, parentId, depth, scrollRef }: NodeBlockProps) {
  const isSection = depth === 0;
  const isSub = depth === 1;

  return (
    <View
      style={isSection ? { marginBottom: 24 } : isSub ? { marginTop: 8, marginBottom: 16 } : { marginTop: 4 }}
      onLayout={(e) => {
        positions.current[node.id] = { y: e.nativeEvent.layout.y, ...(parentId ? { parentId } : {}) };
      }}
    >
      {/* Titre */}
      {isSection ? (
        <View style={{ marginBottom: 12 }}>
          <View style={{ height: 2, backgroundColor: colors.accent, marginBottom: 10, opacity: 0.4 }} />
          <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 19, color: colors.accent }}>
            {node.label}
          </Text>
        </View>
      ) : isSub ? (
        <Text style={{ fontFamily: fonts.bold, fontWeight: fontWeights.bold, fontSize: 18, color: colors.primary, marginBottom: 10 }}>
          {node.label}
        </Text>
      ) : (
        <Text style={{ fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold, fontSize: 17, color: "#D4A017", marginBottom: 8 }}>
          {node.label}
        </Text>
      )}

      {/* Articles de ce nœud */}
      {node.articles && node.articles.length > 0 && node.articles.map((art) => (
        <ArticleBlock key={art.article} article={art} colors={colors} scrollRef={scrollRef} />
      ))}

      {/* Enfants (récursif) */}
      {node.children && node.children.length > 0 && node.children.map((child) => (
        <NodeBlock
          key={child.id}
          node={child}
          colors={colors}
          positions={positions}
          parentId={node.id}
          depth={depth + 1}
          scrollRef={scrollRef}
        />
      ))}
    </View>
  );
}

export default function ChapterReader({ chapter, colors, scrollToId, scrollTrigger }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const nodePositions = useRef<Record<string, PositionEntry>>({});

  useEffect(() => {
    // Réinitialiser les positions quand le chapitre change
    nodePositions.current = {};
  }, [chapter]);

  useEffect(() => {
    if (!scrollToId || !scrollTrigger) return;

    const timer = setTimeout(() => {
      const sv = scrollRef.current;
      if (!sv) return;

      if (scrollToId === "__top__") {
        sv.scrollTo({ y: 0, animated: true });
        return;
      }

      const y = getAbsoluteY(nodePositions.current, scrollToId);
      if (y !== undefined) {
        sv.scrollTo({ y, animated: true });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [scrollToId, scrollTrigger]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      scrollEventThrottle={16}
    >
      {/* Titre du chapitre */}
      <Text style={{ fontFamily: fonts.heading, fontWeight: fontWeights.heading, fontSize: 24, color: colors.text, marginBottom: 20 }}>
        {chapter.label}
      </Text>

      {/* Articles directement dans le chapitre */}
      {chapter.articles && chapter.articles.length > 0 && chapter.articles.map((art) => (
        <ArticleBlock key={art.article} article={art} colors={colors} scrollRef={scrollRef} />
      ))}

      {/* Sections du chapitre (rendu récursif) */}
      {chapter.children && chapter.children.length > 0 && chapter.children.map((section) => (
        <NodeBlock
          key={section.id}
          node={section}
          colors={colors}
          positions={nodePositions}
          depth={0}
          scrollRef={scrollRef}
        />
      ))}
    </ScrollView>
  );
}
