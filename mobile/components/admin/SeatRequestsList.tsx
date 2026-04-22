import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { AdminSeatRequest } from "@/lib/api/admin";

interface SeatRequestsListProps {
  seatRequests: AdminSeatRequest[];
  actionLoading: string | null;
  rejectNotes: Record<string, string>;
  onRejectNoteChange: (requestId: string, note: string) => void;
  onApprove: (request: AdminSeatRequest) => void;
  onReject: (request: AdminSeatRequest) => void;
  colors: Record<string, string>;
}

export default function SeatRequestsList({
  seatRequests,
  actionLoading,
  rejectNotes,
  onRejectNoteChange,
  onApprove,
  onReject,
  colors,
}: SeatRequestsListProps) {
  const { t } = useTranslation();

  if (seatRequests.length === 0) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        {t("seatRequest.pendingRequests", { count: seatRequests.length })}
      </Text>
      {seatRequests.map((req) => {
        const requesterName = [req.requestedBy.firstName, req.requestedBy.lastName].filter(Boolean).join(" ") || req.requestedBy.email;
        return (
          <View key={req.id} style={{ backgroundColor: colors.card, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.warning }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{req.organization.name}</Text>
              <View style={{ backgroundColor: `${colors.warning}20`, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}>{t("seatRequest.pending")}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 4 }}>
              {t("seatRequest.requestedBy", { name: requesterName })}
            </Text>
            <Text style={{ fontSize: 16, color: colors.text, marginBottom: 4 }}>
              +{req.additionalSeats} {t("admin.seats")} ({req.currentSeats} → {req.totalSeatsAfter})
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginBottom: 8 }}>
              {req.additionalSeats} x {req.unitPrice.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} = {req.totalPrice.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} XAF
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 12 }}>
              Plan {req.plan}
            </Text>
            <TextInput
              value={rejectNotes[req.id] || ""}
              onChangeText={(v) => onRejectNoteChange(req.id, v)}
              placeholder={t("seatRequest.rejectNotePlaceholder")}
              placeholderTextColor={colors.disabled}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
                fontSize: 15,
                color: colors.text,
                backgroundColor: colors.background,
                marginBottom: 12,
              }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => onApprove(req)}
                disabled={actionLoading === req.id}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                  {actionLoading === req.id ? t("common.loading") : t("seatRequest.approve")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onReject(req)}
                disabled={actionLoading === req.id}
                style={{ flex: 1, backgroundColor: colors.danger, paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                  {actionLoading === req.id ? t("common.loading") : t("seatRequest.reject")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}
