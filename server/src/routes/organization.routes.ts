import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { resolveTenant, requireOrg } from '../middleware/tenant.middleware';
import { requireOwner, requireAdmin, requireMember } from '../middleware/orgRole.middleware';
import { validate } from '../middleware/validate.middleware';
import { createOrgBody, updateOrgBody, inviteMemberBody, changeMemberRoleBody, transferOwnershipBody, acceptInvitationBody } from '../schemas/organization.schema';
import { idParam, idAndUserIdParams, idAndInvIdParams } from '../schemas/common.schema';
import * as orgService from '../services/organization.service';
import * as orgAdminService from '../services/organization.admin.service';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';

const router = Router();

function handleError(res: Response, err) {
  const msg = err instanceof Error ? err.message : 'Erreur serveur';
  if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
  if (msg.includes('déjà') || msg.includes('Limite') || msg.includes('Impossible') || msg.includes('Seul')) { res.status(400).json({ error: msg }); return; }
  res.status(500).json({ error: 'Erreur serveur' });
}

/**
 * @swagger
 * /organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: Liste des organisations de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des organisations
 */
// GET /api/organizations — liste des orgas du user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgs = await orgService.getUserOrganizations(req.userId!);
    res.json(orgs);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations:
 *   post:
 *     tags: [Organizations]
 *     summary: Créer une organisation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Organisation créée
 */
// POST /api/organizations — créer une organisation
router.post('/', requireAuth, validate({ body: createOrgBody }), async (req: AuthRequest, res: Response) => {
  try {
    const org = await orgService.createOrganization(req.userId!, req.userEmail!, req.body);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'ORG_CREATED', entityType: 'Organization', entityId: org.id, organizationId: org.id, ipAddress: getClientIp(req), changes: { after: { name: org.name, slug: org.slug } } });
    res.status(201).json(org);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}:
 *   get:
 *     tags: [Organizations]
 *     summary: Récupérer une organisation par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Détails de l'organisation
 *       404:
 *         description: Organisation introuvable
 */
// GET /api/organizations/:id
router.get('/:id', requireAuth, resolveTenant, requireOrg, requireMember, validate({ params: idParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const org = await orgService.getOrganizationById(id);
    res.json(org);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}:
 *   put:
 *     tags: [Organizations]
 *     summary: Mettre à jour une organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Organisation mise à jour
 *       404:
 *         description: Organisation introuvable
 */
// PUT /api/organizations/:id
router.put('/:id', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: idParam, body: updateOrgBody }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const result = await orgService.updateOrganization(id, req.body);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'ORG_UPDATED', entityType: 'Organization', entityId: id, organizationId: id, ipAddress: getClientIp(req), changes: result });
    res.json(result.after);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}:
 *   delete:
 *     tags: [Organizations]
 *     summary: Supprimer une organisation (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Organisation supprimée
 *       404:
 *         description: Organisation introuvable
 */
// DELETE /api/organizations/:id — soft delete
router.delete('/:id', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: idParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await orgAdminService.softDeleteOrganization(id, req.userId!);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'ORG_DELETED', entityType: 'Organization', entityId: id, organizationId: id, ipAddress: getClientIp(req), changes: { deletedBy: req.userId } });
    res.json({ message: 'Organisation supprimée' });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/members:
 *   get:
 *     tags: [Organizations]
 *     summary: Lister les membres d'une organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Liste des membres
 */
// GET /api/organizations/:id/members
router.get('/:id/members', requireAuth, resolveTenant, requireOrg, requireMember, validate({ params: idParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const members = await orgService.getMembers(id);
    res.json(members);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/members/invite:
 *   post:
 *     tags: [Organizations]
 *     summary: Inviter un membre dans l'organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       201:
 *         description: Invitation envoyée
 */
// POST /api/organizations/:id/members/invite
router.post('/:id/members/invite', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: idParam, body: inviteMemberBody }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const invitation = await orgService.inviteMember(id, req.userId!, req.body.email, req.body.role);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'MEMBER_INVITED', entityType: 'Invitation', entityId: invitation.id, organizationId: id, ipAddress: getClientIp(req), changes: { email: req.body.email, role: req.body.role } });
    res.status(201).json(invitation);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/members/{userId}:
 *   delete:
 *     tags: [Organizations]
 *     summary: Retirer un membre de l'organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à retirer
 *     responses:
 *       200:
 *         description: Membre retiré
 */
// DELETE /api/organizations/:id/members/:userId
router.delete('/:id/members/:userId', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: idAndUserIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = String(req.params.userId);
    await orgService.removeMember(id, userId);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'MEMBER_REMOVED', entityType: 'OrganizationMember', entityId: userId, organizationId: id, ipAddress: getClientIp(req), changes: { removedUserId: userId } });
    res.json({ message: 'Membre retiré' });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/members/{userId}/role:
 *   put:
 *     tags: [Organizations]
 *     summary: Changer le rôle d'un membre
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 */
// PUT /api/organizations/:id/members/:userId/role
router.put('/:id/members/:userId/role', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: idAndUserIdParams, body: changeMemberRoleBody }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = String(req.params.userId);
    const updated = await orgService.changeMemberRole(id, userId, req.body.role);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'MEMBER_ROLE_CHANGED', entityType: 'OrganizationMember', entityId: userId, organizationId: id, ipAddress: getClientIp(req), changes: { newRole: req.body.role } });
    res.json(updated);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/transfer-ownership:
 *   post:
 *     tags: [Organizations]
 *     summary: Transférer la propriété de l'organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Propriété transférée
 */
