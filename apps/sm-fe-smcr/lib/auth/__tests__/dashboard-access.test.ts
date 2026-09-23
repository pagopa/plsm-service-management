jest.mock("server-only", () => ({}));

import { filterDashboardNavigation } from "../dashboard-access";
import {
  dashboardNavigation,
  type DashboardNavigationItem,
  type DashboardNavigationSection,
} from "@/lib/dashboard-navigation";

const navigation: DashboardNavigationSection[] = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Overview", href: "/dashboard/overview", permission: "overview.read" },
    ],
  },
  {
    label: "Service Management",
    items: [
      {
        label: "Firma",
        children: [
          { label: "Firma con IO", href: "/dashboard/firma-con-io", permission: "firma.io.read" },
          { label: "Firme per ente", href: "/dashboard/firme-per-ente", permission: "firma.ente.read" },
        ],
      },
    ],
  },
  {
    label: "Admin",
    items: [{ label: "Logs", href: "/dashboard/logs", permission: "logs.read" }],
  },
];

function getNavigationHrefs(items: DashboardNavigationItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.href ? [item.href] : []),
    ...(item.children ? getNavigationHrefs(item.children) : []),
  ]);
}

describe("filterDashboardNavigation", () => {
  it("keeps public items and permitted children while removing empty sections", () => {
    const filtered = filterDashboardNavigation(
      navigation,
      new Set(["overview.read", "firma.io.read"]),
    );

    expect(filtered).toEqual([
      {
        label: "Core",
        items: [
          { label: "Dashboard", href: "/dashboard" },
          {
            label: "Overview",
            href: "/dashboard/overview",
            permission: "overview.read",
          },
        ],
      },
      {
        label: "Service Management",
        items: [
          {
            label: "Firma",
            children: [
              {
                label: "Firma con IO",
                href: "/dashboard/firma-con-io",
                permission: "firma.io.read",
              },
            ],
          },
        ],
      },
    ]);
  });

  it.each([
    {
      permissions: new Set(["wallet.read"]),
      visibleHref: "/dashboard/wallet",
      hiddenHref: "/dashboard/wallet/eservice-templates",
    },
    {
      permissions: new Set(["wallet.templates.read"]),
      visibleHref: "/dashboard/wallet/eservice-templates",
      hiddenHref: "/dashboard/wallet",
    },
  ])(
    "keeps only the wallet navigation item granted by $permissions",
    ({ permissions, visibleHref, hiddenHref }) => {
      const filtered = filterDashboardNavigation(
        dashboardNavigation,
        permissions,
      );
      const hrefs = getNavigationHrefs(
        filtered.flatMap((section) => section.items),
      );

      expect(hrefs).toContain(visibleHref);
      expect(hrefs).not.toContain(hiddenHref);
    },
  );
});
