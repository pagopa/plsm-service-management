"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { updateMemberTeamAction } from "@/lib/actions/members.action";
import type { MemberWithTeams } from "@/lib/services/members.service";
import type { Team } from "@/lib/services/teams.service";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  team: Team;
  member: MemberWithTeams;
};

export default function TeamCheckbox({ team, member }: Props) {
  const [state, action, isPending] = useActionState(updateMemberTeamAction, {
    data: {
      memberId: member.id,
      teamId: team.id,
    },
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [active, setActive] = useState<CheckedState>(
    member.teams.some((t) => t.id === team.id),
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
          `I team di ${member.firstname} ${member.lastname} sono stati aggiornati correttamente!`,
        );
        if (state.data.active !== undefined) {
          setActive(state.data.active);
        }
      }
    }
  }, [state, isSubmitted, member.firstname, member.lastname]);

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="memberId" value={member.id} />
      <input type="hidden" name="teamId" value={team.id} />

      <FieldSet>
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox
              id={String(team.id)}
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
                <FieldLabel htmlFor={String(team.id)} className="font-normal">
                  {team.name}
                </FieldLabel>
              </div>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
