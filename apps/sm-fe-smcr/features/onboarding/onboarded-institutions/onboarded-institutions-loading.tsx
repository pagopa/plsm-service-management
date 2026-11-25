import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export function OnboardedInstitutionsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Enti onboardati</h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          Onboarding attivi per data di attivazione, prodotto ed ente.
        </p>
      </header>

      <Card className="gap-0 overflow-hidden border py-0 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner />
            <span>Caricamento enti onboardati…</span>
          </div>
          <div className="space-y-2 rounded-md border p-3">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
