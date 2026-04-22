import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { SeatRequest } from "@/lib/api/organization";

interface SeatRequestSectionProps {
  currentSeats: number;
  membersCount: number;
  plan: string;
  seatsToAdd: string;
  seatsLoading: boolean;
  pendingSeatRequest: SeatRequest | null;
  onChangeSeatsToAdd: (value: string) => void;
  onRequestSeats: () => void;
  colors: Record<string, string>;
}

function getUnitPriceLocal(plan: string, totalSeats: number): number {
  const basePrices: Record<string, number> = { ENTERPRISE: 500, TEAM: 299, PROFESSIONAL: 149, STARTER: 69 };
  const basePrice = basePrices[plan] || 299;
  let discount = 0;
  if (totalSeats >= 10) discount = 0.20;
  else if (totalSeats >= 5) discount = 0.15;
  else if (totalSeats >= 3) discount = 0.10;
  return Math.round(basePrice * (1 - discount));
}

function getVolumeDiscountPercent(totalSeats: number): number {
  if (totalSeats >= 10) return 20;
  if (totalSeats >= 5) return 15;
  if (totalSeats >= 3) return 10;
  return 0;
}

export default function SeatRequestSection({
  currentSeats,
  membersCount,
  plan,
  seatsToAdd,
  seatsLoading,
  pendingSeatRequest,
  onChangeSeatsToAdd,
  onRequestSeats,
  colors,
}: SeatRequestSectionProps) {
  const { t } = useTranslation();

  const seatsNum = parseInt(seatsToAdd, 10) || 0;
  const totalSeatsAfter = currentSeats + seatsNum;
  const computedUnitPrice = getUnitPriceLocal(plan, totalSeatsAfter);
  const computedTotalPrice = seatsNum * computedUnitPrice;
  const discountPercent = getVolumeDiscountPercent(totalSeatsAfter);

  return (
    <View style={{ backgroundColor: colors.card, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        {t("seatRequest.title")}
      </Text>

      <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 12 }}>
        {t("seatRequest.currentSeats", { used: membersCount, total: currentSeats })}
      </Text>

      {pendingSeatRequest && pendingSeatRequest.status === "PENDING" ? (
        <View style={{ backgroundColor: `${colors.warning}15`, padding: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.warning }}>
            {t("seatRequest.pendingLabel")}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
            {t("seatRequest.pendingDetail", {
              seats: pendingSeatRequest.additionalSeats,
              price: pendingSeatRequest.totalPrice.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " "),
            })}
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 16, color: colors.text, marginRight: 8 }}>
              {t("seatRequest.seatsToAdd")}
            </Text>
            <TextInput
              value={seatsToAdd}
              onChangeText={onChangeSeatsToAdd}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.disabled}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: 80,
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                backgroundColor: colors.background,
                textAlign: "center",
              }}
            />
          </View>

          {seatsNum > 0 && (
            <View style={{ backgroundColor: `${colors.primary}10`, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                {seatsNum} x {computedUnitPrice.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} = {computedTotalPrice.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ")} XAF
              </Text>
              {discountPercent > 0 && (
                <Text style={{ fontSize: 15, color: colors.primary, marginTop: 4 }}>
                  {t("seatRequest.discountApplied", { percent: discountPercent, total: totalSeatsAfter })}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={onRequestSeats}
            disabled={seatsLoading || seatsNum < 1}
            style={{
              backgroundColor: seatsNum > 0 ? colors.primary : colors.disabled,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>
              {seatsLoading ? t("common.loading") : t("seatRequest.submit")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
