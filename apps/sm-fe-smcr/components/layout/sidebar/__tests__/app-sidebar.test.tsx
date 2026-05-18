import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/store/auth.store", () => ({
  __esModule: true,
  default: jest.fn((selector: (state: { user: unknown }) => unknown) =>
    selector({
      user: {
        teams: [{ slug: "core", name: "Core Team" }],
      },
    }),
  ),
}));

jest.mock("@/lib/protectedRoutes", () => ({
  protectedRoutes: [
    {
      title: "Dashboard",
      url: "/dashboard",
      sidebar: true,
      teamId: "core",
      requiredTeams: ["core"],
    },
  ],
}));

jest.mock("@/components/layout/nav-main", () => ({
  NavMain: ({ groups }: { groups: Array<{ teamId: string }> }) => (
    <div data-testid="nav-main">{JSON.stringify(groups)}</div>
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <aside className={className}>{children}</aside>,
  SidebarContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  SidebarFooter: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SidebarMenuItem: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("../sidebar-user", () => ({
  SidebarUser: () => <div>sidebar user</div>,
}));

jest.mock("../sidebar-header", () => ({
  TeamSwitcher: () => <div>team switcher</div>,
}));

import { AppSidebar } from "../app-sidebar";

describe("AppSidebar", () => {
  it("pins documentation to the bottom of the scrollable sidebar content with mt-auto", () => {
    const html = renderToStaticMarkup(<AppSidebar />);

    expect(html).toContain("mt-auto");
    expect(html).toContain("Documentation");
  });
});
