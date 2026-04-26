// Bloc 4.2 — Rappels et notifications sur les dossiers fiscaux.
//
// Fonctions appelees par le cron quotidien (reminder.service.ts) :
// - marquerEnRetard()             : passe automatiquement les dossiers
//   echus et non deposes au statut EN_RETARD
// - envoyerRappelsDossiers()      : pour chaque utilisateur OWNER/ADMIN
//   d'une organisation active, envoie un email recap des dossiers
//   personnels (echeances proches + retards)

import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";
import { EmailService } from "./email.service";

const logger = createLogger("DossiersRappels");

/**
 * Passe les dossiers expires (dateEcheance < aujourd'hui) et encore non
 * deposes (statut A_FAIRE ou EN_COURS) au statut EN_RETARD. Ne touche
 * pas aux DEPOSE / PAYE / NON_APPLICABLE.
 */
export async function marquerEnRetard(): Promise<{ updated: number }> {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const result = await prisma.dossier.updateMany({
    where: {
      dateEcheance: { lt: aujourdhui },
      statut: { in: ["A_FAIRE", "EN_COURS"] },
    },
    data: { statut: "EN_RETARD" },
  });

  if (result.count > 0) {
    logger.info(`${result.count} dossier(s) marques EN_RETARD`);
  }
  return { updated: result.count };
}

/**
 * Envoie a chaque OWNER/ADMIN d'une organisation active un recap email
 * des dossiers fiscaux a venir (7 jours) et en retard.
 *
 * Logique :
 * - Une seule notification par utilisateur par jour (regroupement par
 *   organisation s'ils sont membres de plusieurs)
 * - Skip les utilisateurs sans dossier a remonter
 */
export async function envoyerRappelsDossiers(): Promise<{ sent: number; errors: number }> {
  const result = { sent: 0, errors: 0 };
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const dansSeptJours = new Date(aujourdhui);
  dansSeptJours.setDate(dansSeptJours.getDate() + 7);

  // Recupere les memberships OWNER/ADMIN des orgs actives, dedupliques par
  // utilisateur (un utilisateur peut etre membre de plusieurs orgs).
  const memberships = await prisma.organizationMember.findMany({
    where: {
      role: { in: ["OWNER", "ADMIN"] },
      organization: {
        deletedAt: null,
        subscription: { status: { in: ["ACTIVE", "TRIALING"] } },
      },
    },
    include: {
      user: { select: { id: true, email: true, firstName: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  // Pour chaque membership, recupere les dossiers de l'org et envoie un
  // email recap si necessaire.
  for (const m of memberships) {
    try {
      const [aVenir, enRetard] = await Promise.all([
        prisma.dossier.findMany({
          where: {
            entite: { organizationId: m.organizationId, actif: true },
            dateEcheance: { gte: aujourdhui, lte: dansSeptJours },
            statut: { in: ["A_FAIRE", "EN_COURS", "PRET"] },
          },
          orderBy: { dateEcheance: "asc" },
          include: {
            entite: { select: { raisonSociale: true } },
            obligation: { select: { code: true, libelle: true } },
          },
          take: 20,
        }),
        prisma.dossier.findMany({
          where: {
            entite: { organizationId: m.organizationId, actif: true },
            statut: "EN_RETARD",
          },
          orderBy: { dateEcheance: "asc" },
          include: {
            entite: { select: { raisonSociale: true } },
            obligation: { select: { code: true, libelle: true } },
          },
          take: 20,
        }),
      ]);

      if (aVenir.length === 0 && enRetard.length === 0) continue;

      const html = buildRappelHtml({
        prenom: m.user.firstName ?? "",
        organisation: m.organization.name,
        aVenir,
        enRetard,
      });

      await EmailService.sendRaw(
        m.user.email,
        `NORMX TAX — ${enRetard.length > 0 ? `${enRetard.length} dossier(s) en retard, ` : ""}${aVenir.length} échéance(s) à venir`,
        html,
      );
      result.sent++;
    } catch (err) {
      logger.error(`Echec rappel dossier pour ${m.user.email}`, err as Error);
      result.errors++;
    }
  }

  if (result.sent > 0 || result.errors > 0) {
    logger.info(`Rappels dossiers envoyes : ${result.sent} OK, ${result.errors} erreurs`);
  }
  return result;
}

interface RappelInput {
  prenom: string;
  organisation: string;
  aVenir: Array<{
    periode: string;
    dateEcheance: Date;
    statut: string;
    entite: { raisonSociale: string } | null;
    obligation: { code: string; libelle: string } | null;
  }>;
  enRetard: Array<{
    periode: string;
    dateEcheance: Date;
    statut: string;
    entite: { raisonSociale: string } | null;
    obligation: { code: string; libelle: string } | null;
  }>;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function buildRappelHtml(input: RappelInput): string {
  const greeting = input.prenom ? `Bonjour ${input.prenom},` : "Bonjour,";
  const retardsRows = input.enRetard.map(d => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #fee;color:#b91c1c;font-weight:600;">EN RETARD</td>
      <td style="padding:8px;border-bottom:1px solid #fee;">${fmtDate(d.dateEcheance)}</td>
      <td style="padding:8px;border-bottom:1px solid #fee;">${d.entite?.raisonSociale ?? "?"}</td>
      <td style="padding:8px;border-bottom:1px solid #fee;">${d.obligation?.code ?? ""} — ${d.obligation?.libelle ?? ""}</td>
    </tr>
  `).join("");
  const aVenirRows = input.aVenir.map(d => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6;color:#0F2A42;">À venir</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${fmtDate(d.dateEcheance)}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${d.entite?.raisonSociale ?? "?"}</td>
      <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${d.obligation?.code ?? ""} — ${d.obligation?.libelle ?? ""}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f3f4f6;margin:0;padding:24px;">
<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff;">
  <tr><td style="background:#0F2A42;padding:20px;text-align:center;">
    <img src="cid:normx-logo" alt="NORMX TAX" height="40" style="height:40px;border:0;">
  </td></tr>
  <tr><td style="padding:24px;">
    <h2 style="font-size:18px;color:#0F2A42;margin:0 0 12px;">${greeting}</h2>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Voici le récap de vos obligations fiscales pour <strong>${input.organisation}</strong>.
    </p>
    ${input.enRetard.length > 0 ? `
      <h3 style="color:#b91c1c;font-size:15px;margin:20px 0 8px;">${input.enRetard.length} obligation${input.enRetard.length > 1 ? "s" : ""} en retard</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">${retardsRows}</table>
    ` : ""}
    ${input.aVenir.length > 0 ? `
      <h3 style="color:#0F2A42;font-size:15px;margin:20px 0 8px;">${input.aVenir.length} échéance${input.aVenir.length > 1 ? "s" : ""} dans les 7 prochains jours</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">${aVenirRows}</table>
    ` : ""}
    <p style="font-size:13px;color:#6b7280;margin:24px 0 0;line-height:1.6;">
      Connectez-vous à NORMX TAX pour traiter vos dossiers, lancer les simulations correspondantes et marquer les déclarations comme déposées.
    </p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:11px;color:#9ca3af;margin:0;">NORMX AI SAS — auth.normx-ai.com — info-contact@normx-ai.com</p>
  </td></tr>
</table>
</body></html>`;
}
