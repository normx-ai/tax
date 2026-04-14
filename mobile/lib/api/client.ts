/**
 * API Client — Keycloak token injection
 * Le token Keycloak est envoye en header Authorization: Bearer
 * Plus de cookies httpOnly, plus de CSRF, plus de refresh custom
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { createLogger } from "@/lib/utils/logger";

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
