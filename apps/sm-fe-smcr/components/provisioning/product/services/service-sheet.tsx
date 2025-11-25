import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Service } from "@/lib/services/services-messages.service";
import {
  EuroIcon,
  HashIcon,
  HistoryIcon,
  LandmarkIcon,
  LinkIcon,
  LockIcon,
  MailCheckIcon,
  MailIcon,
  PhoneIcon,
  TagsIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import MessagesCard from "./messages-card";

type Props = {
  children: ReactNode;
  service: Service;
};

export default function ServiceSheet({ children, service }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{service.name}</SheetTitle>
          <SheetDescription>{service.metadata.description}</SheetDescription>
        </SheetHeader>

        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
            <CardRow label="ID" value={service.id}>
              <HashIcon />
            </CardRow>

            <CardRow label="Email" value={service.metadata.email || "-"}>
              <MailIcon />
            </CardRow>

            <CardRow label="Phone" value={service.metadata.phone || "-"}>
              <PhoneIcon />
            </CardRow>

            <CardRow label="PEC" value={service.metadata.pec || "-"}>
              <MailCheckIcon />
            </CardRow>

            <CardRow label="Version" value={service.version.toString()}>
              <HistoryIcon />
            </CardRow>

            <CardRow label="Topic" value={service.topic || "-"}>
              <TagsIcon />
            </CardRow>

            <CardRow
              label="Max Allowed Payment"
              value={Intl.NumberFormat("it-IT").format(
                service.maxAllowedPaymentAmount,
              )}
            >
              <EuroIcon />
            </CardRow>

            <CardRow
              label="Recure Channels"
              value={service.requireSecureChannels ? "Si" : "No"}
            >
              <LockIcon />
            </CardRow>

            <CardRow
              label="Privacy"
              value={service.metadata.privacyUrl}
              type="link"
            >
              <LinkIcon />
            </CardRow>

            <CardRow label="Department Name" value={service.departmentName}>
              <LandmarkIcon />
            </CardRow>
          </div>

          <MessagesCard serviceId={service.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
