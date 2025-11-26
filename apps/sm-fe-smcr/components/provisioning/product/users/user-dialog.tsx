import { readUser, UserDetails } from "@/lib/services/users.service";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
} from "@repo/ui";
import { EyeIcon, EyeOffIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  institutionId: string;
  userId: string;
};

export default function UserDialog({ children, institutionId, userId }: Props) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [showTaxCode, setShowTaxCode] = useState(false);

  const fetchUser = async () => {
    const { data, error } = await readUser({ institutionId, userId });
    if (error) {
      console.error(error);
      return;
    }

    setUser(data);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0">
          {children}
        </Button>
      </DialogTrigger>

      <DialogContent className="text-sm">
        {user && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserIcon className="size-4" />
                {user?.name} {user?.surname}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground text-xs">ID:</span>
                  <div className="break-all">{user.id}</div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-3">
                    <span className="text-muted-foreground text-xs">
                      Email:
                    </span>
                    <div>
                      <a
                        href={`mailto:${user.email}`}
                        className="hover:underline"
                      >
                        {user.email}
                      </a>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">
                      Codice Fiscale:
                    </span>

                    <div className="flex items-center gap-2 w-full justify-between">
                      <span>
                        {showTaxCode ? user.taxCode : "••••••••••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowTaxCode(!showTaxCode)}
                      >
                        {showTaxCode ? (
                          <EyeOffIcon className="h-3.5 w-3.5" />
                        ) : (
                          <EyeIcon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Contatti di Lavoro</span>

                  <Badge variant="outline" className="text-xs">
                    {Object.keys(user.workContacts).length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {Object.entries(user.workContacts).length > 0 ? (
                    Object.entries(user.workContacts).map(
                      ([contactId, email], index) => (
                        <div
                          key={contactId}
                          className="flex items-center justify-between py-1 px-2 bg-muted/60 rounded"
                        >
                          <span className="text-muted-foreground text-xs">
                            #{index + 1}
                          </span>
                          <a
                            href={`mailto:${email}`}
                            className="hover:underline truncate ml-2"
                          >
                            {email}
                          </a>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="w-full bg-muted/60 flex items-center justify-center p-4 rounded">
                      <p className="text-muted-foreground">
                        Nessuna email trovata.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 m-0">
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>

          <DialogDescription>{user && JSON.stringify(user)}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
