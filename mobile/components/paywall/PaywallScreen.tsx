import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/store/auth";
import { useToast } from "@/components/ui/ToastProvider";
import { api } from "@/lib/api/client";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PLANS = [
  { key: "free", questions: "5 total", audits: "3 total", price: "0", simulators: "16 (7j)" },
  { key: "starter", questions: "15/mois", audits: "10/mois", price: "69€/an", simulators: "5" },
  { key: "professional", questions: "30/mois", audits: "30/mois", price: "149€/an", simulators: "16" },
  { key: "team", questions: "200/mois", audits: "100/mois", price: "299€/an", simulators: "16" },
  { key: "enterprise", questions: "Sur devis", audits: "Sur devis", price: "500€+/an", simulators: "16" },
];

const PACKS_QUESTIONS = [
  { name: "Pack S", count: 10, price: "9€" },
  { name: "Pack M", count: 30, price: "19€" },
  { name: "Pack L", count: 75, price: "39€" },
  { name: "Pack XL", count: 150, price: "69€" },
];

const PACKS_AUDIT = [
  { name: "Pack S", count: 10, price: "9€" },
  { name: "Pack M", count: 30, price: "19€" },
  { name: "Pack L", count: 75, price: "39€" },
  { name: "Pack XL", count: 150, price: "69€" },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const { toast } = useToast();

  const [subject, setSubject] = useState("Souscription CGI242");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast(t("paywall.formRequired"), "error");
      return;
    }
    setSending(true);
    try {
      await api.post("/auth/contact", { subject: subject.trim(), message: message.trim() });
      setSent(true);
      toast(t("paywall.messageSent"), "success");
      setMessage("");
    } catch {
      toast(t("paywall.messageError"), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name="lock-closed" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.heading, fontWeight: fontWeights.heading }]}>
          {t("paywall.title")}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("paywall.subtitle")}
        </Text>

        {/* Tableau des plans */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("paywall.subscriptions")}
        </Text>
        <View style={[styles.table, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cellHeader, { flex: 1.2, color: colors.textSecondary }]}>{t("paywall.plan")}</Text>
            <Text style={[styles.cellHeader, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.price")}</Text>
            <Text style={[styles.cellHeader, { flex: 0.8, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.questions")}</Text>
            <Text style={[styles.cellHeader, { flex: 0.8, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.audits")}</Text>
          </View>
          {PLANS.map((plan, i) => (
            <View
              key={plan.key}
              style={[styles.tableRow, i < PLANS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.cellText, { flex: 1.2, color: colors.text, fontWeight: "700" }]}>
                {t(`paywall.${plan.key}`)}
              </Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center", color: colors.primary, fontWeight: "700" }]}>
                {plan.price}
              </Text>
              <Text style={[styles.cellText, { flex: 0.8, textAlign: "center", color: colors.text }]}>
                {plan.questions}
              </Text>
              <Text style={[styles.cellText, { flex: 0.8, textAlign: "center", color: colors.text }]}>
                {plan.audits}
              </Text>
            </View>
          ))}
        </View>

        {/* Remises volume */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
          {t("paywall.volumeDiscounts")}
        </Text>
        <View style={[styles.table, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cellHeader, { flex: 1, color: colors.textSecondary }]}>{t("paywall.users")}</Text>
            <Text style={[styles.cellHeader, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.discount")}</Text>
          </View>
          {[{ users: "3-4", discount: "-10%" }, { users: "5-9", discount: "-15%" }, { users: "10+", discount: "-20%" }].map((row, i, arr) => (
            <View key={row.users} style={[styles.tableRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.cellText, { flex: 1, color: colors.text }]}>{row.users} {t("paywall.users").toLowerCase()}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center", color: colors.primary, fontWeight: "700" }]}>{row.discount}</Text>
            </View>
          ))}
        </View>

        {/* Packs questions */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
          {t("paywall.questionPacks")}
        </Text>
        <View style={[styles.table, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cellHeader, { flex: 1, color: colors.textSecondary }]}>Pack</Text>
            <Text style={[styles.cellHeader, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.questions")}</Text>
            <Text style={[styles.cellHeader, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.price")}</Text>
          </View>
          {PACKS_QUESTIONS.map((pack, i) => (
            <View key={pack.name} style={[styles.tableRow, i < PACKS_QUESTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.cellText, { flex: 1, color: colors.text, fontWeight: "700" }]}>{pack.name}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center", color: colors.text }]}>{pack.count}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center", color: colors.text }]}>{pack.price}</Text>
            </View>
          ))}
        </View>

        {/* Packs audit */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
          {t("paywall.auditPacks")}
        </Text>
        <View style={[styles.table, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cellHeader, { flex: 1, color: colors.textSecondary }]}>Pack</Text>
            <Text style={[styles.cellHeader, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.documents")}</Text>
            <Text style={[styles.cellHeader, { flex: 1, textAlign: "center", color: colors.textSecondary }]}>{t("paywall.price")}</Text>
          </View>
          {PACKS_AUDIT.map((pack, i) => (
            <View key={pack.name + "-audit"} style={[styles.tableRow, i < PACKS_AUDIT.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.cellText, { flex: 1, color: colors.text, fontWeight: "700" }]}>{pack.name}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center", color: colors.text }]}>{pack.count}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center", color: colors.text }]}>{pack.price}</Text>
            </View>
          ))}
        </View>

        {/* Description paiement */}
        <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>
          {t("paywall.contactDesc")}
        </Text>

        {/* Formulaire de contact */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }]}>
            {t("paywall.formTitle")}
          </Text>

          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t("paywall.formSubject")}</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border, fontFamily: fonts.regular }]}
            value={subject}
            onChangeText={setSubject}
            placeholder={t("paywall.formSubjectPlaceholder")}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t("paywall.formMessage")}</Text>
          <TextInput
            style={[styles.formInput, styles.formTextarea, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border, fontFamily: fonts.regular }]}
            value={message}
            onChangeText={setMessage}
            placeholder={t("paywall.formMessagePlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.formButton, { backgroundColor: sent ? "#059669" : colors.primary, opacity: sending ? 0.6 : 1 }]}
            onPress={handleSend}
            disabled={sending || sent}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name={sent ? "checkmark-circle" : "send"} size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={[styles.formButtonText, { fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }]}>
                  {sent ? t("paywall.messageSent") : t("paywall.formSend")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.logoutText, { color: colors.textSecondary }]}>
            {t("paywall.logout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24, paddingVertical: 40 },
  iconCircle: { width: 96, height: 96, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 17, textAlign: "center", lineHeight: 22, marginBottom: 28, maxWidth: 400 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, alignSelf: "flex-start", maxWidth: 560, width: "100%" },
  table: { width: "100%", maxWidth: 560, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  tableRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" },
  tableHeader: { borderBottomWidth: 1 },
  cellHeader: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cellText: { fontSize: 14 },
  contactDesc: { fontSize: 15, textAlign: "center", lineHeight: 20, marginTop: 20, marginBottom: 20, maxWidth: 400 },
  formCard: { width: "100%", maxWidth: 560, borderWidth: 1, padding: 20, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  formLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  formInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 14 },
  formTextarea: { minHeight: 100 },
  formButton: { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  formButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutButton: { flexDirection: "row", alignItems: "center", paddingVertical: 10, marginTop: 10 },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
