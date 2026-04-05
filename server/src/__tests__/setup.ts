// Mock jwks-rsa (ESM module incompatible avec Jest CJS)
jest.mock("jwks-rsa", () => {
  return jest.fn().mockReturnValue({
    getSigningKey: jest.fn().mockImplementation((_kid: string, cb: (err: null, key: { getPublicKey: () => string }) => void) => {
      cb(null, { getPublicKey: () => 'mock-public-key' });
    }),
  });
});

// Mock keycloak-auth middleware pour les tests supertest
// Les tests utilisent des JWT signés en HS256 avec JWT_SECRET, pas du RS256 Keycloak.
jest.mock("../middleware/keycloak-auth", () => {
  const jwt = require("jsonwebtoken");
  const original = jest.requireActual("../middleware/keycloak-auth");

  return {
    ...original,
    requireAuth: (req: any, res: any, next: any) => {
      const header = req.headers.authorization;
      let token: string | null = null;
      if (header?.startsWith("Bearer ")) {
        token = header.split(" ")[1];
      }
      if (!token) {
        res.status(401).json({ error: "Token manquant" });
        return;
      }
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "test-jwt-secret-for-testing");
        req.userId = payload.userId || payload.sub;
        req.userEmail = payload.email || "";
        req.userName = payload.name || "";
        req.userRoles = payload.roles || [];
        req.userSubscriptions = ["tax"]; // Autoriser le produit tax dans les tests
        next();
      } catch {
        res.status(401).json({ error: "Token invalide ou expire" });
      }
    },
    optionalAuth: (_req: any, _res: any, next: any) => next(),
  };
});

// Mock product-subscription middleware (toujours passer en test)
jest.mock("../middleware/product-subscription.middleware", () => ({
  requireProductSubscription: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock db/pool pour les tests (pas de vraie connexion PG)
jest.mock("../db/pool", () => {
  const mockPool = {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { __esModule: true, default: mockPool, getValidatedSchemaName: (slug: string) => `tenant_${slug}` };
});

// Mock db/tenant.service pour éviter les appels PG réels
jest.mock("../db/tenant.service", () => ({
  createTenantSchema: jest.fn().mockResolvedValue("tenant_test"),
  ensureUserInSchema: jest.fn().mockResolvedValue("user-1"),
}));

// Mock expo-server-sdk (ESM module incompatible avec Jest CJS)
jest.mock("expo-server-sdk", () => ({
  Expo: class MockExpo {
    static isExpoPushToken() { return true; }
    chunkPushNotifications(messages: unknown[]) { return [messages]; }
    async sendPushNotificationsAsync() { return []; }
  },
}));

// Mock services qui dépendent de modules externes
jest.mock("../services/reminder.service", () => ({
  startReminderCron: jest.fn(),
}));

jest.mock("../services/email.service", () => ({
  EmailService: {
    sendOtp: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendMfaEnabled: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock services RAG/Qdrant (connexions persistantes)
jest.mock("../services/chat.service", () => ({
  sendMessageStream: jest.fn(),
  getConversations: jest.fn().mockResolvedValue([]),
  getConversation: jest.fn(),
  deleteConversation: jest.fn(),
}));

jest.mock("../services/push.service", () => ({
  PushService: {
    sendToUser: jest.fn(),
    sendFiscalDeadlinesPush: jest.fn(),
    registerToken: jest.fn(),
    unregisterToken: jest.fn(),
  },
}));

jest.mock("../services/audit.service", () => ({
  AuditService: {
    log: jest.fn(),
    getOrganizationAudit: jest.fn(),
    getUserActions: jest.fn(),
    getEntityHistory: jest.fn(),
    search: jest.fn(),
    getStats: jest.fn(),
    gdprCleanup: jest.fn(),
  },
}));

// Mock subscription service
jest.mock("../services/subscription.service", () => ({
  getSubscription: jest.fn(),
  activateSubscription: jest.fn(),
  renewSubscription: jest.fn(),
  upgradePlan: jest.fn(),
  checkQuota: jest.fn(),
}));

// Mock MFA services (dépendent de modules crypto/QR)
jest.mock("../services/mfa.service", () => ({
  MFAService: {
    generateSetup: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    verifyLogin: jest.fn(),
    getStatus: jest.fn(),
  },
}));

jest.mock("../services/mfa.backup.service", () => ({
  MFABackupService: {
    generateBackupCodes: jest.fn(),
    verifyAndConsume: jest.fn(),
  },
}));

// Mock Prisma Client global pour les tests
jest.mock("../utils/prisma", () => {
  const mockPrisma: Record<string, unknown> = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    organizationMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    conversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    searchHistory: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
    article: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    articleReference: {
      count: jest.fn(),
    },
    invitation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    alerteFiscale: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    usageStats: {
      findMany: jest.fn(),
    },
    pushToken: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
  };
  return { __esModule: true, default: mockPrisma };
});

// Variables d'environnement pour les tests
process.env.JWT_SECRET = "test-jwt-secret-for-testing";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-testing";
process.env.NODE_ENV = "test";
