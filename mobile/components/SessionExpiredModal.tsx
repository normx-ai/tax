import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/store/auth";
import { useTheme } from "@/lib/theme/ThemeContext";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function SessionExpiredModal() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const logout = useAuthStore((s) => s.logout);
  const login = useAuthStore((s) => s.login);

  const handleReconnect = () => {
    login();
  };

  return (
    <Modal visible={sessionExpired} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Ionicons
            name="time-outline"
            size={48}
            color={colors.warning}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading, fontWeight: fontWeights.heading }]}>
            Session expirée
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary, fontFamily: fonts.regular, fontWeight: fontWeights.regular }]}>
            Votre session a expiré. Reconnectez-vous pour continuer.
          </Text>
          <TouchableOpacity
            onPress={handleReconnect}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }]}>
              Se reconnecter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 9999,
  },
  card: {
    padding: 32,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});
