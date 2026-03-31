import { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/lib/store/auth";
import { userApi, type UserProfile } from "@/lib/api/user";
import { useTheme } from "@/lib/theme/ThemeContext";
import AvatarSection from "@/components/profil/AvatarSection";
import ProfileForm from "@/components/profil/ProfileForm";
import { fonts, fontWeights } from "@/lib/theme/fonts";

function getInitials(firstName?: string | null, lastName?: string | null) {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "U";
}

export default function ProfilScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { user: profile } = await userApi.getProfile();
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
      setProfession(profile.profession || "");
      setEmail(profile.email);
      setCreatedAt(profile.createdAt);
    } catch {
      // Fallback sur les données du store
      if (user) {
        setFirstName(user.prenom || "");
        setLastName(user.nom || "");
        setPhone(user.telephone || "");
        setEmail(user.email || "");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: "error", text: t("profil.nameRequired") });
      return;
    }
    if (phone.trim() && !/^[+]?[\d\s()-]{6,20}$/.test(phone.trim())) {
      setMessage({ type: "error", text: t("profil.phoneInvalid") });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { user: updated } = await userApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        profession: profession.trim() || null,
      });

      // Mettre à jour le store Zustand pour refléter les changements partout
      if (user) {
        setUser({
          ...user,
          prenom: updated.firstName || user.prenom,
          nom: updated.lastName || user.nom,
          telephone: updated.phone || undefined,
        });
      }

      setMessage({ type: "success", text: t("profil.updateSuccess") });
    } catch (err) {
      const errorMsg = (isAxiosError(err) ? err.response?.data?.error : null) || t("profil.updateError");
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = getInitials(firstName, lastName);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Avatar + Email */}
        <AvatarSection initials={initials} email={email} colors={colors} />

        {/* Form + Message + Save */}
        <ProfileForm
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          profession={profession}
          saving={saving}
          message={message}
          createdAt={createdAt}
          onChangeFirstName={setFirstName}
          onChangeLastName={setLastName}
          onChangePhone={setPhone}
          onChangeProfession={setProfession}
          onSave={handleSave}
          colors={colors}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
