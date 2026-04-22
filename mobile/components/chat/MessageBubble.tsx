// mobile/components/chat/MessageBubble.tsx
// Bulle de message chat (USER ou ASSISTANT) avec citations optionnelles

import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Citation } from "@/lib/api/chat";
import CitationsBlock from "./CitationsBlock";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Props = {
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: Citation[];
  pending?: boolean;
};

export default function MessageBubble({ role, content, citations, pending }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        alignSelf: role === "USER" ? "flex-end" : "flex-start",
        maxWidth: "85%",
        gap: 8,
        opacity: pending ? 0.6 : 1,
      }}
    >
      {/* Icône IA à gauche */}
      {role === "ASSISTANT" && (
        <View
          style={{
            width: 30,
            height: 30,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
          }}
        >
          <Ionicons name="sparkles" size={16} color={colors.userBubbleText} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: role === "USER" ? colors.userBubble : colors.assistantBubble,
            paddingHorizontal: 14,
            paddingVertical: 10,
            ...(role === "USER"
              ? { borderBottomRightRadius: 4 }
              : { borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border }),
          }}
        >
          <Text
            style={{
              color: role === "USER" ? colors.userBubbleText : colors.assistantBubbleText,
              fontSize: 16,
              fontFamily: fonts.regular,
              fontWeight: fontWeights.regular,
              lineHeight: 22,
              textAlign: role === "ASSISTANT" ? "justify" : "left",
            }}
            selectable
          >
            {content}
          </Text>
        </View>
        {/* Sources retirées - les références sont intégrées dans la réponse */}
        {pending && (
          <Ionicons name="time-outline" size={12} color={colors.textMuted} style={{ marginTop: 4 }} />
        )}
      </View>
      {/* Icône utilisateur à droite */}
      {role === "USER" && (
        <View
          style={{
            width: 30,
            height: 30,
            backgroundColor: colors.headerBg,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
          }}
        >
          <Ionicons name="person" size={16} color={colors.sidebarText} />
        </View>
      )}
    </View>
  );
}
