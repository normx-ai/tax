import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface Props {
  plan: string;
  status: string;
  actionLoading: boolean;
  onActivate: (planName: string) => void;
  onRenew: () => void;
  onUpgrade: () => void;
  colors: any;
}

export default function SubscriptionActions({
  plan,
  status,
  actionLoading,
  onActivate,
  onRenew,
  onUpgrade,
  colors,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={{ backgroundColor: colors.card, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Ionicons name="settings-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{t("abonnement.management")}</Text>
      </View>

      {actionLoading && (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
      )}

      {(plan === "FREE" || status === "EXPIRED") && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => onActivate("STARTER")}
            disabled={actionLoading}
            style={{ flex: 1, backgroundColor: "#3b82f6", paddingVertical: 12, alignItems: "center", opacity: actionLoading ? 0.6 : 1 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Starter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onActivate("PROFESSIONAL")}
            disabled={actionLoading}
            style={{ flex: 1, backgroundColor: "#0F2A42", paddingVertical: 12, alignItems: "center", opacity: actionLoading ? 0.6 : 1 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Professional</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onActivate("TEAM")}
            disabled={actionLoading}
            style={{ flex: 1, backgroundColor: "#8b5cf6", paddingVertical: 12, alignItems: "center", opacity: actionLoading ? 0.6 : 1 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Team</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "ACTIVE" && (
        <TouchableOpacity
          onPress={onRenew}
          disabled={actionLoading}
          style={{ backgroundColor: "#059669", paddingVertical: 12, alignItems: "center", marginBottom: 10, opacity: actionLoading ? 0.6 : 1 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t("abonnement.renewSubscriptionBtn")}</Text>
        </TouchableOpacity>
      )}

      {(plan === "STARTER" || plan === "PROFESSIONAL") && status === "ACTIVE" && (
        <TouchableOpacity
          onPress={onUpgrade}
          disabled={actionLoading}
          style={{ backgroundColor: "#8b5cf6", paddingVertical: 12, alignItems: "center", opacity: actionLoading ? 0.6 : 1 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t("abonnement.upgradeToPlan")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
