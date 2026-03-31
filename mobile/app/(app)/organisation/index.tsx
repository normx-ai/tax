import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useAuthStore } from "@/lib/store/auth";
import {
  organizationApi,
  type Organization,
  type OrgMember,
  type Invitation,
  type SeatRequest,
} from "@/lib/api/organization";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/ToastProvider";

import OrgHeader from "@/components/organisation/OrgHeader";
import MemberList from "@/components/organisation/MemberList";
import InviteForm from "@/components/organisation/InviteForm";
import PendingInvitations from "@/components/organisation/PendingInvitations";
import DangerZone from "@/components/organisation/DangerZone";
import SeatRequestSection from "@/components/organisation/SeatRequestSection";
import NoOrganisation from "@/components/organisation/NoOrganisation";
import { fonts, fontWeights } from "@/lib/theme/fonts";

export default function OrganisationScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { toast, confirm } = useToast();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.entreprise_id != null ? String(user.entreprise_id) : undefined;

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  // Créer organisation
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Modifier nom org
  const [editingName, setEditingName] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Menu ouvert pour un membre
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Demande de sièges supplémentaires
  const [seatsToAdd, setSeatsToAdd] = useState("");
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [pendingSeatRequest, setPendingSeatRequest] = useState<SeatRequest | null>(null);

  const currentUserRole = members.find((m) => m.userId === String(user?.id))?.role;
  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN" || isOwner;

  // AbortController pour annuler les requêtes en cours si le composant est démonté (P5)
  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    // Annuler la requête précédente si en cours
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const [orgData, membersData, invData] = await Promise.all([
        organizationApi.getOrganization(orgId),
        organizationApi.getMembers(orgId),
        organizationApi.getInvitations(orgId),
      ]);
      if (controller.signal.aborted) return;
      setOrg(orgData);
      setMembers(membersData);
      setInvitations(invData);
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : t("security.unknownError");
      setError(msg);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
    return () => { abortRef.current?.abort(); };
  }, [loadData]);

  const handleInvite = async () => {
    if (!orgId || !inviteEmail.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inviteEmail.trim())) {
      toast(t("auth.emailInvalid"), "error");
      return;
    }
    setActionLoading(true);
    try {
      await organizationApi.inviteMember(orgId, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      toast("Invitation envoyée", "success");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (member: OrgMember) => {
    if (!orgId) return;
    const ok = await confirm({
      title: t("common.confirm"),
      message: `Retirer ${member.name || member.email} de l'organisation ?`,
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await organizationApi.removeMember(orgId, member.userId);
      toast("Membre retiré", "success");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (member: OrgMember, newRole: string) => {
    if (!orgId) return;
    setActionLoading(true);
    try {
      await organizationApi.changeMemberRole(orgId, member.userId, newRole);
      setMenuOpenId(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvitation = async (invId: string) => {
    if (!orgId) return;
    setActionLoading(true);
    try {
      await organizationApi.cancelInvitation(orgId, invId);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferOwnership = async (member: OrgMember) => {
    if (!orgId) return;
    const ok = await confirm({
      title: t("common.confirm"),
      message: `Transférer la propriété de l'organisation à ${member.name || member.email} ? Cette action est irréversible.`,
      confirmLabel: t("common.confirm"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await organizationApi.transferOwnership(orgId, member.userId);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      await organizationApi.createOrganization(createName.trim());
      setCreateName("");
      router.replace("/(app)/organisation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditOrgName = async () => {
    if (!orgId || !newOrgName.trim()) return;
    setActionLoading(true);
    try {
      await organizationApi.updateOrganization(orgId, newOrgName.trim());
      setEditingName(false);
      setNewOrgName("");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!orgId) return;
    const ok = await confirm({
      title: t("organization.delete"),
      message: "Supprimer l'organisation ? Cette action est réversible pendant 30 jours.",
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await organizationApi.deleteOrganization(orgId);
      router.replace("/(app)/organisation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreOrg = async () => {
    if (!orgId) return;
    setActionLoading(true);
    try {
      await organizationApi.restoreOrganization(orgId);
      toast("Organisation restaurée", "success");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!orgId) return;
    const ok = await confirm({
      title: t("organization.permanentDelete"),
      message: "Supprimer définitivement l'organisation ? Cette action est IRRÉVERSIBLE.",
      confirmLabel: t("organization.permanentDelete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await organizationApi.permanentDeleteOrganization(orgId);
      router.replace("/(app)/organisation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const currentSeats = org?.paidSeats || 0;

  const handleRequestSeats = async () => {
    const seatsNum = parseInt(seatsToAdd, 10) || 0;
    if (!orgId || seatsNum < 1) return;

    const basePrices: Record<string, number> = { ENTERPRISE: 500, TEAM: 299, PROFESSIONAL: 149, STARTER: 69 };
    const basePrice = basePrices[org?.plan || "TEAM"] || 299;
    const totalAfter = currentSeats + seatsNum;
    let discount = 0;
    if (totalAfter >= 10) discount = 0.20;
    else if (totalAfter >= 5) discount = 0.15;
    else if (totalAfter >= 3) discount = 0.10;
    const unitPrice = Math.round(basePrice * (1 - discount));
    const totalPrice = seatsNum * unitPrice;

    const ok = await confirm({
      title: t("seatRequest.confirmTitle"),
      message: `${seatsNum} ${t("admin.seats")} x ${unitPrice}€ = ${totalPrice}€`,
      confirmLabel: t("seatRequest.submit"),
      cancelLabel: t("common.cancel"),
    });
    if (!ok) return;

    setSeatsLoading(true);
    try {
      const request = await organizationApi.requestAdditionalSeats(orgId, seatsNum);
      setPendingSeatRequest(request);
      setSeatsToAdd("");
      toast(t("seatRequest.success"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast(msg, "error");
    } finally {
      setSeatsLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 16 }}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!orgId) {
    return (
      <NoOrganisation
        createName={createName}
        createLoading={createLoading}
        onChangeCreateName={setCreateName}
        onCreateOrg={handleCreateOrg}
        colors={colors}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {error && (
          <View style={{ backgroundColor: `${colors.danger}15`, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>{error}</Text>
          </View>
        )}

        {org && (
          <OrgHeader
            org={org}
            isAdmin={isAdmin}
            editingName={editingName}
            newOrgName={newOrgName}
            actionLoading={actionLoading}
            onStartEdit={() => {
              setEditingName(true);
              setNewOrgName(org.name);
            }}
            onCancelEdit={() => {
              setEditingName(false);
              setNewOrgName("");
            }}
            onSaveName={handleEditOrgName}
            onChangeNewName={setNewOrgName}
            colors={colors}
          />
        )}

        <MemberList
          members={members}
          isAdmin={isAdmin}
          isOwner={isOwner}
          menuOpenId={menuOpenId}
          onToggleMenu={setMenuOpenId}
          onChangeRole={handleChangeRole}
          onRemoveMember={handleRemoveMember}
          onTransferOwnership={handleTransferOwnership}
          colors={colors}
        />

        {isAdmin && (() => {
          const pendingCount = invitations.filter(i => i.status === "PENDING").length;
          const paidSeats = org?.paidSeats;
          const remainingSeats = paidSeats !== undefined
            ? paidSeats - members.length - pendingCount
            : undefined;
          return (
            <InviteForm
              inviteEmail={inviteEmail}
              inviteRole={inviteRole}
              actionLoading={actionLoading}
              remainingSeats={remainingSeats}
              paidSeats={paidSeats}
              onChangeEmail={setInviteEmail}
              onChangeRole={setInviteRole}
              onInvite={handleInvite}
              colors={colors}
            />
          );
        })()}

        <PendingInvitations
          invitations={invitations}
          isAdmin={isAdmin}
          onCancelInvitation={handleCancelInvitation}
          colors={colors}
        />

        {/* Section demande de sièges supplémentaires — OWNER uniquement */}
        {isOwner && org && org.plan !== "FREE" && (
          <SeatRequestSection
            currentSeats={currentSeats}
            membersCount={members.length}
            plan={org.plan}
            seatsToAdd={seatsToAdd}
            seatsLoading={seatsLoading}
            pendingSeatRequest={pendingSeatRequest}
            onChangeSeatsToAdd={setSeatsToAdd}
            onRequestSeats={handleRequestSeats}
            colors={colors}
          />
        )}

        {isOwner && (
          <DangerZone
            actionLoading={actionLoading}
            onDelete={handleDeleteOrg}
            onRestore={handleRestoreOrg}
            onPermanentDelete={handlePermanentDelete}
            colors={colors}
          />
        )}
      </ScrollView>
    </View>
  );
}
