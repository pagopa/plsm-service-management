import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {["IO", "Interop", "Send", "PagoPA", "Firma"].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-20" />
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="mt-4 h-3 w-32" />
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-4 h-[500px] w-full" />
        <div className="w-full flex flex-row justify-center mt-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-6">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-4 w-10" />
              ))}
            </div>
            <div className="flex flex-row gap-6 justify-evenly">
              {[...Array(2)].map((_, index) => (
                <Skeleton key={index} className="h-4 w-10" />
              ))}
            </div>
          </div>
        </div>
        {/* <div className="mt-6 flex justify-between text-xs text-muted-foreground">
          {[...Array(15)].map((_, index) => (
            <Skeleton key={index} className="h-4 w-10" />
          ))}
        </div> */}
      </section>
    </div>
  );
}
