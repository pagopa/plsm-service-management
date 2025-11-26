import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

export function AnalyticsCard({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Card className="py-4 gap-2">
      <CardHeader className="">
        <CardTitle className="text-muted-foreground text-sm font-normal">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
