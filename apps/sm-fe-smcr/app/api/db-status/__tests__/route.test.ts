import { getDb } from "@/db";
import { getServerSession } from "@/lib/auth/server";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";
import { GET } from "../route";

jest.mock("@/db", () => ({
  getDb: jest.fn(),
}));

jest.mock("@/lib/auth/server", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/logger/logger.server.helpers", () => ({
  logServerError: jest.fn(),
  logServerInfo: jest.fn(),
}));

const mockedGetDb = jest.mocked(getDb);
const mockedGetServerSession = jest.mocked(getServerSession);
const mockedLogServerError = jest.mocked(logServerError);
const mockedLogServerInfo = jest.mocked(logServerInfo);

describe("GET /api/db-status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects requests without an authenticated session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ status: "unauthorized" });
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("checks the Drizzle connection and records a successful result", async () => {
    const execute = jest.fn().mockResolvedValue({ rows: [{ result: 1 }] });
    mockedGetServerSession.mockResolvedValue({} as never);
    mockedGetDb.mockReturnValue({ execute } as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "online" });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(mockedLogServerInfo).toHaveBeenCalledWith(
      "Database connectivity check succeeded",
      { event: "database.connectivity.ok" },
    );
  });

  it("returns a generic unavailable response and records the error", async () => {
    const databaseError = new Error("sensitive database details");
    const execute = jest.fn().mockRejectedValue(databaseError);
    mockedGetServerSession.mockResolvedValue({} as never);
    mockedGetDb.mockReturnValue({ execute } as never);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "offline" });
    expect(mockedLogServerError).toHaveBeenCalledWith(
      databaseError,
      "Database connectivity check failed",
      { event: "database.connectivity.error" },
    );
    expect(mockedLogServerInfo).not.toHaveBeenCalled();
  });
});
