import ClientPageGuard from "@/components/auth/clientPageGuard";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
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
