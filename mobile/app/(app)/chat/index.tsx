// mobile/app/(app)/chat/index.tsx
// Écran Chat IA fiscal — sidebar historique + zone chat

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import {
  sendMessageStream,
  getConversation,
  getConversations,
  deleteConversation,
  type Conversation,
  type Citation,
} from "@/lib/api/chat";
import { Ionicons } from "@expo/vector-icons";
import HistoryPanel from "@/components/chat/HistoryPanel";
import EmptyState from "@/components/chat/EmptyState";
import MessageBubble from "@/components/chat/MessageBubble";
import StreamingBubble from "@/components/chat/StreamingBubble";
import ChatInput from "@/components/chat/ChatInput";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { useOfflineQueue } from "@/lib/store/offlineQueue";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { useToast } from "@/components/ui/ToastProvider";
import { createLogger } from "@/lib/utils/logger";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const log = createLogger("chat");

interface DisplayMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

const HISTORY_WIDTH = 260;

export default function ChatScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { toast, confirm } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pendingCitationsRef = useRef<Citation[]>([]);

  // Historique
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Offline queue
  const isOnline = useOnlineStatus();
  const addToQueue = useOfflineQueue((s) => s.addMessage);

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isNearBottomRef = useRef(true);
  const scrollLayoutRef = useRef({ contentHeight: 0, layoutHeight: 0 });

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !isNearBottomRef.current) return;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottomRef.current = distanceFromBottom < 80;
  }, []);

  // Charger historique à l'ouverture du panneau ou après rafraîchissement
  useEffect(() => {
    if (showHistory) {
      setLoadingHistory(true);
      getConversations()
        .then(setConversations)
        .catch((err) => {
          log.warn("Erreur chargement historique", err);
          setConversations([]);
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [showHistory, historyRefreshKey]);


  // Charger conversation existante
  useEffect(() => {
    if (conversationId && messages.length === 0) {
      getConversation(conversationId)
        .then((conv) => {
          if (conv.messages) {
            setMessages(
              conv.messages
                .filter((m) => m.role !== "SYSTEM")
                .map((m) => ({
                  id: m.id,
                  role: m.role as "USER" | "ASSISTANT",
                  content: m.content,
                  citations: m.citations,
                }))
            );
          }
        })
        .catch((err) => log.warn("Erreur chargement messages", err));
    }
  }, [conversationId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (!isOnline) {
      addToQueue(text, conversationId || undefined);
      setMessages((prev) => [...prev, { id: `queued-${Date.now()}`, role: "USER", content: text, pending: true }]);
      setInput("");
      scrollToBottom();
      return;
    }

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "USER", content: text }]);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    pendingCitationsRef.current = [];
    isNearBottomRef.current = true;
    scrollToBottom(true);

    try {
      await sendMessageStream(text, conversationId || undefined, {
        onConversation: (id) => setConversationId(id),
        onChunk: (chunk) => {
          setStreamingContent((prev) => prev + chunk);
          scrollToBottom();
        },
        onCitations: (citations) => {
          pendingCitationsRef.current = citations;
        },
        onDone: (metadata) => {
          const citations = pendingCitationsRef.current.length > 0
            ? pendingCitationsRef.current : undefined;
          setStreamingContent((prev) => {
            setMessages((msgs) => [...msgs, {
              id: metadata.messageId, role: "ASSISTANT", content: prev, citations,
            }]);
            return "";
          });
          pendingCitationsRef.current = [];
          setIsStreaming(false);
          scrollToBottom();
          // Rafraîchir l'historique pour afficher la nouvelle conversation
          if (showHistory) setHistoryRefreshKey((k) => k + 1);
        },
        onError: (error) => {
          setMessages((prev) => [...prev, {
            id: `error-${Date.now()}`, role: "ASSISTANT", content: `${t("chat.errorPrefix")} ${error}`,
          }]);
          setStreamingContent("");
          setIsStreaming(false);
        },
      });
    } catch {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`, role: "ASSISTANT", content: t("chat.connectionError"),
      }]);
      setStreamingContent("");
      setIsStreaming(false);
    }
  }, [input, isStreaming, conversationId, scrollToBottom, isOnline, addToQueue]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
  }, []);

  const handleLoadConversation = useCallback((id: string) => {
    setMessages([]);
    setConversationId(id);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string, title: string | null) => {
      const ok = await confirm({
        title: t("chat.deleteConversation"),
        message: `${t("chat.deleteConversation")} "${title || t("chat.untitled")}" ?`,
        confirmLabel: t("common.delete"),
        cancelLabel: t("common.cancel"),
        destructive: true,
      });
      if (!ok) return;

      try {
        await deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (id === conversationId) {
          setMessages([]);
          setConversationId(null);
          setStreamingContent("");
        }
        // Forcer le rechargement depuis le serveur
        setHistoryRefreshKey((k) => k + 1);
      } catch {
        toast(t("chat.connectionError"), "error");
        // Recharger depuis le serveur pour resynchroniser
        setHistoryRefreshKey((k) => k + 1);
      }
    },
    [conversationId]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Barre d'outils chat */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity
          onPress={() => setShowHistory((prev) => !prev)}
          accessibilityLabel={t("chat.history")}
          accessibilityRole="button"
          style={{ padding: 6, marginRight: 8 }}
        >
          <Ionicons name={showHistory ? "close" : "time-outline"} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontFamily: fonts.regular, fontWeight: fontWeights.regular, color: colors.textSecondary }}>
          {showHistory ? t("chat.history") : t("chat.emptyStateDesc")}
        </Text>
        {conversationId && (
          <TouchableOpacity
            onPress={handleNewConversation}
            accessibilityLabel={t("chat.newConversation")}
            accessibilityRole="button"
            style={{ padding: 6 }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Sidebar historique — fixe sur desktop, overlay sur mobile */}
        {showHistory && !isMobile && (
          <View
            style={{
              width: HISTORY_WIDTH,
              backgroundColor: colors.headerBg,
              borderRightWidth: 1,
              borderRightColor: colors.border,
            }}
          >
            <HistoryPanel
              conversations={conversations}
              loading={loadingHistory}
              activeConversationId={conversationId}
              onNewConversation={handleNewConversation}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
              onClose={() => setShowHistory(false)}
            />
          </View>
        )}
        {showHistory && isMobile && (
          <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, zIndex: 10 }}>
            <Pressable
              style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
              onPress={() => setShowHistory(false)}
            />
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: HISTORY_WIDTH,
                backgroundColor: colors.headerBg,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                zIndex: 20,
              }}
            >
              <HistoryPanel
                conversations={conversations}
                loading={loadingHistory}
                activeConversationId={conversationId}
                onNewConversation={handleNewConversation}
                onLoadConversation={handleLoadConversation}
                onDeleteConversation={handleDeleteConversation}
                onClose={() => setShowHistory(false)}
              />
            </View>
          </View>
        )}

        {/* Zone chat */}
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onContentSizeChange={() => scrollToBottom()}
          >
            {messages.length === 0 && !isStreaming && (
              <EmptyState recentSearches={[]} onSelectQuery={setInput} />
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} role={msg.role} content={msg.content} citations={msg.citations} pending={msg.pending} />
            ))}
            {isStreaming && <StreamingBubble content={streamingContent} />}
          </ScrollView>

          <ChatInput value={input} onChangeText={setInput} onSend={handleSend} disabled={isStreaming} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
