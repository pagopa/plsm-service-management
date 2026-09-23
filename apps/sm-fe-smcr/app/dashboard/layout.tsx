import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { dashboardNavigation } from "@/lib/dashboard-navigation";
import {
  filterDashboardNavigation,
  getCurrentPermissionCodes,
} from "@/lib/auth/dashboard-access";
import { requireServerSession } from "@/lib/auth/server";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requireServerSession("/dashboard");

  const permissionCodes = await getCurrentPermissionCodes();
  const navigation = filterDashboardNavigation(
    dashboardNavigation,
    permissionCodes,
  );

  return (
    <SidebarProvider className="flex-1">
      <AppSidebar sections={navigation} variant="inset" />

      <SidebarInset className="!m-0 min-w-0">
        <main className="min-w-0 flex-1 bg-bg-dashboard px-1 pb-10 md:px-0 md:pb-12">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
