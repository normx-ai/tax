export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  globalRole?: string;
  entreprise_id: number;
  entreprise_nom?: string;
  is_verified: boolean;
  created_at: string;
}

export interface Entreprise {
  id: number;
  nom: string;
  created_at: string;
}

export interface RegisterPayload {
  entrepriseNom?: string;
  pays?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  password: string;
  invitationToken?: string;
  turnstileToken?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
  turnstileToken?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
  turnstileToken?: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthResponse {
  user?: User;
  otpCode?: string;
  entreprise?: Entreprise;
  token?: string;
  refreshToken?: string;
  rememberMe?: boolean;
}

export interface OtpResponse {
  message: string;
  devCode?: string;
}

export interface MessageResponse {
  message: string;
}

export type AuthStep =
  | "email"
  | "password"
  | "register"
  | "verify-otp"
  | "forgot-password"
  | "reset-password";
