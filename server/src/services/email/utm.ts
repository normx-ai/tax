// Helpers de tracking UTM pour les liens dans les emails transactionnels.
// Chaque lien CTA passe par addUtm() pour permettre l'attribution dans
// Google Analytics / Plausible / Matomo.

interface UtmParams {
  source?: string; // utm_source (default: email)
  medium?: string; // utm_medium (default: transactional)
  campaign: string; // utm_campaign (obligatoire — ex: 'fiscal-deadlines')
  content?: string; // utm_content (variant CTA)
}

export function addUtm(url: string, params: UtmParams): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", params.source ?? "email");
  u.searchParams.set("utm_medium", params.medium ?? "transactional");
  u.searchParams.set("utm_campaign", params.campaign);
  if (params.content) u.searchParams.set("utm_content", params.content);
  return u.toString();
}
