import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/components/layout/nav-main", () => ({
  NavMain: ({ sections }: { sections: Array<{ label: string }> }) => (
    <div data-testid="nav-main">{sections.map((section) => section.label).join(",")}</div>
  ),
}));

jest.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

import { AppSidebar } from "../app-sidebar";

describe("AppSidebar", () => {
  it("renders only the server-filtered navigation passed through props", () => {
    const html = renderToStaticMarkup(
      <AppSidebar sections={[{ label: "Core", items: [] }]} />,
    );

    expect(html).toContain("Core");
    expect(html).not.toContain("Admin");
    expect(html).toContain("mt-auto");
    expect(html).toContain("Documentation");
  });
});
