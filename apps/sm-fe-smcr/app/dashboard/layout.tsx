import ClientPageGuard from "@/components/auth/clientPageGuard";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireServerSession } from "@/lib/auth/server";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  await requireServerSession("/dashboard");

  return (
    <SidebarProvider className="flex-1">
      <AppSidebar variant="inset" />

      <SidebarInset className="!m-0 min-w-0">
        <ClientPageGuard>
          <main className="min-w-0 flex-1 bg-bg-dashboard px-1 pb-10 md:px-0 md:pb-12">
            {children}
          </main>
        </ClientPageGuard>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