// POST /api/organizations/:id/transfer-ownership
router.post('/:id/transfer-ownership', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: idParam, body: transferOwnershipBody }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await orgService.transferOwnership(id, req.userId!, req.body.newOwnerId);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'OWNERSHIP_TRANSFERRED', entityType: 'Organization', entityId: id, organizationId: id, ipAddress: getClientIp(req), changes: { from: req.userId, to: req.body.newOwnerId } });
    res.json({ message: 'Propriété transférée' });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/invitations:
 *   get:
 *     tags: [Organizations]
 *     summary: Lister les invitations d'une organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Liste des invitations
 */
// GET /api/organizations/:id/invitations
router.get('/:id/invitations', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: idParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const invitations = await orgService.getInvitations(id);
    res.json(invitations);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/invitations/{invId}:
 *   delete:
 *     tags: [Organizations]
 *     summary: Annuler une invitation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *       - in: path
 *         name: invId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'invitation
 *     responses:
 *       200:
 *         description: Invitation annulée
 */
// DELETE /api/organizations/:id/invitations/:invId
router.delete('/:id/invitations/:invId', requireAuth, resolveTenant, requireOrg, requireAdmin, validate({ params: idAndInvIdParams }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const invId = String(req.params.invId);
    await orgService.cancelInvitation(id, invId);
    res.json({ message: 'Invitation annulée' });
  } catch (err) { handleError(res, err); }
});

// Seat request route removed — credits system replaces seat-based model

/**
 * @swagger
 * /organizations/accept-invitation:
 *   post:
 *     tags: [Organizations]
 *     summary: Accepter une invitation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitation acceptée
 */
// POST /api/organizations/accept-invitation — auth only, pas d'org
router.post('/accept-invitation', requireAuth, validate({ body: acceptInvitationBody }), async (req: AuthRequest, res: Response) => {
  try {
    const result = await orgService.acceptInvitation(req.userId!, req.body.token);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'MEMBER_JOINED', entityType: 'Organization', entityId: result.organizationId, organizationId: result.organizationId, ipAddress: getClientIp(req), changes: { role: result.role } });
    res.json(result);
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/restore:
 *   post:
 *     tags: [Organizations]
 *     summary: Restaurer une organisation supprimée
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Organisation restaurée
 */
// POST /api/organizations/:id/restore
router.post('/:id/restore', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: idParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await orgAdminService.restoreOrganization(id);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'ORG_RESTORED', entityType: 'Organization', entityId: id, organizationId: id, ipAddress: getClientIp(req), changes: {} });
    res.json({ message: 'Organisation restaurée' });
  } catch (err) { handleError(res, err); }
});

/**
 * @swagger
 * /organizations/{id}/permanent:
 *   delete:
 *     tags: [Organizations]
 *     summary: Supprimer définitivement une organisation (hard delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'organisation
 *     responses:
 *       200:
 *         description: Organisation supprimée définitivement
 */
// DELETE /api/organizations/:id/permanent — hard delete
router.delete('/:id/permanent', requireAuth, resolveTenant, requireOrg, requireOwner, validate({ params: idParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'ORG_HARD_DELETED', entityType: 'Organization', entityId: id, organizationId: id, ipAddress: getClientIp(req), changes: { deletedBy: req.userId } });
    await orgAdminService.hardDeleteOrganization(id);
    res.json({ message: 'Organisation supprimée définitivement' });
  } catch (err) { handleError(res, err); }
});

export default router;
