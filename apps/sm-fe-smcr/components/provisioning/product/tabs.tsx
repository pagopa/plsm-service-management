import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  FileTextIcon,
  LayoutDashboardIcon,
  ServerIcon,
  UsersIcon,
} from "lucide-react";
import ContractTab from "./contract/contract-tab";
import GroupsTab from "./groups/groups-tab";
import ServicesTab from "./services/services-tab";
import UsersTab from "./users/users-tab";
import DelegationsTab from "./delegations/delegations-tab";

enum TABS {
  GROUPS = "groups",
  USERS = "users",
  CONTRACT = "contract",
  SERVICES = "services",
  DELEGATIONS = "delegactions",
}

type Props = {
  taxCode: string;
  institution: string;
  institutionDescription: string;
  product: string;
  onboarding: string;
  isPNPG?: boolean;
};

export default function TabsSection({
  taxCode,
  institution,
  institutionDescription,
  product,
  isPNPG = false,
}: Props) {
  return (
    <section className="flex h-[calc(100vh-64px)] flex-col min-h-0">
      <Tabs defaultValue={TABS.USERS} className="flex flex-1 min-h-0 flex-col">
        <ScrollArea>
          <TabsList className="mb-3">
            <TabsTrigger value={TABS.USERS} className="group">
              <UsersIcon
                className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                aria-hidden="true"
              />
              Utenti
            </TabsTrigger>

            {product === "prod-io" && (
              <TabsTrigger
                value={TABS.SERVICES}
                className="group bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-500 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <ServerIcon
                  className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                  aria-hidden="true"
                />
                Servizi
              </TabsTrigger>
            )}

            {product === "prod-pagopa" && (
              <TabsTrigger
                value={TABS.DELEGATIONS}
                className="group bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-500 data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                <ServerIcon
                  className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                  aria-hidden="true"
                />
                Deleghe
              </TabsTrigger>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent
          value={TABS.USERS}
          className="flex flex-1 min-h-0 flex-col"
        >
          <UsersTab
            taxCode={taxCode}
            institution={institution}
            product={product}
            isPNPG={isPNPG}
          />
        </TabsContent>

        <TabsContent
          value={TABS.SERVICES}
          className="flex flex-1 min-h-0 flex-col"
        >
          <ServicesTab institution={institutionDescription} taxCode={taxCode} />
        </TabsContent>

        <TabsContent
          value={TABS.DELEGATIONS}
          className="flex flex-1 min-h-0 flex-col"
        >
          <DelegationsTab
            institutionId={institution}
            institutionName={institutionDescription}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
