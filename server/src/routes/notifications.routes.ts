import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { typedRoute } from "../middleware/typed-route";
import { registerPushBody, unregisterPushBody } from "../schemas/notifications.schema";
import { PushService } from "../services/push.service";
import prisma from "../utils/prisma";

const router = Router();

/**
 * @swagger
 * /notifications/register:
 *   post:
 *     tags: [Notifications]
 *     summary: Enregistrer un token push
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token enregistré
 *       400:
 *         description: Token manquant
 */
router.post("/register", requireAuth, ...typedRoute({ body: registerPushBody }, async (req, res) => {
  const { token, platform } = req.validated.body;
  await PushService.registerToken(req.userId!, token, platform || "unknown");
  res.json({ message: "Token enregistré" });
}));

/**
 * @swagger
 * /notifications/unregister:
 *   delete:
 *     tags: [Notifications]
 *     summary: Supprimer un token push
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token supprimé
 */
router.delete("/unregister", requireAuth, ...typedRoute({ body: unregisterPushBody }, async (req, res) => {
  const { token } = req.validated.body;
  await PushService.unregisterToken(token);
  res.json({ message: "Token supprimé" });
}));

/**
 * @swagger
 * /notifications/devices:
 *   get:
 *     tags: [Notifications]
 *     summary: Lister les appareils enregistrés pour les push
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des appareils
 */
router.get("/devices", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const devices = await prisma.pushToken.findMany({
    where: { userId: req.userId! },
    select: {
      id: true,
      platform: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json({ devices, count: devices.length });
}));

/**
 * @swagger
 * /notifications/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Envoyer une notification de test à ses propres appareils
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification de test envoyée
 */
router.post("/test", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  await PushService.sendToUser(
    req.userId!,
    "Test CGI 242",
    "Les notifications push fonctionnent correctement !",
    { type: "test" },
  );
  res.json({ message: "Notification de test envoyée" });
}));

export default router;
