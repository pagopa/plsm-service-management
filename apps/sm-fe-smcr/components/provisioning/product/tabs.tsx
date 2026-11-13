import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  ServerIcon,
  UsersIcon,
} from "lucide-react";
import ContractTab from "./contract/contract-tab";
import GroupsTab from "./groups/groups-tab";
import OnboardingTab from "./onboarding/onboarding-tab";
import ServicesTab from "./services/services-tab";
import UsersTab from "./users/users-tab";
import DelegationsTab from "./delegations/delegations-tab";
import AggregatesTab from "./aggregates/aggregates-tab";
import { getUserGroups } from "@/lib/services/institution.service";
enum TABS {
  GROUPS = "groups",
  USERS = "users",
  CONTRACT = "contract",
  ONBOARDING = "onboarding",
  SERVICES = "services",
  DELEGATIONS = "delegactions",
  AGGREGATES = "aggregates",
}
type Props = {
  taxCode: string;
  institution: string;
  institutionDescription: string;
  product: string;
  onboarding: string;
  subunitCode?: string;
  isPNPG?: boolean;
  isAggregator?: boolean;
};
export default async function TabsSection({
  taxCode,
  institution,
  institutionDescription,
  product,
  onboarding,
  subunitCode,
  isPNPG = false,
  isAggregator = false,
}: Props) {
  // On fetch error keep the tab visible so GroupsTab can surface the error.
  const groups = isPNPG ? null : await getUserGroups({ institution });
  const showGroups =
    !isPNPG &&
    (groups?.error != null ||
      !groups?.data ||
      groups.data.content.some((item) => item.productId === product));
  const showServices = product === "prod-io";
  const showDelegations = product === "prod-pagopa";
  const showAggregates = isAggregator;

  return (
    <section className="flex h-[calc(100vh-64px)] flex-col min-h-0">
      <Tabs
        // Remount when a conditional tab toggles, so a hidden tab is never left selected.
        key={[
          showGroups ? "groups" : "no-groups",
          showServices ? "services" : "no-services",
          showDelegations ? "delegations" : "no-delegations",
          showAggregates ? "aggregates" : "no-aggregates",
        ].join("|")}
        defaultValue={showGroups ? TABS.GROUPS : TABS.USERS}
        className="flex flex-1 min-h-0 flex-col"
      >
        <ScrollArea>
          <TabsList className="mb-3">
            {showGroups && (
              <TabsTrigger value={TABS.GROUPS}>
                <LayoutDashboardIcon
                  className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                  aria-hidden="true"
                />
                Gruppi
              </TabsTrigger>
            )}

            <TabsTrigger value={TABS.USERS} className="group">
              <UsersIcon
                className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                aria-hidden="true"
              />
              Utenti
            </TabsTrigger>

            {!isPNPG && (
              <TabsTrigger value={TABS.CONTRACT} className="group">
                <FileTextIcon
                  className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                  aria-hidden="true"
                />
                Contratto
              </TabsTrigger>
            )}

            <TabsTrigger value={TABS.ONBOARDING} className="group">
              <ClipboardListIcon
                className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                aria-hidden="true"
              />
              Onboarding
            </TabsTrigger>

            {showServices && (
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
            {showDelegations && (
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
            {showAggregates && (
              <TabsTrigger value={TABS.AGGREGATES} className="group">
                <NetworkIcon
                  className="size-3.5 -ms-0.5 me-1.5 opacity-60"
                  aria-hidden="true"
                />
                Enti Aggregati
              </TabsTrigger>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {showGroups && (
          <TabsContent value={TABS.GROUPS} className="h-full">
            <GroupsTab institution={institution} product={product} />
          </TabsContent>
        )}

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

        {!isPNPG && (
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
        )}
        <TabsContent
          value={TABS.ONBOARDING}
          className="flex flex-1 min-h-0 flex-col"
        >
          <OnboardingTab taxCode={taxCode} subunitCode={subunitCode} />
        </TabsContent>
        {showServices && (
          <TabsContent
            value={TABS.SERVICES}
            className="flex flex-1 min-h-0 flex-col"
          >
            <ServicesTab
              institution={institutionDescription}
              taxCode={taxCode}
            />
          </TabsContent>
        )}
        {showDelegations && (
          <TabsContent
            value={TABS.DELEGATIONS}
            className="flex flex-1 min-h-0 flex-col"
          >
            <DelegationsTab
              institutionId={institution}
              institutionName={institutionDescription}
            />
          </TabsContent>
        )}
        {showAggregates && (
          <TabsContent
            value={TABS.AGGREGATES}
            className="flex flex-1 min-h-0 flex-col"
          >
            <AggregatesTab institutionId={institution} product={product} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
