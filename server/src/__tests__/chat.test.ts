import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import prisma from "../utils/prisma";

const mockPrisma = prisma as unknown as Record<string, Record<string, jest.Mock>>;

function createAuthToken(userId = "user-1", email = "test@example.com") {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET || "test-jwt-secret-for-testing", {
    expiresIn: "1h",
  });
}

/**
 * Setup mocks for resolveTenant + checkCredits middlewares
 */
function setupMiddlewareMocks() {
  // resolveTenant: user exists
  mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "test@example.com" });
  // resolveTenant: membership exists
  mockPrisma.organizationMember.findFirst.mockResolvedValue({
    userId: "user-1",
    organizationId: "org-1",
    role: "OWNER",
    permissions: null,
  });
  // checkCredits: subscription exists with unlimited credits
  mockPrisma.subscription.findUnique.mockResolvedValue({
    id: "sub-1",
    organizationId: "org-1",
    plan: "PRO",
    status: "ACTIVE",
    creditsPerMonth: -1,
    creditsUsed: 0,
    currentPeriodStart: new Date(),
    currentPeriodEnd: null,
  });
}

describe("Chat Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/chat/message/stream", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app)
        .post("/api/chat/message/stream")
        .send({ content: "Test" });

      expect(res.status).toBe(401);
    });

    it("devrait retourner 400 sans contenu", async () => {
      const token = createAuthToken();
      setupMiddlewareMocks();

      const res = await request(app)
        .post("/api/chat/message/stream")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("GET /api/chat/conversations", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app).get("/api/chat/conversations");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/chat/conversations/:id", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app).get("/api/chat/conversations/some-id");

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/chat/conversations/:id", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app).delete("/api/chat/conversations/some-id");

      expect(res.status).toBe(401);
    });
  });
});
