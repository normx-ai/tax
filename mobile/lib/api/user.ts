import { api } from "./client";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profession: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  creditsPerMonth: number;
  creditsUsed: number;
  currentPeriodEnd: string | null;
}

export interface ProfileResponse {
  user: UserProfile;
  subscription: SubscriptionInfo | null;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  profession?: string | null;
}

export interface UserStats {
  totalQuestions: number;
  monthQuestions: number;
  totalArticles: number;
  activeDays: number;
  last7Days: { date: string; questions: number }[];
}

export const userApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const { data } = await api.get<ProfileResponse>("/user/profile");
    return data;
  },

  updateProfile: async (payload: UpdateProfileData): Promise<{ user: UserProfile }> => {
    const { data } = await api.put<{ user: UserProfile }>("/user/profile", payload);
    return data;
  },

  getStats: async (): Promise<UserStats> => {
    const { data } = await api.get<UserStats>("/user/stats");
    return data;
  },
};
