import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PermissionDeniedProps = {
  feature: string;
};

export function PermissionDenied({ feature }: PermissionDeniedProps) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4">
      <Card className="w-full max-w-lg p-8 text-center shadow-sm">
        <div className="flex flex-col items-center gap-5">
          <div className="rounded-full bg-amber-50 p-3 text-amber-700">
            <ShieldAlert aria-hidden="true" className="size-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Accesso non disponibile</h1>
            <p className="text-sm text-muted-foreground">
              Non disponi dell&apos;autorizzazione necessaria per accedere a {feature}.
              Se ritieni sia un errore, contatta un amministratore.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/dashboard">Torna alla dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
