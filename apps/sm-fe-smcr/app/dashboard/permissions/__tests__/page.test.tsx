import { renderToStaticMarkup } from "react-dom/server";

const mockHasPermission = jest.fn();
const mockReadPermissions = jest.fn();
const mockPermissionsListView = jest.fn(() => null);

jest.mock("@/components/permissions/permissions-management-ui", () => ({
  PermissionsListView: mockPermissionsListView,
  PermissionsManagementBreadcrumb: () => null,
}));
jest.mock("@/lib/auth/permissions", () => ({
  hasPermission: mockHasPermission,
}));
jest.mock("@/lib/services/teams.service", () => ({
  readPermissions: mockReadPermissions,
}));

import Page from "../page";

describe("PermissionsPage", () => {
  it("passes read permissions to the list while disabling management for unauthorized users", async () => {
    const permissions = [
      {
        code: "overview.read",
        description: "Visualizza overview",
        id: 1,
        name: "Visualizza overview",
        status: "active",
      },
    ];
    mockReadPermissions.mockResolvedValue({ data: permissions, error: null });
    mockHasPermission.mockResolvedValue(false);

    const element = await Page();
    renderToStaticMarkup(element);

    expect(mockHasPermission).toHaveBeenCalledWith("permissions.manage");
    expect(mockPermissionsListView).toHaveBeenCalledWith(
      {
        canManage: false,
        permissions,
      },
      undefined,
    );
  });
});
