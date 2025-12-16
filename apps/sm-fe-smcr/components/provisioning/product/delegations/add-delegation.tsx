"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { addDelegationAction } from "@/lib/actions/delegation.action";
import {
  getInstitutionWithSubunits,
  Institution,
} from "@/lib/services/institution.service";
import { useDebounce } from "@uidotdev/usehooks";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  institutionId: string;
  institutionName: string;
};

const regex = /^\d{11}$/;
const productId = "prod-pagopa";
const type = "PT";

export default function AddDelegation({
  institutionId,
  institutionName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [taxCodeTo, setTaxCodeTo] = useState("");
  const taxCodeToDebounced = useDebounce(taxCodeTo, 250);
  const [institutionTo, setInstitutionTo] = useState<Institution | null>(null);
  const [institutionOptions, setInstitutionOptions] = useState<Institution[]>(
    [],
  );
  const [isFetchingInstitutionTo, setIsFetchingInstitutionTo] = useState(false);
  const [taxCodeToError, setTaxCodeToError] = useState<string | null>(null);
  const [state, action, isPending] = useActionState(addDelegationAction, {
    fields: {
      from: "",
      institutionFromName: "",
      to: "",
      institutionToName: "",
      productId,
      type,
    },
  });

  useEffect(() => {
    if (state.fields.taxCodeTo) {
      if (state.errors) {
        if (state.errors.root) {
          toast.error(
            state.errors.root || "Errore durante il salvataggio della delega.",
          );
        }
      } else {
        toast.success("Delega creata correttamente.");
        router.refresh();
        setOpen(false);
      }
    }
  }, [state]);

  useEffect(() => {
    setTaxCodeToError(null);
    setInstitutionOptions([]);
    setInstitutionTo(null);
    if (regex.test(taxCodeToDebounced)) {
      setIsFetchingInstitutionTo(true);
      getInstitutionWithSubunits(taxCodeToDebounced)
        .then(({ data }) => {
          if (!data.at(0)) {
            setTaxCodeToError(
              "Si è verificato un errore, controlla che il codice fiscale sia corretto.",
            );
            setInstitutionOptions([]);
            return;
          }

          setInstitutionOptions(data);
          setInstitutionTo(data.at(0) || null);
        })
        .catch((error) => {
          console.error(error);
          setTaxCodeToError("Si è verificato un errore, riprova più tardi.");
          setInstitutionTo(null);
          setInstitutionOptions([]);
        })
        .finally(() => {
          setIsFetchingInstitutionTo(false);
        });
    }
  }, [taxCodeToDebounced]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="pagopaprimary" size="sm">
          <PlusIcon className="size-3.5 opacity-60" />
          Aggiungi delega
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi delega</DialogTitle>
        </DialogHeader>

        <form action={action}>
          <input
            type="hidden"
            name="productId"
            value={state.fields.productId}
          />
          <input type="hidden" name="type" value={state.fields.type} />

          <FieldSet>
            <FieldGroup className="gap-2">
              <Field>
                <FieldLabel htmlFor="from">ID Ente delegante</FieldLabel>
                <Input
                  id="from"
                  name="from"
                  placeholder="ID delegante"
                  defaultValue={institutionId}
                  readOnly
                />
                {state.errors?.from && (
                  <FieldError>{state.errors.from}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="institutionFromName">
                  Nome Ente delegante
                </FieldLabel>

                <Input
                  id="institutionFromName"
                  name="institutionFromName"
                  placeholder="Nome delegante"
                  defaultValue={institutionName}
                  readOnly
                />
                {state.errors?.institutionFromName && (
                  <FieldError>{state.errors.institutionFromName}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="taxCodeTo">
                  Codice Fiscale delegato
                </FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    id="taxCodeTo"
                    name="taxCodeTo"
                    type="number"
                    pattern="^\d{11}$"
                    placeholder="00000000000"
                    className="no-spinner"
                    value={taxCodeTo}
                    onChange={(value) => setTaxCodeTo(value.target.value || "")}
                  />
                  {isFetchingInstitutionTo && (
                    <InputGroupAddon align="inline-end">
                      <Spinner />
                    </InputGroupAddon>
                  )}
                </InputGroup>

                {(taxCodeToError || state.errors?.taxCodeTo) && (
                  <FieldError>
                    {taxCodeToError || state.errors?.taxCodeTo}
                  </FieldError>
                )}
              </Field>

              {institutionOptions.length > 0 && (
                <Field>
                  <FieldLabel htmlFor="institutionToSelect">
                    Seleziona Ente delegato
                  </FieldLabel>
                  <Select
                    value={institutionTo?.id || undefined}
                    onValueChange={(value) => {
                      const selectedInstitution =
                        institutionOptions.find(
                          (institution) => institution.id === value,
                        ) || null;

                      setInstitutionTo(selectedInstitution);
                    }}
                  >
                    <SelectTrigger id="institutionToSelect">
                      <SelectValue placeholder="Seleziona ente delegato" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionOptions.map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {institutionTo?.id && institutionTo?.description && (
                <>
                  <Field>
                    <FieldLabel htmlFor="to">ID Ente delegato</FieldLabel>
                    <Input
                      id="to"
                      name="to"
                      placeholder="ID delegato"
                      value={institutionTo.id}
                      readOnly
                    />
                    {state.errors?.to && (
                      <FieldError>{state.errors.to}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="institutionToName">
                      Nome Ente delegato
                    </FieldLabel>
                    <Input
                      id="institutionToName"
                      name="institutionToName"
                      placeholder="Nome delegato"
                      value={institutionTo.description}
                      readOnly
                    />
                    {state.errors?.institutionToName && (
                      <FieldError>{state.errors.institutionToName}</FieldError>
                    )}
                  </Field>
                </>
              )}
            </FieldGroup>

            <Field orientation="horizontal" className="justify-end">
              <DialogClose asChild>
                <Button size="sm" variant="ghost" type="button">
                  Annulla
                </Button>
              </DialogClose>

              <Button
                size="sm"
                type="submit"
                disabled={isPending || !institutionTo}
              >
                {isPending ? (
                  <Spinner className="3.5 opacity-60" />
                ) : (
                  <CheckIcon className="3.5 opacity-60" />
                )}
                Salva
              </Button>
            </Field>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}
