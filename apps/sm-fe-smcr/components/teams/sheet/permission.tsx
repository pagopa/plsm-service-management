"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { updateTeamPermissionAction } from "@/lib/actions/teams.action";
import type {
  Permission,
  TeamWithPermissions,
} from "@/lib/services/teams.service";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  permission: Permission;
  team: TeamWithPermissions;
};

export default function Permission({ permission, team }: Props) {
  const [state, action, isPending] = useActionState(
    updateTeamPermissionAction,
    {
      data: {
        teamId: team.id,
        permissionId: permission.id,
      },
    },
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [active, setActive] = useState<CheckedState>(
    team.permissions.includes(permission.id),
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isSubmitted) {
      if (state.error) {
        toast.error(
          state.error.root || "Si è verificato un errore, riprova più tardi.",
        );
      } else {
        toast.success(
          `I permessi del team ${team.name} sono stati aggiornati correttamente!`,
        );
        if (state.data.active !== undefined) {
          setActive(state.data.active);
        }
      }
    }
  }, [state]);

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="teamId" value={team.id} />
      <input type="hidden" name="permissionId" value={permission.id} />

      <FieldSet>
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox
              id={String(permission.id)}
              aria-describedby={`${permission.id}-description`}
              name="active"
              checked={active}
              onCheckedChange={() => {
                if (formRef.current) {
                  formRef.current.requestSubmit();
                  setIsSubmitted(true);
                }
              }}
            />
            <FieldContent>
              <div className="grid grow gap-2">
                <FieldLabel
                  htmlFor={String(permission.id)}
                  className="font-normal"
                >
                  {permission.name}
                </FieldLabel>

                {permission.description && (
                  <FieldDescription
                    id={`${permission.id}-description`}
                    className="text-sm text-muted-foreground"
                  >
                    {permission.description}
                  </FieldDescription>
                )}
              </div>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
