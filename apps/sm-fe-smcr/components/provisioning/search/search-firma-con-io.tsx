"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SignatureFormSchema } from "@/lib/services/firma-con-io.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SignatureIdentifierMode } from "@/lib/services/firma-con-io.schema";
import { useLocalStorage } from "@uidotdev/usehooks";
import { ArrowRightIcon, CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

export default function SearchFirmaConIo() {
  const router = useRouter();
  const [history] = useLocalStorage<{
    items: Array<{
      signature_request: string;
      fiscal_code?: string;
      vat_number?: string;
    }>;
  }>(`institution-history-firma-con-io`, {
    items: [],
  });

  const form = useForm<z.infer<typeof SignatureFormSchema>>({
    defaultValues: {
      signature_request: "",
      identifier_mode: "fiscal_code" satisfies SignatureIdentifierMode,
      fiscal_code: "",
      vat_number: "",
    },
    resolver: zodResolver(SignatureFormSchema),
  });

  const handleSubmit = () => {
    const sig = form.getValues("signature_request").trim();
    const mode = form.getValues("identifier_mode");
    const qs = new URLSearchParams();
    if (mode === "fiscal_code") {
      qs.set("fiscal_code", form.getValues("fiscal_code").trim());
    } else {
      qs.set("vat_number", form.getValues("vat_number").trim());
    }
    router.push(`/dashboard/firma-con-io/${sig}?${qs.toString()}`);
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
                    placeholder="ID signature request"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 p-4 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Scegli se cercare con il{" "}
              <span className="font-medium text-foreground">
                codice fiscale
              </span>{" "}
              o con la{" "}
              <span className="font-medium text-foreground">
                partita IVA dell&apos;ente
              </span>
            </p>
            <FormField
              control={form.control}
              name="identifier_mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <Tabs
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v as SignatureIdentifierMode);
                      form.clearErrors(["fiscal_code", "vat_number"]);
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid h-auto w-full grid-cols-2 p-1">
                      <TabsTrigger value="fiscal_code" className="py-2">
                        Codice fiscale
                      </TabsTrigger>
                      <TabsTrigger value="vat_number" className="py-2">
                        Partita IVA
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="fiscal_code"
                      className="mt-4 outline-none data-[state=inactive]:hidden"
                      forceMount
                    >
                      <FormField
                        control={form.control}
                        name="fiscal_code"
                        render={({ field: fcField }) => (
                          <FormItem>
                            <FormLabel>Codice fiscale</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="16 caratteri"
                                className="w-full bg-white"
                                autoComplete="off"
                                {...fcField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent
                      value="vat_number"
                      className="mt-4 outline-none data-[state=inactive]:hidden"
                      forceMount
                    >
                      <FormField
                        control={form.control}
                        name="vat_number"
                        render={({ field: vatField }) => (
                          <FormItem>
                            <FormLabel>Partita IVA</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={"11 cifre"}
                                className="w-full bg-white"
                                inputMode="numeric"
                                autoComplete="off"
                                {...vatField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </FormItem>
              )}
            />
          </div>
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

          <div className="flex flex-col gap-0.5 max-h-52 overflow-auto">
            {history.items.map((item, index) => (
              <HistoryItem
                key={`${item.signature_request}-${item.fiscal_code ?? ""}-${item.vat_number ?? ""}-${index}`}
                {...item}
              />
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
  vat_number,
}: {
  signature_request: string;
  fiscal_code?: string;
  vat_number?: string;
}) {
  const qs = new URLSearchParams();
  if (fiscal_code) qs.set("fiscal_code", fiscal_code);
  if (vat_number) qs.set("vat_number", vat_number);

  return (
    <Link
      id={signature_request}
      href={`/dashboard/firma-con-io/${signature_request}?${qs.toString()}`}
      className="inline-flex items-center justify-between w-full cursor-pointer rounded-md p-2 group hover:bg-neutral-50"
    >
      <div className="flex flex-row gap-10 w-full">
        <div className="flex flex-col w-[50%]">
          <p className="font-normal">Signature request (id):</p>
          <p className="text-muted-foreground text-sm">{signature_request}</p>
        </div>
        <div className="flex flex-col w-[50%]">
          <p className="font-normal">Identificativo:</p>
          <p className="text-muted-foreground text-sm">
            {fiscal_code ? (
              <>C.F. {fiscal_code}</>
            ) : vat_number ? (
              <>P.IVA {vat_number}</>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      <ArrowRightIcon className="text-muted-foreground size-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </Link>
  );
}
