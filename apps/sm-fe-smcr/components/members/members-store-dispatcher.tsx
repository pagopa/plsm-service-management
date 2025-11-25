"use client";

import { MemberWithTeams } from "@/lib/services/members.service";
import useMembersStore from "@/lib/store/members.store";
import { useEffect } from "react";

type Props = {
  members: Array<MemberWithTeams>;
};

export default function MembersStoreDispatcher({ members }: Props) {
  const setMembers = useMembersStore((state) => state.setMembers);

  useEffect(() => {
    setMembers(members);
  }, [members, setMembers]);

  return null;
}
