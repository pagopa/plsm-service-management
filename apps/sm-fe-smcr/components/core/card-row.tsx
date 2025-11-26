import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CardRow({
  children,
  label,
  value,
  type = "string",
}: {
  children: ReactNode;
  label: string;
  value: string;
  type?: "string" | "link";
}) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-4">
      <div className="flex items-center gap-2 text-muted-foreground [&>svg]:size-3.5">
        {children}
        <span className="text-sm">{label}</span>
      </div>

      {type === "string" && <p className="break-words">{value}</p>}
      {type === "link" && (
        <Button
          variant="link"
          asChild
          className="p-0 m-0 items-center justify-start w-min h-min py-0.5"
        >
          <Link href={value} target="_blank">
            Apri Link
          </Link>
        </Button>
      )}
    </div>
  );
}
