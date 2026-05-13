import ClientPageGuard from "@/components/auth/clientPageGuard";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider className="min-h-0 flex-1">
      <AppSidebar variant="inset" />

      <SidebarInset className="!m-0">
        <ClientPageGuard>
          <main className="h-full bg-bg-dashboard px-1 pb-[var(--app-footer-clearance)] md:px-0">
            {children}
          </main>
        </ClientPageGuard>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
