/**
 * Auth Store — Keycloak SSO
 * Remplace l'ancien store JWT custom par Keycloak authorization code flow.
 * L'interface publique reste identique (isAuthenticated, user, login, logout)
 * pour ne pas casser les composants existants.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getLoginUrl,
  getRegisterUrl,
  getLogoutUrl,
  exchangeCode,
  refreshAccessToken,
  parseToken,
  isTokenExpired,
} from "../auth/keycloak";
import type { KeycloakUser } from "../auth/keycloak";

// Re-exporter le type User pour compatibilite
export type User = KeycloakUser & {
  id: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  pays?: string;
  role?: string;
  subscription?: { plan: string };
  entreprise_id?: string | null;
};

function keycloakUserToUser(kc: KeycloakUser, accessToken: string): User {
  const nameParts = kc.name.split(" ");
  return {
    ...kc,
    id: kc.sub,
    prenom: nameParts[0] || "",
    nom: nameParts.slice(1).join(" ") || "",
    role: kc.roles.includes("admin") ? "ADMIN" : "USER",
    subscription: { plan: "pro" },
    entreprise_id: null,
  };
}

const TOKEN_KEY = "kc_access_token";
const REFRESH_KEY = "kc_refresh_token";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loggedOut: boolean;
  sessionExpired: boolean;

  login: () => void;
  register: () => void;
  logout: () => void;
  handleCallback: () => Promise<void>;
  getToken: () => Promise<string | null>;
  clearLoggedOut: () => void;
  setLoading: (loading: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  clearSessionExpired: () => void;
  verifyToken: () => Promise<void>;

  // Compat — anciennes methodes (no-op ou redirect)
  setUser: (user: User | null) => void;
  setEmail: (email: string) => void;
  setStep: (step: string) => void;
  reset: () => void;
  email: string;
  step: string;
}

const isWeb = typeof window !== "undefined";

const zustandStorage = createJSONStorage(() => ({
  getItem: async (key: string) => {
    if (isWeb && typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    try {
      const { getItemAsync } = require("expo-secure-store");
      return getItemAsync(key);
    } catch { return null; }
  },
  setItem: async (key: string, value: string) => {
    if (isWeb && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
    try {
      const { setItemAsync } = require("expo-secure-store");
      return setItemAsync(key, value);
    } catch { /* */ }
  },
  removeItem: async (key: string) => {
    if (isWeb && typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }
    try {
      const { deleteItemAsync } = require("expo-secure-store");
      return deleteItemAsync(key);
    } catch { /* */ }
  },
}));

function storeTokens(access: string, refresh: string) {
  if (isWeb && typeof localStorage !== "undefined") {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

function clearTokens() {
  if (isWeb && typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

function getStoredRefreshToken(): string | null {
  if (isWeb && typeof localStorage !== "undefined") {
    return localStorage.getItem(REFRESH_KEY);
  }
  return null;
}

function getRedirectUri(): string {
  if (isWeb && typeof window !== "undefined") {
    return window.location.origin + "/";
  }
  return "https://tax.normx-ai.com/";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      loggedOut: false,
      sessionExpired: false,
      email: "",
      step: "email",

      // Redirect vers Keycloak login
      login: () => {
        const url = getLoginUrl(getRedirectUri());
        if (isWeb) {
          window.location.href = url;
        }
      },

      // Redirect vers Keycloak register
      register: () => {
        const url = getRegisterUrl(getRedirectUri());
        if (isWeb) {
          window.location.href = url;
        }
      },

      // Redirect vers Keycloak logout
      logout: () => {
        clearTokens();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          loggedOut: true,
          sessionExpired: false,
        });
        if (isWeb) {
          const url = getLogoutUrl(getRedirectUri());
          window.location.href = url;
        }
      },

      // Appele apres le redirect Keycloak avec ?code=...
      handleCallback: async () => {
        if (!isWeb) return;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (!code) {
          set({ isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const tokens = await exchangeCode(code, getRedirectUri());
          const kcUser = parseToken(tokens.access_token);
          const user = keycloakUserToUser(kcUser, tokens.access_token);
          storeTokens(tokens.access_token, tokens.refresh_token);

          set({
            user,
            accessToken: tokens.access_token,
            isAuthenticated: true,
            isLoading: false,
            loggedOut: false,
            sessionExpired: false,
          });

          // Nettoyer l'URL (retirer ?code=...)
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error("[Keycloak] Erreur echange code:", err);
          set({ isLoading: false });
        }
      },

      // Retourne un token valide (refresh si expire)
      getToken: async () => {
        const { accessToken } = get();
        if (accessToken && !isTokenExpired(accessToken)) {
          return accessToken;
        }

        // Token expire — tenter un refresh
        const refresh = getStoredRefreshToken();
        if (!refresh) {
          set({ user: null, accessToken: null, isAuthenticated: false, sessionExpired: true });
          return null;
        }

        try {
          const tokens = await refreshAccessToken(refresh);
          const kcUser = parseToken(tokens.access_token);
          const user = keycloakUserToUser(kcUser, tokens.access_token);
          storeTokens(tokens.access_token, tokens.refresh_token);
          set({ user, accessToken: tokens.access_token, isAuthenticated: true });
          return tokens.access_token;
        } catch {
          clearTokens();
          set({ user: null, accessToken: null, isAuthenticated: false, sessionExpired: true });
          return null;
        }
      },

      clearLoggedOut: () => set({ loggedOut: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setSessionExpired: (sessionExpired) => set({ sessionExpired }),
      clearSessionExpired: () => set({ sessionExpired: false }),

      verifyToken: async () => {
        const { accessToken, isAuthenticated } = get();
        if (!isAuthenticated || !accessToken) {
          set({ isLoading: false });
          return;
        }

        if (isTokenExpired(accessToken)) {
          // Tenter un refresh
          await get().getToken();
        }
        set({ isLoading: false });
      },

      // Compat — no-op
      setUser: (user) => set({ user }),
      setEmail: () => {},
      setStep: () => {},
      reset: () => {},
    }),
    {
      name: "cgi242-auth",
      storage: zustandStorage,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Verifier le callback Keycloak (?code=...)
          state.handleCallback().then(() => {
            // Si pas de callback, verifier le token stocke
            if (!state.isAuthenticated) {
              state.verifyToken();
            }
          });
        }
      },
    },
  ),
);
