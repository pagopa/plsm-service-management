"use client";

import {
  ChangeEvent,
  ReactNode,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createAskMeAnythingMemberAction,
  type AskMeAnythingMemberFormState,
  type AskMeAnythingMemberFormValues,
  updateAskMeAnythingMemberAction,
} from "@/lib/actions/ask-me-anything.action";
import { AskMeAnythingMember } from "@/lib/services/ask-me-anything.service";

type PermissionField = "selfcareAccess" | "legalAccess";

const createEmptyFormState = (): AskMeAnythingMemberFormValues => ({
  id: undefined,
  firstname: "",
  lastname: "",
  email: "",
  selfcareAccess: false,
  legalAccess: false,
});

const createFormStateFromMember = (
  member?: AskMeAnythingMember | null,
): AskMeAnythingMemberFormValues =>
  member
    ? {
        id: member.id,
        firstname: member.firstname,
        lastname: member.lastname,
        email: member.email,
        selfcareAccess: member.selfcareAccess,
        legalAccess: member.legalAccess,
      }
    : createEmptyFormState();

const hasRequiredFields = (state: AskMeAnythingMemberFormValues) =>
  state.firstname.trim() !== "" &&
  state.lastname.trim() !== "" &&
  state.email.trim() !== "";

const actionInitialState: AskMeAnythingMemberFormState = {
  data: createEmptyFormState(),
  error: null,
};

interface AskMeAnythingMemberDialogBaseProps {
  mode: "create" | "edit";
  trigger?: ReactNode;
  member?: AskMeAnythingMember | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (values: AskMeAnythingMemberFormValues) => void;
}

