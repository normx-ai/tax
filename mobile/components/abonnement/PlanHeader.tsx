import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6b7280",
  STARTER: "#3b82f6",
  PRO: "#D4A843",
};

const PLAN_BG: Record<string, string> = {
  FREE: "#f3f4f6",
  STARTER: "#eff6ff",
  PRO: "#faf8f5",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#059669",
  TRIALING: "#d97706",
  EXPIRED: "#dc2626",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  ACTIVE: "abonnement.statusActive",
  TRIALING: "abonnement.statusTrialing",
  EXPIRED: "abonnement.statusExpired",
};

const PLANS_INFO = [
  {
    name: "FREE",
    label: "Découverte",
    price: "Gratuit",
    priceDetail: "7 jours d'essai - 10 crédits",
    features: ["10 crédits au total", "Code CGI et social en lecture", "3 simulateurs de base"],
  },
  {
    name: "STARTER",
    label: "Starter",
    price: "150 EUR / an",
    priceDetail: "60 crédits/mois - Tous les simulateurs",
    features: ["60 crédits/mois", "Code CGI et social complet", "16 simulateurs", "15 audits documents/mois", "Calendrier fiscal"],
  },
  {
    name: "PRO",
    label: "Pro",
    price: "300 EUR / an",
    priceDetail: "250 crédits/mois - Support prioritaire",
    features: ["250 crédits/mois", "Tout le Starter +", "50 audits documents/mois", "Support prioritaire"],
  },
];

export { PLAN_COLORS, PLAN_BG, STATUS_COLORS, STATUS_LABEL_KEYS, PLANS_INFO };

interface Props {
  plan: string;
  status: string;
  colors: any;
}

export default function PlanHeader({ plan, status, colors }: Props) {
  const { t } = useTranslation();
  const planColor = PLAN_COLORS[plan] || PLAN_COLORS.FREE;
  const planBg = PLAN_BG[plan] || PLAN_BG.FREE;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.EXPIRED;
  const statusLabelKey = STATUS_LABEL_KEYS[status];
  const statusLabel = statusLabelKey ? t(statusLabelKey) : status;
  const planInfo = PLANS_INFO.find((p) => p.name === plan);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 2,
        borderColor: planColor,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <View
        style={{
          backgroundColor: planBg,
          paddingVertical: 20,
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: planColor,
            paddingHorizontal: 20,
            paddingVertical: 6,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: "#fff", fontFamily: fonts.headingBlack, fontWeight: fontWeights.headingBlack, fontSize: 20, letterSpacing: 1 }}>
            {planInfo?.label || plan}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: statusColor,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              backgroundColor: statusColor,
              marginRight: 6,
            }}
          />
          <Text style={{ color: statusColor, fontSize: 15, fontWeight: "700" }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, alignItems: "center" }}>
        <Text style={{ fontSize: 24, fontFamily: fonts.heading, fontWeight: fontWeights.heading, color: colors.text }}>
          {planInfo?.price || "Gratuit"}
        </Text>
      </View>
    </View>
  );
}
