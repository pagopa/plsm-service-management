// Spostiamo in app/config?

import {
  BotIcon,
  FolderIcon,
  LucideIcon,
  PhoneIcon,
  Search,
  Shield,
  SquareTerminal,
  TestTube2,
  TextCursorInput,
  Users,
  UsersIcon,
} from "lucide-react";

export interface ProtectedRoute {
  label: string;
  path: string;
  requiredTeams?: string[];
  icon?: LucideIcon;
  sidebar?: boolean;
  teamId?: string;
}

export const protectedRoutes: ProtectedRoute[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    requiredTeams: [],
    sidebar: true,
    icon: SquareTerminal,
    teamId: "core",
  },
  {
    label: "Overview",
    path: "/dashboard/overview",
    requiredTeams: ["service-management"],
    icon: UsersIcon,
    sidebar: true,
    teamId: "service-management",
  },
  {
    label: "PNPG",
    path: "/dashboard/pnpg",
    requiredTeams: ["service-management"],
    icon: UsersIcon,
    sidebar: true,
    teamId: "service-management",
  },
  {
    label: "Firma con io",
    path: "/dashboard/firma-con-io",
    requiredTeams: ["service-management"],
    icon: UsersIcon,
    sidebar: true,
    teamId: "service-management",
  },
  {
    label: "Onboarding",
    path: "/dashboard/onboarding",
    requiredTeams: ["service-management"],
    sidebar: true,
    icon: TextCursorInput,
    teamId: "service-management",
  },
  {
    label: "PDA",
    path: "/dashboard/pda",
    requiredTeams: ["service-management"],
    sidebar: true,
    icon: Search,
    teamId: "service-management",
  },
  {
    label: "Call Management",
    path: "/dashboard/call-management",
    requiredTeams: ["service-management"],
    sidebar: true,
    icon: PhoneIcon,
    teamId: "service-management",
  },
  {
    label: "Portale Fatturazione",
    path: "/dashboard/portale-fatturazione",
    requiredTeams: ["service-management"],
    sidebar: true,
    icon: FolderIcon,
    teamId: "service-management",
  },
  {
    label: "Admin",
    path: "/dashboard/admin",
    requiredTeams: ["admin"],
    sidebar: true,
    icon: Shield,
    teamId: "admin",
  },
  {
    label: "Teams",
    path: "/dashboard/teams",
    requiredTeams: ["admin"],
    sidebar: true,
    icon: Users,
    teamId: "admin",
  },
  {
    label: "Membri",
    path: "/dashboard/members",
    requiredTeams: ["admin"],
    sidebar: true,
    icon: Users,
    teamId: "admin",
  },
  {
    label: "Ask Me Anything",
    path: "/dashboard/ask-me-anything",
    requiredTeams: ["admin"],
    sidebar: true,
    icon: BotIcon,
    teamId: "admin",
  },
  {
    label: "Testing",
    path: "/dashboard/testing",
    icon: TestTube2,
    sidebar: true,
    requiredTeams: ["admin"],
    teamId: "admin",
  },
];
