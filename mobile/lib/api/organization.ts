import { api } from "./client";

export type OrganizationMode = "ENTREPRISE" | "CABINET";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  mode?: OrganizationMode;
  plan: string;
  memberCount: number;
  paidSeats?: number;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  expiresAt: string;
}

export interface SeatRequest {
  id: string;
  organizationId: string;
  requestedById: string;
  additionalSeats: number;
  currentSeats: number;
  totalSeatsAfter: number;
  unitPrice: number;
  totalPrice: number;
  plan: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
}

export const organizationApi = {
  getUserOrganizations: async (): Promise<Organization[]> => {
    const { data } = await api.get<Organization[]>("/organizations");
    return data;
  },

  getOrganization: async (id: string): Promise<Organization> => {
    const { data } = await api.get<Organization>(`/organizations/${id}`);
    return data;
  },

  updateOrganization: async (id: string, name: string): Promise<Organization> => {
    const { data } = await api.put<Organization>(`/organizations/${id}`, { name });
    return data;
  },

  deleteOrganization: async (id: string): Promise<void> => {
    await api.delete(`/organizations/${id}`);
  },

  getMembers: async (orgId: string): Promise<OrgMember[]> => {
    const { data } = await api.get<OrgMember[]>(`/organizations/${orgId}/members`);
    return data;
  },

  inviteMember: async (orgId: string, email: string, role: string): Promise<Invitation> => {
    const { data } = await api.post<Invitation>(`/organizations/${orgId}/members/invite`, { email, role });
    return data;
  },

  removeMember: async (orgId: string, userId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/members/${userId}`);
  },

  changeMemberRole: async (orgId: string, userId: string, role: string): Promise<OrgMember> => {
    const { data } = await api.put<OrgMember>(`/organizations/${orgId}/members/${userId}/role`, { role });
    return data;
  },

  transferOwnership: async (orgId: string, newOwnerId: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/organizations/${orgId}/transfer-ownership`, { newOwnerId });
    return data;
  },

  getInvitations: async (orgId: string): Promise<Invitation[]> => {
    const { data } = await api.get<Invitation[]>(`/organizations/${orgId}/invitations`);
    return data;
  },

  cancelInvitation: async (orgId: string, invId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/invitations/${invId}`);
  },

  createOrganization: async (name: string): Promise<Organization> => {
    const { data } = await api.post<Organization>("/organizations", { name });
    return data;
  },

  acceptInvitation: async (token: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>("/organizations/accept-invitation", { token });
    return data;
  },

  restoreOrganization: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/organizations/${id}/restore`);
    return data;
  },

  permanentDeleteOrganization: async (id: string): Promise<void> => {
    await api.delete(`/organizations/${id}/permanent`);
  },

  requestAdditionalSeats: async (orgId: string, additionalSeats: number): Promise<SeatRequest> => {
    const { data } = await api.post<SeatRequest>(`/organizations/${orgId}/request-seats`, { additionalSeats });
    return data;
  },
};
