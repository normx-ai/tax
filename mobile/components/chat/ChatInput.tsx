// mobile/components/chat/ChatInput.tsx
// Barre de saisie du chat avec bouton d'envoi

import { useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChangeText, onSend, disabled }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isListening, transcript, startListening, stopListening, isAvailable } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onChangeText(transcript);
    }
  }, [transcript, onChangeText]);

  // Sur web : Entrée envoie, Shift+Entrée fait un retour à la ligne
  const handleKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS === "web") {
      const nativeEvent = e.nativeEvent as TextInputKeyPressEventData & { key: string; shiftKey?: boolean };
      if (nativeEvent.key === "Enter" && !nativeEvent.shiftKey) {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSend();
        }
      }
    }
  }, [disabled, value, onSend]);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          backgroundColor: colors.input,
          paddingHorizontal: 14,
          paddingVertical: 6,
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            fontFamily: fonts.regular,
            color: colors.text,
            maxHeight: 100,
            paddingVertical: 6,
          }}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/\s{10,}/g, "  "))}
          multiline
          maxLength={4000}
          editable={!disabled}
          onSubmitEditing={onSend}
          blurOnSubmit={false}
          submitBehavior="submit"
          onKeyPress={handleKeyPress}
        />
        {isAvailable && (
          <TouchableOpacity
            onPress={isListening ? stopListening : startListening}
            disabled={disabled}
            style={{
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel={isListening ? t("chat.stopListening") : t("chat.voiceSearch")}
          >
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={20}
              color={isListening ? colors.danger : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onSend}
          disabled={disabled || !value.trim()}
          style={{
            backgroundColor: disabled || !value.trim() ? colors.disabled : colors.primary,
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel={t("chat.send")}
        >
          <Ionicons name="send" size={16} color={colors.sidebarText} />
        </TouchableOpacity>
      </View>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: 12,
          fontFamily: fonts.regular,
          fontWeight: fontWeights.regular,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        {t("chat.disclaimer")}
      </Text>
    </View>
  );
}
