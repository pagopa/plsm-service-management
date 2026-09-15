const returning = jest.fn();
const where = jest.fn(() => ({ returning }));
const set = jest.fn(() => ({ where }));
const update = jest.fn(() => ({ set }));
const getOrCreateCurrentAppUser = jest.fn();
const hasPermission = jest.fn();

jest.mock("@/db", () => ({
  getDb: () => ({ update }),
}));
jest.mock("@/db/schema", () => ({
  permissions: { id: "id", status: "status" },
}));
jest.mock("@/lib/auth/server", () => ({ getOrCreateCurrentAppUser }));
jest.mock("@/lib/auth/permissions", () => ({ hasPermission }));
jest.mock("@/lib/logger/logger.server.helpers", () => ({
  logServerError: jest.fn(),
}));
jest.mock("drizzle-orm", () => ({
  and: jest.fn(),
  eq: jest.fn(),
}));

import { DELETE } from "../route";

describe("DELETE /api/permissions/[permissionId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrCreateCurrentAppUser.mockResolvedValue({ id: 1 });
    hasPermission.mockResolvedValue(true);
    returning.mockResolvedValue([{ id: 4 }]);
  });

  it("soft archives an active permission without deleting it", async () => {
    const response = await DELETE(new Request("http://localhost") as never, {
      params: Promise.resolve({ permissionId: "4" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(hasPermission).toHaveBeenCalledWith("permissions.manage");
    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "archived", updatedAt: expect.any(Date) }),
    );
  });

  it("rejects invalid permission IDs without checking authorization or updating", async () => {
    const response = await DELETE(new Request("http://localhost") as never, {
      params: Promise.resolve({ permissionId: "invalid" }),
    });

    expect(response.status).toBe(400);
    expect(getOrCreateCurrentAppUser).not.toHaveBeenCalled();
    expect(hasPermission).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("does not archive a permission when the user is not authenticated", async () => {
    getOrCreateCurrentAppUser.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost") as never, {
      params: Promise.resolve({ permissionId: "4" }),
    });

    expect(response.status).toBe(401);
    expect(hasPermission).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("does not archive a permission when the user lacks permission management access", async () => {
    hasPermission.mockResolvedValue(false);

    const response = await DELETE(new Request("http://localhost") as never, {
      params: Promise.resolve({ permissionId: "4" }),
    });

    expect(response.status).toBe(403);
    expect(hasPermission).toHaveBeenCalledWith("permissions.manage");
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 404 when no active permission can be archived", async () => {
    returning.mockResolvedValue([]);

    const response = await DELETE(new Request("http://localhost") as never, {
      params: Promise.resolve({ permissionId: "4" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Permesso non trovato." });
    expect(update).toHaveBeenCalledTimes(1);
  });
});
