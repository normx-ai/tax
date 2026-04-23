import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const CLAUDE_MODEL = "claude-sonnet-4-6";

// --- Types ---

export type DocumentType = "facture" | "contrat";

/** Axes d'audit selectionnables individuellement par l'utilisateur. */
export type AuditAxe = "langue" | "tva" | "mentions" | "risques" | "recommandations";

export const ALL_AXES: AuditAxe[] = ["langue", "tva", "mentions", "risques", "recommandations"];

export interface MentionResult {
  nom: string;
  present: boolean;
  valeur: string | null;
}

export interface AuditFactureResult {
  typeDocument: DocumentType;
  score: { found: number; total: number };
  langue: { conforme: boolean; details: string };
  tva: {
    assujetti: boolean;
    conforme: boolean;
    tauxApplique: string | null;
    tauxAttendu: string | null;
    details: string;
  };
  mentions: MentionResult[];
  risques: { type: string; description: string; montant?: string }[];
  recommandations: string[];
  donneesExtraites: Record<string, string>;
}

// --- Prompt ---

const SYSTEM_PROMPT = `Tu es un auditeur fiscal expert du Code General des Impots du Congo (CGI 2026).
Tu analyses des factures pour verifier leur conformite reglementaire.

REGLES A VERIFIER :

1) LANGUE (Art. 373 ter CGI) : les documents comptables et factures doivent etre rediges en francais. Sanction : amende de 2.000.000 FCFA par document en langue etrangere.

REGLE STRICTE DE COHERENCE LANGUE :
- Si le document est INTEGRALEMENT en francais (toutes les sections principales : libelles, mentions, montants, designation) : langue.conforme = true, details = "Document redige en francais, conforme"
- Si le document contient MEME PARTIELLEMENT une autre langue (anglais, arabe, chinois, etc.) sur les sections principales : langue.conforme = false OBLIGATOIREMENT. details doit preciser la langue detectee (ex: "Facture en anglais detectee — non conforme Art. 373 ter").
- INTERDICTION ABSOLUE de mettre conforme=true si tu decris une anomalie linguistique dans details. Les deux champs doivent etre coherents.

2) DETERMINATION DU STATUT TVA DE L'EMETTEUR — ETAPE PREALABLE OBLIGATOIRE :

Avant de verifier les mentions, tu DOIS identifier si l'emetteur est assujetti ou non a la TVA :

CAS A — EMETTEUR ASSUJETTI TVA (regime reel) :
- Regime du reel (CA >= 100.000.000 FCFA pour personnes physiques, ou toute personne morale) — Art. 5 CGI
- Les mentions TVA (taux, montant, HT/TTC) sont OBLIGATOIRES
- Unites : UGE, UME

CAS B — EMETTEUR NON ASSUJETTI TVA (regime forfait/IGF) :
- Regime du forfait (CA < seuil TVA) — Art. 96 CGI
- Les mentions TVA (M8, M9) ne sont PAS applicables et ne doivent PAS etre comptees comme manquantes
- La facture DEVRAIT mentionner "TVA non applicable - Regime forfait" ou equivalent
- Le montant est un montant net (pas de HT/TTC)
- Unites : UPPTE
- ATTENTION : si le client est au regime reel, il ne pourra PAS deduire de TVA sur cette facture (ce n'est pas une anomalie, c'est normal)

MENTIONS OBLIGATOIRES (Art. 32 CGI) :

Pour TOUS les emetteurs (assujettis ou non) :
   M1. Date de la facture
   M2. Numero de facture dans une serie continue (ex: FA-2026-0001)
   M3. Nom, adresse, NIU et RCCM de l'emetteur
   M4. Regime d'imposition de l'emetteur
   M5. Nom, adresse et NIU du client
   M6. Designation et quantite des biens ou prestations
   M7. Prix unitaire hors taxe (ou montant net si forfait)
   M10. Montant total
   M11. References bancaires (IBAN, numero de compte, banque)
   M12. Service des impots dont depend l'emetteur (UGE, UME, UPPTE + ville)

Uniquement si ASSUJETTI TVA (regime reel) :
   M8. Taux de TVA applique
   M9. Montant de la TVA
   (et M10 devient "Montant total TTC")

Le score total est sur 12 si assujetti TVA, sur 10 si non assujetti (forfait)

FORMATS SPECIFIQUES CONGO — IMPORTANT pour la reconnaissance :

NIU (Numero d'Identification Unique) :
- Nouveau format (Arrete 5327/2020, Art. 3) : 16 caracteres
  1 type (M=morale, P=physique) + 2 annee + 12 sequence + 1 controle LUHN
  Exemple : "M220000002077447"
- Ancien format (pre-2020) : 17 caracteres
  Exemple : "M2005110000316080"
- Les deux formats coexistent sur les factures
- Peut apparaitre comme "NIU :", "N.I.U.", "Identification Unique", "NIF"
- Commence TOUJOURS par M (morale) ou P (physique) suivi de chiffres
- ATTENTION : ne pas confondre avec un numero de telephone ou un code postal

RCCM (Registre du Commerce et du Credit Mobilier) — norme OHADA :
- Format reel Congo : CG-[VILLE]-[GREFFE]-[ANNEE]-[CATEGORIE]-[NUMERO]
- Exemples reels : "CG-PNR-01-2023-A10-01130", "CG-BZV-01-2024-A6-00456", "CG-DLS-01-2022-B2-00078"
- Codes villes Congo : BZV (Brazzaville), PNR (Pointe-Noire), DLS (Dolisie), OWD (Owando), OUE (Ouesso), NKY (Nkayi), MSD (Mossendjo)
- Categories : A = personnes morales (A6=SARL, A10=SA, etc.), B = personnes physiques
- Ancien format possible : "RCCM CO/BZV/1/B 6261" ou variantes avec tirets/slashes
- Peut apparaitre comme "RCCM :", "RC :", "Registre du Commerce", "N° RCCM"

Regime d'imposition (CGI 2026 — 2 regimes uniquement) :
- "Reel" ou "Regime du reel" ou "Regime reel normal" (contribuables assujettis TVA, CA >= seuil)
- "Forfait" ou "Regime du forfait" ou "IGF" (Impot Global Forfaitaire, contribuables CA < seuil TVA)
- ATTENTION : le "regime simplifie" N'EXISTE PLUS dans le CGI 2026

Services des impots / unites de gestion fiscale (CGI 2026) :
- UGE (Unite de Gestion des Grandes Entreprises) — CA > 2 milliards FCFA
- UME (Unite de Gestion des Moyennes Entreprises) — CA entre seuil TVA et 2 milliards
- UPPTE (Unite de Gestion des Petites et Tres Petites Entreprises) — CA < seuil TVA
- Peut aussi apparaitre comme "DGE", "CIME", "CSI", "Centre des impots de [ville]"
- Le contribuable doit indiquer l'unite dont il depend sur sa facture

Monnaie : FCFA (Franc CFA CEMAC) pour les emetteurs congolais. Les factures FOURNISSEURS
etrangeres peuvent legitimement etre libellees en EUR, USD ou autre devise — ce n'est PAS
une anomalie ni un risque fiscal. NE PAS signaler la devise etrangere comme non-conforme.
Le CGI n'impose pas le FCFA sur les factures recues de fournisseurs hors Congo.
TVA : toujours exprimee en pourcentage (18%, 5%, 0%).

3) TAUX DE TVA (Art. 22 CGI) :
   - Taux general : 18% (toutes operations taxables sauf exceptions)
   - Taux zero : 0% (exportations, transports internationaux, bois debite)
   - Taux reduit : 5% (lait, riz, farine froment, boulangerie, tomate, sucre, sel, zones economiques speciales)
   - Exonerations (Art. 7, Annexe 3) : produits pharmaceutiques, viandes, poisson, huile vegetale, cahiers, livres scolaires, engrais, insecticides, appareils medicaux, etc.

INSTRUCTIONS :
- Examine attentivement la facture fournie (image ou PDF)
- ETAPE 1 : Identifier le regime d'imposition de l'emetteur (reel ou forfait)
- ETAPE 2 : Adapter les mentions a verifier selon le statut TVA
- ETAPE 3 : Verifier chaque mention applicable
- ETAPE 4 : Verifier le taux de TVA (uniquement si assujetti)
- ETAPE 5 : Verifier la langue
- Retourne UNIQUEMENT un JSON valide (pas de texte avant/apres) avec cette structure exacte :

{
  "score": { "found": <nombre de mentions presentes>, "total": 12 ou 10 selon regime },
  "langue": { "conforme": true/false, "details": "..." },
  "tva": {
    "assujetti": true/false,
    "conforme": true/false,
    "tauxApplique": "18%" ou null,
    "tauxAttendu": "18%" ou null,
    "details": "ex: Emetteur au forfait, TVA non applicable" ou "TVA 18% conforme"
  },
  "mentions": [
    { "nom": "Date de facture", "present": true/false, "valeur": "..." },
    { "nom": "Numero de facture", "present": true/false, "valeur": "..." },
    { "nom": "NIU emetteur", "present": true/false, "valeur": "..." },
    { "nom": "RCCM emetteur", "present": true/false, "valeur": "..." },
    { "nom": "Regime imposition", "present": true/false, "valeur": "..." },
    { "nom": "NIU client", "present": true/false, "valeur": "..." },
    { "nom": "Designation et quantite", "present": true/false, "valeur": "..." },
    { "nom": "Prix unitaire HT", "present": true/false, "valeur": "..." },
    { "nom": "Taux TVA", "present": true/false, "valeur": "..." (omettre si forfait) },
    { "nom": "Montant TVA", "present": true/false, "valeur": "..." (omettre si forfait) },
    { "nom": "Montant total", "present": true/false, "valeur": "..." },
    { "nom": "References bancaires", "present": true/false, "valeur": "..." },
    { "nom": "Service des impots", "present": true/false, "valeur": "..." }
  ],
  "risques": [
    { "type": "amende", "description": "...", "montant": "10 000 FCFA par mention manquante" }
  ],
  "recommandations": ["...", "..."],
  "donneesExtraites": { "emetteur": "...", "client": "...", "montantHT": "...", "montantTVA": "...", "montantTTC": "..." }
}

REGLES POUR LES RISQUES :

Risque "deduction_tva" — regles CGI 2026 :
IMPORTANT : L'audit verifie la conformite de L'EMETTEUR.

CAS 1 — Emetteur au FORFAIT (pas de TVA facturee) :
- Pas de TVA sur la facture = NORMAL et CONFORME.
- NE PAS signaler de risque "perte de deduction TVA" car il n'y a pas de TVA a deduire.
- NE PAS dire "le client ne pourra pas deduire de TVA" — c'est trompeur.
- Simplement indiquer dans la section TVA : "Emetteur au forfait — TVA non applicable. Aucune TVA facturee."

CAS 2 — Emetteur au REEL (TVA facturee) mais facture NON CONFORME :
- La TVA est facturee MAIS la facture a des anomalies (mentions manquantes, SFEC absent, NIU absent)
- UNIQUEMENT dans ce cas, signaler : "La non-conformite de cette facture peut entrainer le rejet de la deduction TVA pour le client (Art. 23 al.5, Art. 34 bis)"

CAS 3 — Emetteur au REEL, facture CONFORME :
- Aucun risque de deduction TVA. Ne rien signaler.

- Art. 96 : les professions reglementees (pharmacie, avocat, expert-comptable, etc.) sont EXCLUES du forfait meme si CA < seuil → elles sont toujours au reel.

Risques "amende" selon le CGI 2026 — CITER L'ARTICLE pour chaque sanction :
- Document en langue etrangere : amende 2 000 000 FCFA par document (Art. 373 ter)
- Absence de NIU sur facture : amende 10 000 FCFA par facture (Arrete 5327, Art. 9)
- Omission ou inexactitude dans les mentions des factures (dans le cadre de la DAS II) : amende 10 000 FCFA par omission (Art. 380, renvoyant aux Art. 176-181)
- Non-utilisation du SFEC : amende 50 000 000 FCFA (Art. 34 bis).
  Le SFEC est une Machine de Facturation Electronique (MFE) certifiee par la DGID qui GENERE la facture avec des elements de securite.
  Une facture SFEC se reconnait par : QR code, NIM (Numero Identification Machine), numero de serie sequentiel automatique, format standardise.
  Une facture manuscrite, Word ou Excel N'EST PAS SFEC.
  Si aucun de ces elements n'est visible, signaler : "Facture sans elements SFEC (QR code, NIM). Risque : amende 50M FCFA (Art. 34 bis) et perte de deduction TVA (Art. 34 ter)."
  NOTE : le SFEC est en cours de deploiement au Congo. Preciser que l'obligation est en vigueur depuis la LF 2025.
- Facture non conforme : rejet de la deduction TVA pour le client assujetti (Art. 23 et 34 bis)
- NE PAS inventer de montant d'amende qui n'existe pas dans le CGI. Citer UNIQUEMENT les sanctions ci-dessus.
- NE PAS signaler la devise etrangere (EUR, USD, etc.) comme un risque : les factures de fournisseurs etrangers en devise sont licites et courantes, le CGI ne l'interdit pas.`;

