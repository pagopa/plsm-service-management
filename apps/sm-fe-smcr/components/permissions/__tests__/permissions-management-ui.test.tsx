import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  type PermissionsListPermission,
  PermissionsListView,
} from "../permissions-management-ui";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/permissions/create-permission-dialog", () => ({
  CreatePermissionDialog: () => <div>Crea permesso</div>,
}));
jest.mock("@/components/permissions/archive-permission-dialog", () => ({
  ArchivePermissionDialog: ({ permissionName }: { permissionName: string }) => (
    <div>Archivia {permissionName}</div>
  ),
}));

const permissions: PermissionsListPermission[] = [
  {
    code: "overview.read",
    description: "Visualizza overview",
    id: "1",
    name: "Visualizza overview",
    status: "active",
  },
];

describe("Permissions management UI", () => {
  it("renders management actions for users with permission management access", () => {
    const html = renderToStaticMarkup(
      <PermissionsListView canManage permissions={permissions} />,
    );

    expect(html).toContain("Crea permesso");
    expect(html).toContain("Archivia Visualizza overview");
  });

  it("hides management actions while keeping the permissions list visible", () => {
    const html = renderToStaticMarkup(
      <PermissionsListView canManage={false} permissions={permissions} />,
    );

    expect(html).toContain("Visualizza overview");
    expect(html).not.toContain("Crea permesso");
    expect(html).not.toContain("Archivia Visualizza overview");
  });
});
