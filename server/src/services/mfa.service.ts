/**
 * MFA Service - Stub
 * Le MFA est gere par Keycloak nativement (TOTP conditionnel).
 * Ce fichier existe pour que les mocks de tests ne cassent pas.
 */

export const MFAService = {
  async generateSetup(_userId: string) {
    throw new Error('MFA gere par Keycloak — utilisez la console admin Keycloak.');
  },
  async enable(_userId: string, _token: string) {
    throw new Error('MFA gere par Keycloak.');
  },
  async disable(_userId: string) {
    throw new Error('MFA gere par Keycloak.');
  },
  async verifyLogin(_userId: string, _token: string) {
    throw new Error('MFA gere par Keycloak.');
  },
  async getStatus(_userId: string) {
    return { enabled: false, provider: 'keycloak' };
  },
};
