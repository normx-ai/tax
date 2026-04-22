import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { fonts, fontWeights } from "@/lib/theme/fonts";
import type { ThemeColors } from '@/lib/theme/colors';

interface Props {
  firstName: string;
  lastName: string;
  phone: string;
  profession: string;
  saving: boolean;
  message: { type: "success" | "error"; text: string } | null;
  createdAt: string;
  onChangeFirstName: (v: string) => void;
  onChangeLastName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeProfession: (v: string) => void;
  onSave: () => void;
  colors: ThemeColors;
}

function FieldInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  isLast,
  colors,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  isLast?: boolean;
  colors: ThemeColors;
}) {
  return (
    <View style={{ marginBottom: isLast ? 0 : 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Ionicons name={icon} size={14} color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: fonts.semiBold, fontWeight: fontWeights.semiBold }}>
          {label}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.disabled}
        keyboardType={keyboardType || "default"}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 17,
          fontFamily: fonts.regular,
          color: colors.text,
          backgroundColor: colors.input,
        }}
      />
    </View>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfileForm({
  firstName,
  lastName,
  phone,
  profession,
  saving,
  message,
  createdAt,
  onChangeFirstName,
  onChangeLastName,
  onChangePhone,
  onChangeProfession,
  onSave,
  colors,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      {/* Message feedback */}
      {message && (
        <View
          style={{
            backgroundColor: message.type === "success" ? `${colors.success}15` : `${colors.danger}15`,
            padding: 14,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={message.type === "success" ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={message.type === "success" ? colors.success : colors.danger}
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              color: message.type === "success" ? colors.success : colors.danger,
              fontSize: 16,
              fontFamily: fonts.medium,
              fontWeight: fontWeights.medium,
              flex: 1,
            }}
          >
            {message.text}
          </Text>
        </View>
      )}

      {/* Formulaire */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <FieldInput
          label={t("auth.firstName")}
          icon="person-outline"
          value={firstName}
          onChangeText={onChangeFirstName}
          placeholder={t("auth.firstNamePlaceholder")}
          colors={colors}
        />
        <FieldInput
          label={t("auth.lastName")}
          icon="person-outline"
          value={lastName}
          onChangeText={onChangeLastName}
          placeholder={t("auth.lastNamePlaceholder")}
          colors={colors}
        />
        <FieldInput
          label={t("auth.phone")}
          icon="call-outline"
          value={phone}
          onChangeText={onChangePhone}
          placeholder={t("auth.phonePlaceholder")}
          keyboardType="phone-pad"
          colors={colors}
        />
        <FieldInput
          label="Profession"
          icon="briefcase-outline"
          value={profession}
          onChangeText={onChangeProfession}
          placeholder={t("auth.professionPlaceholder")}
          isLast
          colors={colors}
        />
      </View>

      {/* Date inscription */}
      {createdAt ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 15, fontFamily: fonts.regular, fontWeight: fontWeights.regular }}>
            {t("profil.memberSince")} {formatDate(createdAt)}
          </Text>
        </View>
      ) : null}

      {/* Bouton Enregistrer */}
      <View style={{ alignItems: "flex-end" }}>
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? colors.accent : colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: "#fff", fontSize: 17, fontFamily: fonts.bold, fontWeight: fontWeights.bold }}>
            {saving ? t("common.saving") : t("common.save")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
