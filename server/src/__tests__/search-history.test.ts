import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import pool from "../db/pool";
import prisma from "../utils/prisma";

const mockPool = pool as unknown as { query: jest.Mock };
const mockPrisma = prisma as unknown as Record<string, Record<string, jest.Mock>>;

function createAuthToken(userId = "user-1", email = "test@example.com") {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET || "test-jwt-secret-for-testing", {
    expiresIn: "1h",
  });
}

/**
 * Setup mocks for resolveTenant middleware (uses Prisma, not pool)
 */
function setupTenantMocks() {
  mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "test@example.com" });
  mockPrisma.organizationMember.findFirst.mockResolvedValue({
    userId: "user-1",
    organizationId: "org-1",
    role: "MEMBER",
    permissions: null,
  });
}

describe("Search History Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/search-history", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app).get("/api/search-history");

      expect(res.status).toBe(401);
    });

    it("devrait retourner les resultats pagines", async () => {
      const token = createAuthToken();
      setupTenantMocks();
      const mockSearches = [
        { id: "s-1", query: "TVA", resultsCount: 0, createdAt: new Date().toISOString() },
        { id: "s-2", query: "impot", resultsCount: 1, createdAt: new Date().toISOString() },
      ];

      // pool.query is called twice: once for searches, once for count
      mockPool.query
        .mockResolvedValueOnce({ rows: mockSearches, rowCount: 2 })
        .mockResolvedValueOnce({ rows: [{ c: "2" }], rowCount: 1 });

      const res = await request(app)
        .get("/api/search-history?page=1&limit=20")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.searches).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
    });

    it("devrait utiliser la pagination par defaut", async () => {
      const token = createAuthToken();
      setupTenantMocks();

      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ c: "0" }], rowCount: 1 });

      const res = await request(app)
        .get("/api/search-history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.searches).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  describe("GET /api/search-history/popular", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app).get("/api/search-history/popular");

      expect(res.status).toBe(401);
    });

    it("devrait retourner les recherches populaires", async () => {
      const token = createAuthToken();
      setupTenantMocks();
      const mockPopular = [
        { query: "TVA", count: "15" },
        { query: "impot", count: "10" },
        { query: "deduction", count: "5" },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockPopular, rowCount: 3 });

      const res = await request(app)
        .get("/api/search-history/popular")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.popular).toHaveLength(3);
    });
  });

  describe("DELETE /api/search-history", () => {
    it("devrait retourner 401 sans authentification", async () => {
      const res = await request(app).delete("/api/search-history");

      expect(res.status).toBe(401);
    });

    it("devrait purger l'historique et retourner le compte", async () => {
      const token = createAuthToken();
      setupTenantMocks();

      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 42 });

      const res = await request(app)
        .delete("/api/search-history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Historique supprimé");
      expect(res.body.count).toBe(42);
    });
  });
});
