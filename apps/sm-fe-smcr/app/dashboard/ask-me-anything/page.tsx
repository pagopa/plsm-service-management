import {
  AskMeAnythingCreateMemberDialog,
  AskMeAnythingTableSection,
} from "@/components/ask-me-anything";
import { readAskMeAnythingMembers } from "@/lib/services/ask-me-anything.service";
import { UsersIcon } from "lucide-react";

export default async function AskMeAnythingPage() {
  const { data, error } = await readAskMeAnythingMembers();

  if (error) {
    console.error("AskMeAnythingPage - read error", error);
  }

  return (
    <div className="bg-white h-full w-full p-2">
      <div className="inline-flex items-center justify-between w-full border-b p-2">
        <div className="inline-flex gap-2 items-center">
          <UsersIcon className="size-4 opacity-60" />
          <h1 className="font-medium text-lg">Utenti</h1>
        </div>
        <AskMeAnythingCreateMemberDialog />
      </div>

      <AskMeAnythingTableSection initialRows={data ?? []} />
    </div>
  );
}
