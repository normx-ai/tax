import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  days: number;
  onChangeDays: (d: number) => void;
  onRefresh: () => void;
  colors: ThemeColors;
}

export default function PeriodSelector({ days, onChangeDays, onRefresh, colors }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 12, gap: 8 }}>
      {[30, 60].map((d) => (
        <TouchableOpacity
          key={d}
          onPress={() => onChangeDays(d)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: days === d ? colors.primary : colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: days === d ? "#fff" : colors.text }}>{d}j</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={onRefresh} style={{ padding: 8 }}>
        <Ionicons name="refresh-outline" size={20} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
}
