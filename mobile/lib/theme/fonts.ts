import { Platform } from "react-native";

/**
 * NORMX Tax Typography System
 *
 * Inter (sans-serif) — tous les textes : titres, corps, navigation, badges, boutons, chiffres. Poids : 300–900.
 */

// Sur web, les polices sont chargées via Google Fonts CDN (nom CSS standard).
// Sur native, expo-font enregistre les polices sous le nom d'export (ex: "Inter_400Regular").
// On utilise une map pour abstraire cette différence.

const isWeb = Platform.OS === "web";

export const fonts = {
  // ── Inter (titres) ──
  heading: isWeb ? "Inter" : "Inter_700Bold",
  headingBlack: isWeb ? "Inter" : "Inter_900Black",

  // ── Inter (corps) ──
  light: isWeb ? "Inter" : "Inter_300Light",
  regular: isWeb ? "Inter" : "Inter_400Regular",
  medium: isWeb ? "Inter" : "Inter_500Medium",
  semiBold: isWeb ? "Inter" : "Inter_600SemiBold",
  bold: isWeb ? "Inter" : "Inter_700Bold",
  extraBold: isWeb ? "Inter" : "Inter_800ExtraBold",
  black: isWeb ? "Inter" : "Inter_900Black",
} as const;

// Font weights correspondants pour le web (fontWeight est ignoré sur native quand fontFamily est spécifié)
export const fontWeights = {
  heading: isWeb ? ("700" as const) : undefined,
  headingBlack: isWeb ? ("900" as const) : undefined,
  light: isWeb ? ("300" as const) : undefined,
  regular: isWeb ? ("400" as const) : undefined,
  medium: isWeb ? ("500" as const) : undefined,
  semiBold: isWeb ? ("600" as const) : undefined,
  bold: isWeb ? ("700" as const) : undefined,
  extraBold: isWeb ? ("800" as const) : undefined,
  black: isWeb ? ("900" as const) : undefined,
} as const;

/** Google Fonts CDN URL pour le web */
export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
