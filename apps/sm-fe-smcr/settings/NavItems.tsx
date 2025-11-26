import { usePathname } from "next/navigation";

import { Home, Settings } from "lucide-react";

export const NavItems = () => {
  const pathname = usePathname();

  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav);
  }

  return [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home size={20} />,
      label: "La tua dashboard",
      active: pathname === "/dashboard",
      position: "top",
      teams: [],
      isPublic: false,
    },
    {
      name: "Onboarding",
      href: "/dashboard/onboarding",
      icon: <Settings size={20} />,
      label: "Gestisci gli onboarding",
      active: isNavItemActive(pathname, "/dashboard/onboarding"),
      position: "top",
      teams: ["Account"],
      isPublic: false,
    },

    {
      name: "Admin",
      href: "/dashboard/admin/organizations",
      icon: <Settings size={20} />,
      label: "La pagina Admin",
      active: isNavItemActive(pathname, "/dashboard/admin/organizations"),
      position: "top",
      teams: ["Admin", "IOServiceManagement"],
      isPublic: true,
    },
  ];
};
