import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

export function AnalyticsCard({
  children,
  label,
  bgColor,
}: {
  children: ReactNode;
  label: string;
  bgColor?: string;
}) {
  return (
    <Card className="pb-4 pt-0 gap-2">
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
