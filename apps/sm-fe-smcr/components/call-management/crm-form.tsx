import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CRMForm() {
  return (
    <form className="flex flex-col w-80">
      <FieldSet className="pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="institution">Azienda / Ente</FieldLabel>
            <Input
              id="institution"
              name="institution"
              autoComplete="off"
              placeholder="Azienda / Ente"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="members">Partecipanti Esterni</FieldLabel>
            <Input
              id="members"
              name="members"
              autoComplete="off"
              placeholder="Partecipanti"
            />
            {/* <FieldError>Choose another username.</FieldError> */}
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Descrizione</FieldLabel>
            <Textarea
              id="members"
              name="members"
              placeholder="Descrizione"
              rows={5}
            />
            {/* <FieldError>Choose another username.</FieldError> */}
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
