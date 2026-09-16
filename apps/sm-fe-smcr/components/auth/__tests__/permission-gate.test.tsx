import React from "react";

const mockHasCurrentPermission = jest.fn();
const mockRedirect = jest.fn();
const mockRequireServerSession = jest.fn();

jest.mock("@/lib/auth/dashboard-access", () => ({
  hasCurrentPermission: mockHasCurrentPermission,
}));

jest.mock("@/lib/auth/server", () => ({
  requireServerSession: mockRequireServerSession,
}));

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { PermissionGate } from "../permission-gate";

describe("PermissionGate", () => {
  beforeEach(() => {
    mockRequireServerSession.mockResolvedValue({});
  });

  it("renders children when the current user has the required permission", async () => {
    mockHasCurrentPermission.mockResolvedValue(true);
    const children = <div>allowed</div>;

    await expect(
      PermissionGate({
        children,
        permission: "pnpg.read",
        returnUrl: "/dashboard/pnpg",
      }),
    ).resolves.toBe(children);

    expect(mockRequireServerSession).toHaveBeenCalledWith("/dashboard/pnpg");
    expect(mockHasCurrentPermission).toHaveBeenCalledWith("pnpg.read");
  });

  it("redirects denied routes to the dashboard", async () => {
    mockHasCurrentPermission.mockResolvedValue(false);

    await PermissionGate({
      children: <div>protected</div>,
      permission: "pnpg.read",
      returnUrl: "/dashboard/pnpg",
    });

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the supplied denied content for Overview", async () => {
    mockHasCurrentPermission.mockResolvedValue(false);
    const denied = <div>permission denied</div>;

    await expect(
      PermissionGate({
        children: <div>protected</div>,
        denied,
        permission: "overview.read",
        returnUrl: "/dashboard/overview",
      }),
    ).resolves.toBe(denied);

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
