/**
 * API Client — Keycloak token injection
 * Le token Keycloak est envoye en header Authorization: Bearer
 * Plus de cookies httpOnly, plus de CSRF, plus de refresh custom
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { createLogger } from "@/lib/utils/logger";
import { errorBus } from "@/lib/errorBus";

const log = createLogger("api");
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3003/api";
export { API_URL };
const API_TIMEOUT_MS = 15_000;

const isWeb = typeof window !== "undefined";
const isMobile = !isWeb;
export { isWeb, isMobile };

// Storage compat (pour les composants qui l'utilisent encore)
export const storage = {
  get: async () => null,
  set: async () => {},
  remove: async () => {},
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — injecter le token Keycloak
api.interceptors.request.use(async (config) => {
  try {
    const { useAuthStore } = require("@/lib/store/auth");
    const token = await useAuthStore.getState().getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const user = useAuthStore.getState().user;
    if (user?.entreprise_id) {
      config.headers["X-Organization-ID"] = user.entreprise_id;
    }
  } catch (err) {
    // Passe par le logger centralise : console en dev, Sentry en prod.
    // On ne passe que le message (pas l'objet err complet) pour eviter
    // toute exposition accidentelle de stack trace ou donnees sensibles.
    log.warn("Erreur injection token", err instanceof Error ? err.message : String(err));
  }
  return config;
});

// Response interceptor — gerer les 401
let isRefreshing = false;
const MAX_QUEUE_SIZE = 100;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

/**
 * Notifier visiblement l'utilisateur quand une requete API echoue pour une
 * raison serveur ou reseau. Le toast est emis via errorBus → ToastProvider.
 * On ne notifie PAS les 401 (gerees par le refresh), ni les 4xx fonctionnelles
 * (400, 403, 404, 422, 429) qui sont des erreurs metier attendues et que
 * l'appelant affiche a sa maniere.
 */
function notifyUserOfApiError(error: AxiosError): void {
  const status = error.response?.status;
  // Erreurs network (pas de reponse) ou 5xx : on notifie
  if (!error.response) {
    errorBus.emit("Connexion au serveur impossible. Verifiez votre reseau.", "error");
    return;
  }
  if (status && status >= 500) {
    errorBus.emit(`Le serveur a repondu avec une erreur (${status}). Reessaie dans quelques instants.`, "error");
    return;
  }
  // 401 non notifie (gere par le refresh)
  // 4xx metier non notifie (l'appelant affiche son propre message)
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _skipAuthRetry?: boolean };

    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest._skipAuthRetry
    ) {
      // Erreur non-401 ou 401 deja retry : on notifie l'utilisateur si c'est
      // une erreur serveur/reseau. Les 4xx restent silencieuses (l'appelant
      // gere son propre affichage).
      notifyUserOfApiError(error);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        if (failedQueue.length >= MAX_QUEUE_SIZE) failedQueue.shift();
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { useAuthStore } = require("@/lib/store/auth");
      const newToken = await useAuthStore.getState().getToken();
      if (!newToken) {
        useAuthStore.getState().setSessionExpired(true);
        processQueue(error, null);
        return Promise.reject(error);
      }
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      const { useAuthStore } = require("@/lib/store/auth");
      useAuthStore.getState().setSessionExpired(true);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
