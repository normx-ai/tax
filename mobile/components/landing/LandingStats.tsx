import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  isMobile: boolean;
}

export default function LandingStats({ isMobile }: Props) {
  const { t } = useTranslation();

  const stats = [
    { value: "3 703", label: t("landing.statsArticles") },
    { value: "16", label: t("landing.statsSimulators") },
    { value: "64", label: t("landing.statsTexts") },
    { value: "2026", label: t("landing.statsEdition") },
  ];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inner,
          {
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 30 : 0,
          },
        ]}
      >
        {stats.map((stat, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#00815d",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  inner: {
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 18,
    marginTop: 6,
  },
});
