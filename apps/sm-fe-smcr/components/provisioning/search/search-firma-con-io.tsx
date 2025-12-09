"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { SignatureFormSchema } from "@/lib/services/firma-con-io.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@repo/ui";
import { useLocalStorage } from "@uidotdev/usehooks";
import { ArrowRightIcon, CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

export default function SearchFirmaConIo() {
  const router = useRouter();
  const [history] = useLocalStorage<{
    items: Array<{ signature_request: string; fiscal_code: string }>;
  }>(`institution-history-firma-con-io`, {
    items: [],
  });

  const form = useForm<z.infer<typeof SignatureFormSchema>>({
    defaultValues: {
      signature_request: "",
      fiscal_code: "",
    },
    resolver: zodResolver(SignatureFormSchema),
  });

  const handleSubmit = () => {
    router.push(
      `/dashboard/firma-con-io/${form.getValues("signature_request")}/${form.getValues("fiscal_code")}`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form
          className="flex flex-col gap-6 w-full"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            control={form.control}
            name="signature_request"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature request</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Signature request"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fiscal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fiscale</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Codice Fiscale"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button variant="pagopaprimary" type="submit">
            Cerca <CornerDownLeft className="size-3.5 opacity-60" />
          </Button>
        </form>
      </Form>
      {history.items.length > 0 && (
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-bold p-2">
            Ricerche recenti
          </p>

          <div className="flex flex-col gap-0.5">
            {history.items.map((item) => (
              <HistoryItem key={item.signature_request} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryItem({
  signature_request,
  fiscal_code,
}: {
  signature_request: string;
  fiscal_code: string;
}) {
  return (
    <Link
      id={signature_request}
      href={`/dashboard/firma-con-io/${signature_request}/${fiscal_code}`}
      className="inline-flex items-center justify-between w-full cursor-pointer rounded-md p-2 group hover:bg-neutral-50"
    >
      <div className="flex flex-row gap-10 w-full">
        <div className="flex flex-col w-[50%]">
          <p className="font-normal">Signature Request:</p>
          <p className="text-muted-foreground text-sm">{signature_request}</p>
        </div>
        <div className="flex flex-col w-[50%]">
          <p className="font-normal">Codice Fiscale:</p>
          <p className="text-muted-foreground text-sm">{fiscal_code}</p>
        </div>
      </div>

      <ArrowRightIcon className="text-muted-foreground size-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </Link>
  );
}
