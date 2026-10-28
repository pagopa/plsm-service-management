"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasPermission } from "@/context/permissionsProvider";
import { cn } from "@/lib/utils";

export default function DashboardLoading() {
  const canReadCalls = useHasPermission("call.management.read");

  return (
    <main className="h-full w-full p-4 flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />

      <section className="grid grid-cols-5 gap-4">
        {["IO", "Interop", "Send", "PagoPA", "Firma"].map((label) => (
          <Card key={label} className="pb-4 pt-0 gap-2">
            <CardHeader className="rounded-t-xl pt-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="inline-flex w-full items-center justify-between">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className={cn(
            "flex flex-col",
            canReadCalls ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          <CardHeader className="items-center pb-0 flex flex-col">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex flex-col items-center gap-4">
            <Skeleton className="aspect-square w-full max-h-[500px] max-w-[500px] rounded-full" />
            <div className="flex flex-wrap justify-center gap-6">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-4 w-14" />
              ))}
            </div>
          </CardContent>
        </Card>

        {canReadCalls && (
          <Card className="flex flex-col">
            <CardHeader className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-56 rounded-lg" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <div className="inline-flex w-full items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
