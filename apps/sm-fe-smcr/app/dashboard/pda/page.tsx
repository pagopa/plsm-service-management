import { SidebarTrigger } from "@/components/ui/sidebar";
import { TaxcodeList } from "@/features/pda/components/TaxcodeList";
import PDAData from "@/features/pda/data/pda.json";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <div className="w-full h-full flex flex-col max-h-screen">
      <header className="flex h-16 shrink-0 items-center border-b border-border gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="size-4" />

          <div className="bg-muted w-px h-4">
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                Dashboard
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>PDA</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <TaxcodeList data={PDAData} />
    </div>
  );
}
