/**
 * Coordonnées société et bancaires NORMX AI SAS (côté client mobile/web).
 * Doit rester aligné avec server/src/config/company.ts.
 */

export const COMPANY = {
  legalName: "NORMX AI",
  legalForm: "SAS au capital de 1 000 EUR",
  sigle: "NX",
  siren: "103 831 921",
  siret: "103 831 921 00012",
  nic: "00012",
  ape: "62.01Z",
  apeLabel: "Programmation informatique",
  rcs: "RCS Amiens 2026 B 00524",
  registrationDate: "2026-04-02",
  address: "71 rue Daire, 80000 Amiens, France",
  contact: {
    info: "info-contact@normx-ai.com",
    billing: "facturation@normx-ai.com",
    support: "support@normx-ai.com",
    website: "normx-ai.com",
  },
} as const;

export const BANK = {
  name: "Shine",
  iban: "FR76 1741 8000 0100 0120 8529 342",
  bic: "SNNNFR22XXX",
  holder: "NORMX AI",
} as const;
