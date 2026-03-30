"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PRODUCT_CARDS } from "@/lib/constants/dashboard-products";
import { getInstitutionWithSubunits } from "@/lib/services/institution.service";
import type { Institution } from "@/lib/services/institution.service";
// import { createMeetingAction } from "@/lib/actions/call-management.action";
import {
  ArrowRightIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCrmFormDefaultValues,
  crmFormSchema,
  tipologiaReferenteValues,
  type CrmFormSchema,
} from "./crm-form-schema";
import {
  createMeetingAction,
  CreateMeetingInput,
  type TipologiaReferente,
} from "@/lib/actions/call-management.action";

const TIPOLOGIA_OPTIONS: { value: TipologiaReferente; label: string }[] =
  tipologiaReferenteValues.map((value) => ({
    value,
    label: value,
  }));

function toIsoDateTime(dateStr: string, timeStr: string): string {
  const normalized = timeStr.length <= 5 ? `${timeStr}:00` : timeStr;
  const local = `${dateStr}T${normalized}`;
  return new Date(local).toISOString();
}

export default function CRMForm() {
  const [fiscalCode, setFiscalCode] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searching, setSearching] = useState(false);

  const form = useForm<CrmFormSchema>({
    resolver: zodResolver(crmFormSchema),
    mode: "all",
    defaultValues: getCrmFormDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "partecipanti",
  });

  const handleSearch = async () => {
    const code = fiscalCode.trim();
    if (!code) {
      toast.error("Inserire un codice fiscale");
      return;
    }
    setSearching(true);
    setInstitutions([]);
    form.setValue("institutionIdSelfcare", "");
    try {
      const result = await getInstitutionWithSubunits(code);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setInstitutions(result.data);
      if (result.data.length === 1 && result.data[0]) {
        form.setValue("institutionIdSelfcare", result.data[0].id);
      }
    } finally {
      setSearching(false);
    }
  };

  const addParticipant = () => {
    append({
      nome: "",
      cognome: "",
      email: "",
      tipologiaReferente: "TECNICO",
    });
  };

  const onSubmit = async (values: CrmFormSchema) => {
    const partecipanti = values.partecipanti
      .filter((p) => p.nome.trim() && p.cognome.trim())
      .map((p) => ({
        email: p.email?.trim() || undefined,
        nome: p.nome!.trim(),
        cognome: p.cognome!.trim(),
        tipologiaReferente: p.tipologiaReferente,
      }));
    if (partecipanti.length === 0) {
      toast.error("Aggiungi almeno un partecipante con nome e cognome");
      return;
    }
    const payLoad: CreateMeetingInput = {
      dynamicsEnvironment: values.dynamicsEnvironment,
      institutionIdSelfcare: values.institutionIdSelfcare,
      productIdSelfcare: values.productId,
      partecipanti,
      subject: values.subject,
      scheduledstart: toIsoDateTime(values.startDate, values.startTime),
      scheduledend: toIsoDateTime(values.endDate, values.endTime),
      location: values.location?.trim() || undefined,
      description: values.description?.trim() || undefined,
      nextstep: values.nextstep?.trim() || undefined,
      dataProssimoContatto: values.dataProssimoContatto || undefined,
      oggettoDelContatto: values.oggettoDelContatto?.trim() || undefined,
      enableCreateContact: values.enableCreateContact,
      enableGrantAccess: values.enableGrantAccess,
      dryRun: values.dryRun,
    };
    console.log("payLoad", payLoad);
    const result = await createMeetingAction(payLoad);

    if (result.success) {
      toast.success(result.message ?? "Appuntamento creato con successo");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-full max-w-2xl"
      >
        <FieldSet className="pt-4">
          <FieldGroup>
            <FormField
              control={form.control}
              name="dynamicsEnvironment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="dynamics-environment">Ambiente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        id="dynamics-environment"
                        className="w-full"
                      >
                        <SelectValue placeholder="Seleziona ambiente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PROD">PROD</SelectItem>
                      <SelectItem value="UAT">UAT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="subject">Oggetto</FormLabel>
                  <FormControl>
                    <Input
                      id="subject"
                      placeholder="Oggetto riunione"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="startDate">Data Inizio</FormLabel>
                    <FormControl>
                      <Input id="startDate" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="startTime">Ora Inizio</FormLabel>
                    <FormControl>
                      <Input id="startTime" type="time" step={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="endDate">Data Fine</FormLabel>
                    <FormControl>
                      <Input id="endDate" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="endTime">Ora Fine</FormLabel>
                    <FormControl>
                      <Input id="endTime" type="time" step={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="product">Prodotto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="product" className="w-full">
                        <SelectValue placeholder="Seleziona prodotto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_CARDS.map(({ label, productId: id }) => (
                        <SelectItem key={id} value={id}>
                          {label} ({id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="fiscalCode">Cerca Istituzione</Label>
                <Input
                  id="fiscalCode"
                  value={fiscalCode}
                  onChange={(e) => setFiscalCode(e.target.value)}
                  placeholder="Inserisci Codice Fiscale..."
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleSearch())
                  }
                />
              </div>
              <Button
                type="button"
                variant="default"
                onClick={handleSearch}
                disabled={searching}
                className="shrink-0"
              >
                {searching ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <ArrowRightIcon className="size-4" />
                )}
                Cerca
              </Button>
            </div>

            <FormField
              control={form.control}
              name="institutionIdSelfcare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="institution">
                    Seleziona Istituzione
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={institutions.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger id="institution" className="w-full">
                        <SelectValue placeholder="Seleziona Istituzione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.description ?? inst.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Elenco Partecipanti</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParticipant}
                  className="gap-1"
                >
                  <PlusIcon className="size-4" />
                  Aggiungi Partecipante
                </Button>
              </div>
              {form.formState.errors.partecipanti?.message && (
                <p className="text-destructive text-sm mb-2">
                  {form.formState.errors.partecipanti.message}
                </p>
              )}
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Nome</th>
                      <th className="text-left p-2 font-medium">Cognome</th>
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">
                        Tipologia Referente
                      </th>
                      <th className="w-10 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b last:border-0">
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`partecipanti.${index}.nome`}
                            render={({ field: f }) => (
                              <FormControl>
                                <Input
                                  placeholder="Nome"
                                  className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
                                  {...f}
                                />
                              </FormControl>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`partecipanti.${index}.cognome`}
                            render={({ field: f }) => (
                              <FormControl>
                                <Input
                                  placeholder="Cognome"
                                  className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
                                  {...f}
                                />
                              </FormControl>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`partecipanti.${index}.email`}
                            render={({ field: f }) => (
                              <>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="email@esempio.it"
                                    className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
                                    {...f}
                                  />
                                </FormControl>
                                {form.formState.errors.partecipanti?.[index]
                                  ?.email && (
                                  <p className="text-destructive text-xs mt-0.5">
                                    {
                                      form.formState.errors.partecipanti[index]
                                        ?.email?.message
                                    }
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`partecipanti.${index}.tipologiaReferente`}
                            render={({ field: f }) => (
                              <FormControl>
                                <Select
                                  onValueChange={f.onChange}
                                  value={f.value}
                                >
                                  <SelectTrigger className="h-8 border-0 bg-transparent shadow-none w-full min-w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIPOLOGIA_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <FormField
              control={form.control}
              name="enableCreateContact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      id="enableCreateContact"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel
                      htmlFor="enableCreateContact"
                      className="cursor-pointer"
                    >
                      Abilita Creazione Contatto
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="description">Descrizione</FormLabel>
                  <FormControl>
                    <Textarea
                      id="description"
                      placeholder="Descrizione"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="location">Luogo</FormLabel>
                  <FormControl>
                    <Input
                      id="location"
                      placeholder="Es. Meet / Teams / sede"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextstep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="nextstep">Prossimi passi</FormLabel>
                  <FormControl>
                    <Textarea
                      id="nextstep"
                      placeholder="Azioni successive concordate"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataProssimoContatto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="dataProssimoContatto">
                      Data prossimo contatto
                    </FormLabel>
                    <FormControl>
                      <Input id="dataProssimoContatto" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oggettoDelContatto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="oggettoDelContatto">
                      Oggetto del contatto
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="oggettoDelContatto"
                        placeholder="Es. supporto integrazione"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="enableGrantAccess"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      id="enableGrantAccess"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel
                      htmlFor="enableGrantAccess"
                      className="cursor-pointer"
                    >
                      Abilita Grant Access
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dryRun"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      id="dryRun"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel htmlFor="dryRun" className="cursor-pointer">
                      Esegui in Dry Run
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </FieldGroup>
        </FieldSet>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : null}
          Crea appuntamento CRM
        </Button>
      </form>
    </Form>
  );
}