function AskMeAnythingMemberDialogBase({
  mode,
  trigger,
  member,
  open,
  onOpenChange,
  onSuccess,
}: AskMeAnythingMemberDialogBaseProps) {
  const isEditing = mode === "edit";
  const memberId = member?.id;
  const action = isEditing
    ? updateAskMeAnythingMemberAction
    : createAskMeAnythingMemberAction;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? (open as boolean) : internalOpen;
  const [formState, setFormState] = useState<AskMeAnythingMemberFormValues>(
    () =>
      isEditing ? createFormStateFromMember(member) : createEmptyFormState(),
  );
  const [actionState, formAction, isPending] = useActionState(
    action,
    actionInitialState,
  );
  const { data: lastSubmission, error: submissionError } = actionState;

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      if (!nextOpen) {
        setFormState(
          isEditing
            ? createFormStateFromMember(member)
            : createEmptyFormState(),
        );
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, isEditing, member, onOpenChange],
  );

  useEffect(() => {
    if (!dialogOpen || !isEditing || !member) {
      return;
    }

    setFormState(createFormStateFromMember(member));
  }, [dialogOpen, isEditing, member]);

  const handleInputChange = useCallback(
    (field: "firstname" | "lastname" | "email") =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setFormState((prev) => ({ ...prev, [field]: value }));
      },
    [],
  );

  const handlePermissionFieldChange = useCallback(
    (field: PermissionField) => (value: boolean | "indeterminate") => {
      setFormState((prev) => ({ ...prev, [field]: !!value }));
    },
    [],
  );

  const isFormValid = useMemo(() => hasRequiredFields(formState), [formState]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const hasSubmission =
      Boolean(lastSubmission.firstname) ||
      Boolean(lastSubmission.lastname) ||
      Boolean(lastSubmission.email);

    if (!isPending && hasSubmission && !submissionError) {
      const mergedValues: AskMeAnythingMemberFormValues = {
        ...formState,
        ...(lastSubmission ?? {}),
        id: lastSubmission?.id ?? formState.id ?? memberId,
      };

      toast.success(
        isEditing
          ? "Utente aggiornato correttamente."
          : "Utente aggiunto al bot Slack.",
      );
      onSuccess?.(mergedValues);
      handleDialogOpenChange(false);
    }
  }, [
    dialogOpen,
    handleDialogOpenChange,
    isEditing,
    isPending,
    lastSubmission,
    memberId,
    onSuccess,
    submissionError,
    formState,
  ]);

  useEffect(() => {
    if (!dialogOpen || !submissionError) {
      return;
    }

    toast.error(
      isEditing
        ? "Aggiornamento utente non riuscito"
        : "Creazione utente non riuscita",
      submissionError.root ? { description: submissionError.root } : undefined,
    );

    setFormState((prev) => ({
      ...prev,
      ...(lastSubmission ?? {}),
    }));
  }, [dialogOpen, isEditing, lastSubmission, submissionError]);

  const title = isEditing ? "Modifica utente" : "Crea utente";
  const description = isEditing
    ? "Aggiorna i dati e i permessi del bot Slack."
    : "Inserisci le informazioni di base e imposta i permessi del bot Slack.";
  const submitLabel = isEditing ? "Salva modifiche" : "Crea utente";

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" action={formAction}>
          {isEditing && (
            <input type="hidden" name="id" value={formState.id ?? ""} />
          )}
          <FieldSet>
            <FieldLegend>Dati utente</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="firstname">Nome</FieldLabel>
                <Input
                  id="firstname"
                  name="firstname"
                  autoComplete="given-name"
                  placeholder="Es. Giulia"
                  value={formState.firstname}
                  onChange={handleInputChange("firstname")}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="lastname">Cognome</FieldLabel>
                <Input
                  id="lastname"
                  name="lastname"
                  autoComplete="family-name"
                  placeholder="Es. Bianchi"
                  value={formState.lastname}
                  onChange={handleInputChange("lastname")}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome.cognome@example.it"
                  value={formState.email}
                  onChange={handleInputChange("email")}
                  required
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Permessi bot</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              <Field
                orientation="horizontal"
                className="hover:bg-accent/50 rounded-lg border p-3 transition-colors has-[[role=checkbox][data-state=checked]]:border-blue-600 has-[[role=checkbox][data-state=checked]]:bg-blue-50 dark:has-[[role=checkbox][data-state=checked]]:border-blue-900 dark:has-[[role=checkbox][data-state=checked]]:bg-blue-950"
              >
                <input type="hidden" name="selfcareAccess" value="false" />
                <Checkbox
                  id="selfcare-toggle"
                  name="selfcareAccess"
                  value="true"
                  checked={formState.selfcareAccess}
                  onCheckedChange={handlePermissionFieldChange(
                    "selfcareAccess",
                  )}
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                />
                <FieldContent>
                  <FieldLabel
                    htmlFor="selfcare-toggle"
                    className="text-sm font-medium leading-none"
                  >
                    Selfcare
                  </FieldLabel>
                  <FieldDescription>
                    Permette l&apos;uso dei comandi Selfcare del bot.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field
                orientation="horizontal"
                className="hover:bg-accent/50 rounded-lg border p-3 transition-colors has-[[role=checkbox][data-state=checked]]:border-blue-600 has-[[role=checkbox][data-state=checked]]:bg-blue-50 dark:has-[[role=checkbox][data-state=checked]]:border-blue-900 dark:has-[[role=checkbox][data-state=checked]]:bg-blue-950"
              >
                <input type="hidden" name="legalAccess" value="false" />
                <Checkbox
                  id="legal-toggle"
                  name="legalAccess"
                  value="true"
                  checked={formState.legalAccess}
                  onCheckedChange={handlePermissionFieldChange("legalAccess")}
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                />
                <FieldContent>
                  <FieldLabel
                    htmlFor="legal-toggle"
                    className="text-sm font-medium leading-none"
                  >
                    Legal
                  </FieldLabel>
                  <FieldDescription>
                    Abilita i comandi Legal dedicati.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>

          {dialogOpen && submissionError?.root && (
            <p className="text-destructive text-sm">{submissionError.root}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isFormValid || isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AskMeAnythingCreateMemberDialog() {
  return (
    <AskMeAnythingMemberDialogBase
      mode="create"
      trigger={
        <Button size="sm" variant="secondary">
          <PlusIcon className="size-3.5 opacity-60" />
          Nuovo utente
        </Button>
      }
    />
  );
}

export interface AskMeAnythingEditMemberDialogProps {
  member: AskMeAnythingMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (values: AskMeAnythingMemberFormValues) => void;
}

export function AskMeAnythingEditMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: AskMeAnythingEditMemberDialogProps) {
  if (!member) {
    return null;
  }

  return (
    <AskMeAnythingMemberDialogBase
      mode="edit"
      member={member}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
}

export type { AskMeAnythingMemberFormValues };
