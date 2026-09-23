export type NavigationIcon =
  | "activity"
  | "file-signature"
  | "folder"
  | "key"
  | "phone"
  | "search"
  | "shield-check"
  | "smartphone"
  | "terminal"
  | "text-input"
  | "users"
  | "wallet";

export type DashboardNavigationItem = {
  label: string;
  href?: string;
  icon?: NavigationIcon;
  permission?: string;
  children?: DashboardNavigationItem[];
};

export type DashboardNavigationSection = {
  label: string;
  items: DashboardNavigationItem[];
};

export const dashboardNavigation: DashboardNavigationSection[] = [
  {
    label: "Core",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "terminal",
      },
      {
        label: "Overview",
        href: "/dashboard/overview",
        icon: "users",
        permission: "overview.read",
      },
    ],
  },
  {
    label: "Service Management",
    items: [
      {
        label: "PNPG",
        href: "/dashboard/pnpg",
        icon: "users",
        permission: "pnpg.read",
      },
      {
        label: "Firma",
        icon: "file-signature",
        children: [
          {
            label: "Firma con IO",
            href: "/dashboard/firma-con-io",
            permission: "firma.io.read",
          },
          {
            label: "Firme per ente",
            href: "/dashboard/firme-per-ente",
            permission: "firma.ente.read",
          },
          {
            label: "Verifica firma",
            href: "/dashboard/verifica-firma",
            permission: "firma.verifica.read",
          },
        ],
      },
      {
        label: "Wallet",
        icon: "wallet",
        children: [
          {
            label: "E-Service Wallet",
            href: "/dashboard/wallet",
            permission: "wallet.read",
          },
          {
            label: "Template e-service",
            href: "/dashboard/wallet/eservice-templates",
            permission: "wallet.templates.read",
          },
        ],
      },
      {
        label: "Utenze IO",
        href: "/dashboard/verifica-utenze-io",
        icon: "smartphone",
        permission: "utenze.io.read",
      },
      {
        label: "Certificati",
        href: "/dashboard/certificati",
        icon: "shield-check",
        permission: "certificati.read",
      },
      {
        label: "Onboarding",
        href: "/dashboard/onboarding",
        icon: "text-input",
        permission: "onboarding.read",
      },
      {
        label: "PDA",
        href: "/dashboard/pda",
        icon: "search",
        permission: "pda.read",
      },
      {
        label: "Call Management",
        href: "/dashboard/call-management",
        icon: "phone",
        permission: "call.management.read",
      },
      {
        label: "Portale Fatturazione",
        href: "/dashboard/portale-fatturazione",
        icon: "folder",
        permission: "portale.fatturazione.read",
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        label: "Teams",
        href: "/dashboard/teams",
        icon: "users",
        permission: "teams.manage",
      },
      {
        label: "Membri",
        href: "/dashboard/members",
        icon: "users",
        permission: "members.manage",
      },
      {
        label: "Permessi",
        href: "/dashboard/permissions",
        icon: "key",
        permission: "permissions.manage",
      },
      {
        label: "Logs",
        href: "/dashboard/logs",
        icon: "activity",
        permission: "logs.read",
      },
    ],
  },
];
