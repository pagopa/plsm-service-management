"use client";

import Link from "next/link";
import ReportDialog from "../core/report-dialog";
import { Card } from "../ui/card";
import { CornerDownLeft, X } from "lucide-react";
import { Button } from "@repo/ui";
import { useEffect, useRef } from "react";

export const ErrorBase = ({
  title,
  text1,
  text2,
  route,
}: {
  title: string;
  text1: string;
  text2?: string;
  route: "overview" | "pnpg" | "firma-con-io";
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, []);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
      <Card className="p-4 min-w-[600px] min-h-[300px]">
        <div className="flex flex-col justify-center h-full w-full gap-10">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center justify-center gap-1">
              <X className="text-red-600 w-12 h-12" />
              <p className="font-semibold text-2xl">{title}</p>
            </div>
            <p className="text-md">
              {text1}
              <br />
              {text2}
            </p>
          </div>

          <div className="flex flex-row items-center justify-center gap-2">
            <ReportDialog />

            <Button size="lg" variant="pagopaprimary" ref={buttonRef} asChild>
              <Link href={`/dashboard/${route}`}>
                Nuova ricerca <CornerDownLeft className="size-3.5 opacity-60" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
