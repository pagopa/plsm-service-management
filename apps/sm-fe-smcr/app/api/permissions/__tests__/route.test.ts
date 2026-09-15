const returning = jest.fn();
const values = jest.fn(() => ({ returning }));
const insert = jest.fn(() => ({ values }));
const getOrCreateCurrentAppUser = jest.fn();
const hasPermission = jest.fn();

jest.mock("@/db", () => ({
  getDb: () => ({ insert }),
}));
jest.mock("@/db/schema", () => ({ permissions: {} }));
jest.mock("@/lib/auth/server", () => ({ getOrCreateCurrentAppUser }));
jest.mock("@/lib/auth/permissions", () => ({ hasPermission }));
jest.mock("@/lib/logger/logger.server.helpers", () => ({
  logServerError: jest.fn(),
}));

import { POST } from "../route";

const validRequest = () =>
  new Request("http://localhost/api/permissions", {
    body: JSON.stringify({
      code: "overview.manage",
      description: "Gestisce i permessi overview",
      name: "Gestione overview",
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }) as never;

describe("POST /api/permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrCreateCurrentAppUser.mockResolvedValue({ user: { id: "1" } });
    hasPermission.mockResolvedValue(true);
    returning.mockResolvedValue([
      {
        code: "overview.manage",
        description: "Gestisce i permessi overview",
        id: 4,
        name: "Gestione overview",
      },
    ]);
  });

  it("creates a permission for an authorized user", async () => {
    const response = await POST(validRequest());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: {
        code: "overview.manage",
        description: "Gestisce i permessi overview",
        id: "4",
        name: "Gestione overview",
      },
    });
    expect(hasPermission).toHaveBeenCalledWith("permissions.manage");
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("does not insert when the user is not authenticated", async () => {
    getOrCreateCurrentAppUser.mockResolvedValue(null);

    const response = await POST(validRequest());

    expect(response.status).toBe(401);
    expect(hasPermission).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not insert when the user lacks permission management access", async () => {
    hasPermission.mockResolvedValue(false);

    const response = await POST(validRequest());

    expect(response.status).toBe(403);
    expect(hasPermission).toHaveBeenCalledWith("permissions.manage");
    expect(insert).not.toHaveBeenCalled();
  });
});
