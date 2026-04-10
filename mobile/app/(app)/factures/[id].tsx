import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { invoiceApi, type Invoice } from "@/lib/api/invoices";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString("fr-FR", { minimumFractionDigits: 0 }).replace(/[\u202F\u00A0]/g, " ")} ${currency}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    invoiceApi.getById(id)
      .then(setInvoice)
      .catch((err) => setError(err instanceof Error ? err.message : t("factures.loadError")))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = () => {
    if (!id) return;
    if (Platform.OS === "web") {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "";
      window.open(`${baseUrl}/invoices/${id}/pdf`, "_blank");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 20 }}>
        <Ionicons name="alert-circle" size={48} color={"#ef4444"} />
        <Text style={{ color: "#ef4444", fontSize: 16, marginTop: 12 }}>{error || t("factures.notFound")}</Text>
      </View>
    );
  }

  const statusColor = invoice.status === "PAID" ? "#16a34a" :
    invoice.status === "CANCELLED" ? "#dc2626" :
    invoice.status === "SENT" ? "#3b82f6" : "#d97706";

  const statusLabel = invoice.status === "PAID" ? t("factures.statusPaid") :
    invoice.status === "CANCELLED" ? t("factures.statusCancelled") :
    invoice.status === "SENT" ? t("factures.statusSent") :
    invoice.status === "DRAFT" ? t("factures.statusDraft") : t("factures.statusGenerated");

  const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 14, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.text, fontWeight: bold ? "800" : "400", textAlign: "right", maxWidth: "60%" }}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: isMobile ? 16 : 32, maxWidth: 700, width: "100%", alignSelf: "center" }}>
      {/* En-tête */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontFamily: fonts.heading, fontWeight: fontWeights.heading, color: colors.text }}>
            {invoice.invoiceNumber}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <View style={{ backgroundColor: statusColor + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: statusColor, fontSize: 12, fontWeight: "700" }}>{statusLabel}</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 10 }}>
              {invoice.type === "AUTOMATIC" ? t("factures.typeAuto") : t("factures.typeManual")}
            </Text>
          </View>
        </View>

        {Platform.OS === "web" && (
          <TouchableOpacity onPress={handleDownloadPdf} style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>{t("factures.downloadPdf")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Client */}
      <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 10, textTransform: "uppercase" }}>{t("factures.client")}</Text>
        <Row label={t("factures.name")} value={invoice.customerName} />
        <Row label={t("factures.email")} value={invoice.customerEmail} />
        {invoice.customerAddress && <Row label={t("factures.address")} value={invoice.customerAddress} />}
        {invoice.customerPhone && <Row label={t("factures.phone")} value={invoice.customerPhone} />}
      </View>

      {/* Détails */}
      <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 10, textTransform: "uppercase" }}>{t("factures.details")}</Text>
        <Row label={t("factures.description")} value={invoice.description} />
        <Row label={t("factures.plan")} value={invoice.plan} />
        {invoice.periodStart && invoice.periodEnd && (
          <Row label={t("factures.period")} value={`${formatDate(invoice.periodStart)} — ${formatDate(invoice.periodEnd)}`} />
        )}
      </View>

      {/* Montants */}
      <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 10, textTransform: "uppercase" }}>{t("factures.amounts")}</Text>
        <Row label={t("factures.amountHT")} value={formatAmount(invoice.amountHT, invoice.currency)} />
        <Row label={`TVA (${invoice.tvaRate}%)`} value={formatAmount(invoice.tvaAmount, invoice.currency)} />
        <Row label={t("factures.amountTTC")} value={formatAmount(invoice.amountTTC, invoice.currency)} bold />
      </View>

      {/* Dates */}
      <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 10, textTransform: "uppercase" }}>{t("factures.dates")}</Text>
        <Row label={t("factures.createdAt")} value={formatDate(invoice.createdAt)} />
        {invoice.paidAt && <Row label={t("factures.paidAt")} value={formatDate(invoice.paidAt)} />}
        {invoice.sentAt && <Row label={t("factures.sentAt")} value={formatDate(invoice.sentAt)} />}
      </View>
    </ScrollView>
  );
}