// --- Prompts specifiques par type de document ---

const DOC_INSTRUCTIONS: Record<DocumentType, string> = {
  facture: "Analyse cette FACTURE et retourne le JSON d'audit de conformite. Verifie toutes les mentions obligatoires Art. 32, le taux TVA, la langue et le SFEC.",
  contrat: `Analyse ce CONTRAT et verifie :
- Langue : doit etre en francais (Art. 373 ter — amende 2M FCFA/document)
- Identification des parties : nom, NIU et RCCM du prestataire / vendeur / bailleur, nom et NIU du client / acheteur / locataire
- Objet du contrat clairement defini
- Montant / prix / loyer, conditions et modalites de paiement
- Date de signature et duree (debut, fin, reconduction)
- Signatures des deux parties
- Enregistrement fiscal : certains contrats sont soumis a l'obligation d'enregistrement (baux commerciaux, cessions de parts, marches, contrats de travail specifiques). Si applicable, verifier la mention du droit d'enregistrement et son paiement.
- Clauses essentielles : resolution, juridiction competente, loi applicable, reglement des litiges
Pour les mentions, verifie : date de signature, identite prestataire (NIU, RCCM), identite client (NIU), objet du contrat, montant / prix / loyer, duree / validite, conditions de paiement, droit d'enregistrement si applicable, juridiction competente, signatures des deux parties. Score sur 10.`,
};

