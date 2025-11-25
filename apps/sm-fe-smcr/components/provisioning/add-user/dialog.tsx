import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui";
import CreateUserForm from "./form";
import { PlusIcon } from "lucide-react";

type Props = {
  institution: string;
  product: string;
  isPNPG?: boolean;
};

export default function AddUserDialog({ institution, product, isPNPG }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="pagopaprimary" size="sm">
          <PlusIcon className="opacity-60 size-3.5" />
          Nuovo utente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>

        <CreateUserForm
          institution={institution}
          product={product}
          isPNPG={isPNPG}
        />
      </DialogContent>
    </Dialog>
  );
}
