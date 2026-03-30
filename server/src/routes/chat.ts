// server/src/routes/chat.ts
// Routes chat IA fiscal - SSE streaming + CRUD conversations

import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/keycloak-auth";
import { resolveTenant } from "../middleware/tenant.middleware";
import { checkQuestionQuota } from "../middleware/subscription.middleware";
import { validate } from "../middleware/validate.middleware";
import { messageStreamBody, conversationIdParam } from "../schemas/chat.schema";
import * as chatService from "../services/chat.service";
import prisma from "../utils/prisma"; // pour les articles CGI (donnees globales)
import { createLogger } from "../utils/logger";

const logger = createLogger('ChatRoutes');

const router = Router();

/**
 * @swagger
 * /chat/message/stream:
 *   post:
 *     tags: [Chat]
 *     summary: Envoyer un message avec streaming SSE
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flux SSE de la réponse du chat
 */
// POST /api/chat/message/stream — Envoyer un message avec streaming SSE
router.post("/message/stream", requireAuth, resolveTenant, checkQuestionQuota, validate({ body: messageStreamBody }), async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { content, conversationId } = req.body;

  // Configurer SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const stream = chatService.sendMessageStream(req.tenantSchema!, userId, content.trim(), conversationId);

    for await (const event of stream) {
      res.write(`event: ${event.event}\ndata: ${event.data}\n\n`);
    }

    res.write("event: close\ndata: {}\n\n");
    res.end();
  } catch (err) {
    logger.error("[chat/stream]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     tags: [Chat]
 *     summary: Lister les conversations de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations
 */
// GET /api/chat/conversations — Lister les conversations
router.get("/conversations", requireAuth, resolveTenant, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await chatService.getConversations(req.tenantSchema!, req.userId!);
    res.json({ conversations });
  } catch (err) {
    logger.error("[chat/conversations]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * @swagger
 * /chat/conversations/{id}:
 *   get:
 *     tags: [Chat]
 *     summary: Récupérer une conversation avec ses messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Détails de la conversation
 *       404:
 *         description: Conversation introuvable
 */
// GET /api/chat/conversations/:id — Recuperer une conversation avec messages
router.get("/conversations/:id", requireAuth, resolveTenant, validate({ params: conversationIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const conversation = await chatService.getConversation(req.tenantSchema!, req.userId!, id);
    res.json({ conversation });
  } catch (err) {
    logger.error("[chat/conversation]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Conversation introuvable") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * @swagger
 * /chat/conversations/{id}:
 *   delete:
 *     tags: [Chat]
 *     summary: Supprimer une conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Conversation supprimée
 *       404:
 *         description: Conversation introuvable
 */
// DELETE /api/chat/conversations/:id — Supprimer une conversation
router.delete("/conversations/:id", requireAuth, resolveTenant, validate({ params: conversationIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await chatService.deleteConversation(req.tenantSchema!, req.userId!, id);
    res.json({ message: "Conversation supprimee" });
  } catch (err) {
    logger.error("[chat/delete]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Conversation introuvable") {
      res.status(404).json({ error: message });
      return;
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * @swagger
 * /chat/article/{numero}/references:
 *   get:
 *     tags: [Chat]
 *     summary: Obtenir les références croisées d'un article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *         description: Numéro de l'article
 *     responses:
 *       200:
 *         description: Références croisées de l'article
 *       404:
 *         description: Article introuvable
 */
// GET /api/chat/article/:numero/references — Articles liés par références croisées
router.get("/article/:numero/references", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const numero = Array.isArray(req.params.numero) ? req.params.numero[0] : req.params.numero;

    // Validation : :numero ne doit pas être vide et doit contenir uniquement des caractères alphanumériques, tirets ou points (LOW-11)
    if (!numero || !/^[\w.\-]+$/.test(numero)) {
      res.status(400).json({ error: 'Le paramètre "numero" est invalide' });
      return;
    }

    const article = await prisma.article.findFirst({
      where: { numero },
      select: {
        id: true,
        numero: true,
        titre: true,
        references: {
          select: {
            toArticle: {
              select: { id: true, numero: true, titre: true },
            },
          },
        },
        referencedBy: {
          select: {
            fromArticle: {
              select: { id: true, numero: true, titre: true },
            },
          },
        },
      },
    });

    if (!article) {
      res.status(404).json({ error: "Article introuvable" });
      return;
    }

    res.json({
      article: { id: article.id, numero: article.numero, titre: article.titre },
      references: article.references.map((r: { toArticle: { id: string; numero: string; titre: string | null } }) => r.toArticle),
      referencedBy: article.referencedBy.map((r: { fromArticle: { id: string; numero: string; titre: string | null } }) => r.fromArticle),
    });
  } catch (err) {
    logger.error("[chat/article/references]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
