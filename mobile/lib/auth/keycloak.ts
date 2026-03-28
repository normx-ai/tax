/**
 * Keycloak Auth — CGI-242 (normx-tax)
 * Authorization Code Flow pour web + mobile
 */

const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL || "https://auth.normx-ai.com";
const KEYCLOAK_REALM = process.env.EXPO_PUBLIC_KEYCLOAK_REALM || "normx";
const KEYCLOAK_CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || "normx-tax";

export interface KeycloakUser {
  sub: string;
  email: string;
  name: string;
  preferredUsername: string;
  roles: string[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles: string[] };
  exp?: number;
}

export function getLoginUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
  });
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
}

export function getLogoutUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: redirectUri,
  });
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout?${params}`;
}

export function getAccountUrl(): string {
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/account`;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KEYCLOAK_CLIENT_ID,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );
  if (!response.ok) throw new Error(`Echange de code echoue: ${response.status}`);
  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(token: string): Promise<TokenResponse> {
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: KEYCLOAK_CLIENT_ID,
        refresh_token: token,
      }),
    }
  );
  if (!response.ok) throw new Error(`Rafraichissement du token echoue: ${response.status}`);
  return response.json() as Promise<TokenResponse>;
}

export function parseToken(accessToken: string): KeycloakUser {
  const parts = accessToken.split(".");
  if (parts.length !== 3) throw new Error("Format JWT invalide");
  const payload = JSON.parse(atob(parts[1])) as JwtPayload;
  return {
    sub: payload.sub,
    email: payload.email || "",
    name: payload.name || "",
    preferredUsername: payload.preferred_username || "",
    roles: payload.realm_access?.roles || [],
  };
}

export function isTokenExpired(accessToken: string): boolean {
  const parts = accessToken.split(".");
  if (parts.length !== 3) return true;
  const payload = JSON.parse(atob(parts[1])) as JwtPayload;
  if (!payload.exp) return true;
  return Date.now() >= (payload.exp - 30) * 1000;
}
