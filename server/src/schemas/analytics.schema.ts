import { z } from 'zod';

export const daysQuery = z.object({
  // Periode limitee a 365 jours pour eviter des scans de DB sur des annees entieres
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const popularSearchesQuery = z.object({
  // limit plafonne a 100 : evite un DoS memoire si l'attaquant demande ?limit=999999999
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const responseTimesQuery = z.object({
  // Meme cap que daysQuery : 365 jours max
  days: z.coerce.number().int().min(1).max(365).default(30),
});
