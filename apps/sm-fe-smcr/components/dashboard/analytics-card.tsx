import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function AnalyticsCard({
  children,
  label,
  bgColor,
  className,
}: {
  children: ReactNode;
  label: string;
  bgColor?: string;
  className?: string;
}) {
  return (
    <Card className={cn("pb-4 pt-0 gap-2", className)}>
      <CardHeader
        className="rounded-t-xl pt-2"
        style={bgColor ? { backgroundColor: bgColor } : {}}
      >
        <CardTitle className="text-black text-sm font-normal">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
