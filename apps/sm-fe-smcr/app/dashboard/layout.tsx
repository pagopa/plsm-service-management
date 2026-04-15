import ClientPageGuard from "@/components/auth/clientPageGuard";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireServerSession } from "@/lib/auth/server";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requireServerSession("/dashboard");

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />

      <SidebarInset className="!m-0">
        <ClientPageGuard>
          <main className="h-full px-1 md:px-0 bg-bg-dashboard">
            {children}
          </main>
        </ClientPageGuard>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
