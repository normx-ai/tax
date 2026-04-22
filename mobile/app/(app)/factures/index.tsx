import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { invoiceApi, type Invoice } from "@/lib/api/invoices";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  PAID: { icon: "checkmark-circle", color: "#16a34a", label: "factures.statusPaid" },
  SENT: { icon: "send", color: "#3b82f6", label: "factures.statusSent" },
  GENERATED: { icon: "document-text", color: "#d97706", label: "factures.statusGenerated" },
  DRAFT: { icon: "create", color: "#6b7280", label: "factures.statusDraft" },
  CANCELLED: { icon: "close-circle", color: "#dc2626", label: "factures.statusCancelled" },
};

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString("fr-FR", { minimumFractionDigits: 0 }).replace(/[\u202F\u00A0]/g, " ")} ${currency}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FacturesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoiceApi.list(page, 20);
      setInvoices(result.invoices);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("factures.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (Platform.OS === "web") {
      // Sur web, ouvrir dans un nouvel onglet
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "";
      window.open(`${baseUrl}/invoices/${invoice.id}/pdf`, "_blank");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 20 }}>
        <Ionicons name="alert-circle" size={48} color={"#ef4444"} />
        <Text style={{ color: "#ef4444", fontSize: 16, marginTop: 12, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity onPress={loadInvoices} style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: isMobile ? 16 : 32, maxWidth: 900, width: "100%", alignSelf: "center" }}>
      {/* Titre */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <Ionicons name="receipt-outline" size={24} color={colors.primary} style={{ marginRight: 10 }} />
        <Text style={{ fontSize: 22, fontFamily: fonts.heading, fontWeight: fontWeights.heading, color: colors.text }}>
          {t("factures.title")}
        </Text>
      </View>

      {invoices.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 16, marginTop: 16 }}>{t("factures.empty")}</Text>
        </View>
      ) : (
        <>
          {invoices.map((inv) => {
            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.GENERATED;
            return (
              <TouchableOpacity
                key={inv.id}
                onPress={() => router.push(`/(app)/factures/${inv.id}` as Href)}
                style={{
                  backgroundColor: colors.card,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{inv.invoiceNumber}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{inv.description}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{formatDate(inv.createdAt)}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
                      {formatAmount(inv.amountTTC, inv.currency)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <Ionicons name={statusCfg.icon as keyof typeof Ionicons.glyphMap} size={14} color={statusCfg.color} />
                      <Text style={{ fontSize: 12, color: statusCfg.color, marginLeft: 4, fontWeight: "600" }}>
                        {t(statusCfg.label)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
                  {Platform.OS === "web" && (
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); handleDownloadPdf(inv); }}
                      style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "15", paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Ionicons name="download-outline" size={14} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600", marginLeft: 4 }}>PDF</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16, gap: 16 }}>
              <TouchableOpacity disabled={page <= 1} onPress={() => setPage(page - 1)} style={{ opacity: page <= 1 ? 0.3 : 1 }}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{page} / {totalPages}</Text>
              <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage(page + 1)} style={{ opacity: page >= totalPages ? 0.3 : 1 }}>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
