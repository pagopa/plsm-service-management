"use client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Row } from "@tanstack/react-table";
import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { setDeleteStatus } from "../actions/setDeleteStatus";
import { useStepOneContext } from "../context/StepOneContext";
import { ApiOptionsApicale } from "../types/apiOptionsType";
import { ProductStatus } from "../types/productStatus";
import { SubunitOption } from "../types/subunitOptionsType";
import { productsMap } from "../utils/constants";

type ActionCellProps = {
  row: Row<ProductStatus>;
};

export function DeleteCell({ row }: ActionCellProps) {
  const { formRef, form, handleSubunitOption, handleApiOption, isDeleteOn } =
    useStepOneContext();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const resetInput = () => {
    setInputValue("");
  };
  const [state, action, isPending] = useActionState(setDeleteStatus, null);
  const taxcode = row.getValue("taxcode") as string;
  const subunit = row.getValue("subunit") as SubunitOption;
  const subunitCode = row.getValue("subunitCode") as string;
  const endpoint = row.getValue("endpoint") as ApiOptionsApicale;

  useEffect(() => {
    if (!state || isPending || !formRef.current) return;
    if (!state.success) {
      toast.error(state.message);
      setOpen(false);
      return;
    }
    toast.success("Status modificato con successo");
    resetInput();

    form.setValue("taxcode", taxcode);
    form.setValue("subunit", subunit);
    form.setValue("subunitCode", subunitCode);

    handleSubunitOption(subunit);

    handleApiOption(endpoint);

    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 200);

    setOpen(false);
  }, [
    state,
    isPending,
    formRef,
    form,
    taxcode,
    subunit,
    subunitCode,
    handleSubunitOption,
    endpoint,
    handleApiOption,
  ]);

  return (
    <>
      {row.getValue("status") === "COMPLETED" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!isDeleteOn}
              variant={isDeleteOn ? "destructive" : "secondary"}
            >
              Cancella
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confermi?</DialogTitle>
              <DialogDescription>
                {`Questa azione cancellerà la registrazione del prodotto: ${productsMap.get(row.getValue("product"))} (id: ${row.getValue("id")}) per l'ente ${row.getValue("subunit") ? `${row.getValue("subunit")}` : ""}: ${row.getValue("businessName")}${row.getValue("taxcode") ? `, codice fiscale: ${row.getValue("taxcode")}` : ""}  `}
                <br />
                <br />
                {`Digita: ${productsMap.get(row.getValue("product"))} DELETE nello spazio sottostante per confermare la cancellazione.`}
                <br />
                <br />
                <Input value={inputValue} onChange={handleInput} />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancella</Button>
              </DialogClose>

              <form
                action={async () => {
                  const formData = new FormData();
                  formData.append("id", row.getValue("id"));
                  formData.append(
                    "product",
                    productsMap.get(row.getValue("product")) as string,
                  );
                  formData.append("inputValue", inputValue);
                  resetInput();

                  return action(formData);
                }}
              >
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    inputValue !==
                    `${productsMap.get(row.getValue("product"))} DELETE`
                  }
                >
                  {isPending ? (
                    <LoaderCircle
                      className="ui:animate-spin"
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    "Conferma"
                  )}
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