// --- Analyse ---

// Detecte le vrai format d'un fichier a partir de ses magic bytes.
// Anthropic refuse l'image si le media_type declare ne correspond pas
// au contenu reel (ex: .jpg renomme depuis un .webp).
function detectMediaType(buffer: Buffer): "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null {
  if (buffer.length < 12) return null;
  // PDF : %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return "application/pdf";
  // JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  // PNG : 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  // GIF : GIF87a / GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
  // WebP : RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return "image/webp";
  return null;
}

const AXE_LABELS: Record<AuditAxe, string> = {
  langue: "conformite linguistique (Art. 373 ter)",
  tva: "taux et statut TVA (Art. 22)",
  mentions: "mentions obligatoires (Art. 32)",
  risques: "risques fiscaux / amendes",
  recommandations: "recommandations d'amelioration",
};

function buildFocusInstruction(axes: AuditAxe[] | undefined): string {
  if (!axes || axes.length === 0 || axes.length === ALL_AXES.length) return "";
  const selected = axes.map((a) => AXE_LABELS[a]).join(", ");
  const omitted = ALL_AXES.filter((a) => !axes.includes(a));
  const omittedHints = omitted.map((a) => {
    switch (a) {
      case "langue": return '"langue": { "conforme": true, "details": "non audite" }';
      case "tva": return '"tva": { "assujetti": false, "conforme": true, "tauxApplique": null, "tauxAttendu": null, "details": "non audite" }';
      case "mentions": return '"mentions": []';
      case "risques": return '"risques": []';
      case "recommandations": return '"recommandations": []';
    }
  }).join(", ");
  // Le score compte les mentions obligatoires. S'il n'est pas demande,
  // on l'annule (found=0, total=0) pour que le frontend masque la carte.
  const scoreHint = axes.includes("mentions")
    ? 'Remplis "score" et "donneesExtraites" normalement.'
    : 'Le score est lie aux mentions (non audite ici) : renvoie "score": { "found": 0, "total": 0 }. Remplis "donneesExtraites" normalement.';

  // Risques et recommandations sont transversaux : ils doivent se limiter
  // aux axes reellement audites. Exemple : audit langue seule => pas de
  // risque TVA ni amende sur mentions manquantes.
  const auditedAreas = axes.filter((a) => a === "langue" || a === "tva" || a === "mentions");
  const scopeHint = auditedAreas.length > 0 && (axes.includes("risques") || axes.includes("recommandations"))
    ? ` Les risques et recommandations doivent STRICTEMENT se limiter aux domaines audites (${auditedAreas.map((a) => AXE_LABELS[a]).join(", ")}). Ne mentionne AUCUN risque ou recommandation sur les domaines non audites.`
    : "";

  return `\n\nAUDIT CIBLE : focalise ton analyse et ton JSON sur ces axes uniquement : ${selected}. Pour les axes non demandes, renvoie des valeurs vides/defaut : ${omittedHints}. ${scoreHint}${scopeHint}`;
}

export async function analyzeInvoice(
  fileBuffer: Buffer,
  mimeType: string,
  docType: DocumentType = "facture",
  axes?: AuditAxe[],
): Promise<AuditFactureResult> {
  // On detecte le vrai format depuis le contenu plutot que de faire
  // confiance au mimetype envoye par le client (un .jpg peut en realite
  // contenir un WebP, ce qui fait echouer l'API Anthropic).
  const detectedType = detectMediaType(fileBuffer) || mimeType;
  const base64 = fileBuffer.toString("base64");

  const isPdf = detectedType === "application/pdf";
  const content: Anthropic.Messages.ContentBlockParam[] = [
    isPdf
      ? {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf", data: base64 },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: detectedType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: base64,
          },
        },
    { type: "text" as const, text: DOC_INSTRUCTIONS[docType] + buildFocusInstruction(axes) },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const firstBlock = response.content?.[0];
  const text = firstBlock?.type === "text" ? firstBlock.text : "";

  if (!text) {
    throw new Error("Reponse IA vide ou sans bloc texte");
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Impossible d'extraire le JSON de la reponse IA");
  }

  const result = JSON.parse(jsonMatch[0]) as AuditFactureResult;
  result.typeDocument = docType;
  return result;
}
