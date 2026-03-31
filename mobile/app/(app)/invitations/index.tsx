import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { organizationApi } from "@/lib/api/organization";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function InvitationsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await organizationApi.acceptInvitation(token.trim());
      setSuccess(result.message || "Invitation acceptée avec succès");
      setToken("");
      // Rediriger vers l'organisation après acceptation
      setTimeout(() => router.replace("/(app)/organisation"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("invitations.acceptError");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* En-tête */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={{ width: 64, height: 64, backgroundColor: `${colors.primary}20`, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name="mail-open-outline" size={32} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 22, fontFamily: fonts.heading, fontWeight: fontWeights.heading, color: colors.text, textAlign: "center" }}>
            {t("invitations.accept")}
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center", marginTop: 4 }}>
            {t("invitations.description")}
          </Text>
        </View>

        {/* Messages */}
        {error && (
          <View style={{ backgroundColor: `${colors.danger}15`, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={{ backgroundColor: `${colors.success}15`, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.success, fontSize: 16 }}>{success}</Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
            {t("invitations.tokenLabel")}
          </Text>
          <TextInput
            value={token}
            onChangeText={(v) => { setToken(v); setError(null); setSuccess(null); }}
            placeholder={t("invitations.tokenPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.background,
              
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 17,
              color: colors.text,
              marginBottom: 16,
            }}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={handleAccept}
            disabled={loading || !token.trim()}
            style={{
              backgroundColor: !token.trim() ? colors.textMuted : colors.primary,
              
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>{t("invitations.acceptButton")}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
