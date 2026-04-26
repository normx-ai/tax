/**
 * Coordonnées société et bancaires NORMX AI SAS.
 * Source unique de vérité pour factures (PDF), emails et écrans clients.
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
  address: {
    street: "71 rue Daire",
    postalCode: "80000",
    city: "Amiens",
    country: "France",
  },
  contact: {
    info: "info-contact@normx-ai.com",
    billing: "facturation@normx-ai.com",
    support: "support@normx-ai.com",
    website: "normx-ai.com",
  },
} as const;

export const BANK = {
  name: "Shine",
  bankCode: "17418",
  branchCode: "00001",
  accountNumber: "00012085293",
  ribKey: "42",
  iban: "FR76 1741 8000 0100 0120 8529 342",
  ibanCompact: "FR7617418000010001208529342",
  bic: "SNNNFR22XXX",
  swiftPartnerBic: "TRWIBEB3",
  holder: "NORMX AI",
  holderAddress: "71 rue Daire, 80000 Amiens, France",
} as const;

export function formatCompanyAddress(): string {
  const { street, postalCode, city, country } = COMPANY.address;
  return `${street}, ${postalCode} ${city}, ${country}`;
}
