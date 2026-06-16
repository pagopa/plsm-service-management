import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/auth/server", () => ({
  requireServerSession: jest.fn().mockResolvedValue({ email: "test@test.com", name: "Test User" }),
}));

jest.mock("@/components/auth/clientPageGuard", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/layout/sidebar/app-sidebar", () => ({
  AppSidebar: () => <aside data-testid="app-sidebar">sidebar</aside>,
}));

jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="sidebar-provider" className={className}>
      {children}
    </div>
  ),
  SidebarInset: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="sidebar-inset" className={className}>
      {children}
    </div>
  ),
}));

let DashboardLayout: typeof import("@/app/dashboard/layout").default;

beforeAll(async () => {
  ({ default: DashboardLayout } = await import("@/app/dashboard/layout"));
});

describe("DashboardLayout", () => {
  it("keeps the shared sidebar shell without extra bottom padding now that the footer is in document flow", async () => {
    const element = await DashboardLayout({
      children: <section>dashboard content</section>,
    });
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("flex-1");
    expect(html).toContain("app-sidebar");
    expect(html).not.toContain("pb-[var(--app-footer-clearance)]");
  });
});
