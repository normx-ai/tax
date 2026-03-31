import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  password: string;
  colors: ThemeColors;
}

interface Criterion {
  key: string;
  test: (pw: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { key: "passwordStrength.minLength", test: (pw) => pw.length >= 12 },
  { key: "passwordStrength.uppercase", test: (pw) => /[A-Z]/.test(pw) },
  { key: "passwordStrength.digit", test: (pw) => /[0-9]/.test(pw) },
  { key: "passwordStrength.special", test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw) },
];

function getBarColor(score: number): string {
  if (score <= 1) return "#ef4444"; // rouge
  if (score === 2) return "#f97316"; // orange
  if (score === 3) return "#eab308"; // jaune
  return "#22c55e"; // vert
}

export default function PasswordStrengthIndicator({ password, colors }: Props) {
  const { t } = useTranslation();

  const results = useMemo(
    () => CRITERIA.map((c) => ({ ...c, passed: c.test(password) })),
    [password],
  );

  const score = results.filter((r) => r.passed).length;
  const barColor = getBarColor(score);

  if (!password) return null;

  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      {/* Barre de progression */}
      <View style={{ height: 4, backgroundColor: colors.input, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <View
          style={{
            width: `${(score / CRITERIA.length) * 100}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Liste des criteres */}
      {results.map((r) => (
        <View key={r.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Ionicons
            name={r.passed ? "checkmark-circle" : "close-circle"}
            size={16}
            color={r.passed ? "#22c55e" : colors.textMuted}
          />
          <Text
            style={{
              fontSize: 14,
              color: r.passed ? "#22c55e" : colors.textMuted,
              marginLeft: 6,
            }}
          >
            {t(r.key)}
          </Text>
        </View>
      ))}
    </View>
  );
}
