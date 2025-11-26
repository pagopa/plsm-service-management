"use client";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { readUser, UserDetails } from "@/lib/services/users.service";
import { capitalizeWords } from "@/lib/utils";
import { useDebounce } from "@uidotdev/usehooks";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  users: Array<string>;
};

async function getUsers(institutionId: string, userIds: Array<string>) {
  const promises = userIds.map((userId) => readUser({ institutionId, userId }));

  return Promise.all(promises);
}

export default function UserPopover({ users }: Props) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const debouncedOpen = useDebounce(open, 200);
  const [usersFromApi, setUsersFromApi] = useState<
    Array<{
      data: {
        id: string;
        taxCode: string;
        name: string;
        surname: string;
        email: string;
        workContacts: Record<string, string>;
      } | null;
      error: {
        message?: string | undefined;
        status: number;
        statusText: string;
      } | null;
    }>
  >([]);

  useEffect(() => {
    const institutionId = searchParams.get("institution");

    if (institutionId) {
      setIsPending(true);
      getUsers(institutionId, users).then((result) => {
        setUsersFromApi(result);
        setIsPending(false);
      });
    }
  }, [searchParams, users]);

  return (
    <Popover open={debouncedOpen} onOpenChange={setOpen}>
      <PopoverTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(event) => event.preventDefault()}
      >
        <Badge variant="outline">{users.length} membri</Badge>
      </PopoverTrigger>

      {users.length > 0 && (
        <PopoverContent
          className="w-full flex flex-col gap-3"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <UsersList
            isPending={isPending}
            users={usersFromApi}
            length={users.length}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

function UsersList({
  isPending,
  users,
  length,
}: {
  isPending?: boolean;
  users: Array<any>;
  length: number;
}) {
  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length }).map((_, i) => (
          <div key={i} className="flex flex-col h-12 gap-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    users &&
    users.map((user, index) => (
      <div key={user.data?.id || index}>
        {user.data ? (
          <UserItem user={user.data} />
        ) : (
          <p>Errore durante la lettura dell&apos;utente</p>
        )}
      </div>
    ))
  );
}

function UserItem({ user }: { user: UserDetails }) {
  return (
    <div className="h-12">
      <p key={user.id}>{capitalizeWords(`${user.name} ${user.surname}`)}</p>
      <span className="text-muted-foreground text-sm">{user.email}</span>
    </div>
  );
}
