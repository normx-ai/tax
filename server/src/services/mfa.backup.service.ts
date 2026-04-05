/**
 * MFA Backup Codes Service - Stub
 * Le MFA est gere par Keycloak nativement.
 */

export const MFABackupService = {
  async generateBackupCodes(_userId: string) {
    throw new Error('MFA backup codes geres par Keycloak.');
  },
  async verifyAndConsume(_userId: string, _code: string) {
    throw new Error('MFA backup codes geres par Keycloak.');
  },
};
