import {
  ScrollArea,
  ScrollBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
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
  onboarding,
  isPNPG = false,
}: Props) {
  return (
    <section className="flex h-[calc(100vh-64px)] flex-col min-h-0">
      <Tabs defaultValue={TABS.GROUPS} className="flex flex-1 min-h-0 flex-col">
        <ScrollArea>
          <TabsList className="mb-3">
            <TabsTrigger value={TABS.GROUPS}>
              <LayoutDashboardIcon
                className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                aria-hidden="true"
              />
              Gruppi
            </TabsTrigger>

            <TabsTrigger value={TABS.USERS} className="group">
              <UsersIcon
                className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                aria-hidden="true"
              />
              Utenti
            </TabsTrigger>

            <TabsTrigger value={TABS.CONTRACT} className="group">
              <FileTextIcon
                className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                aria-hidden="true"
              />
              Contratto
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

        <TabsContent value={TABS.GROUPS} className="h-full">
          <GroupsTab institution={institution} product={product} />
        </TabsContent>

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
          value={TABS.CONTRACT}
          className="flex flex-1 min-h-0 flex-col"
        >
          <ContractTab
            institution={institution}
            product={product}
            onboarding={onboarding}
            institutionDescription={institutionDescription}
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
