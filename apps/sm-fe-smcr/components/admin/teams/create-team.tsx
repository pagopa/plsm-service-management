"use client";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ImageTeam from "./image-teams";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  image: z.instanceof(File).optional(),
});

export default function CreateTeam() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      image: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      if (values.image) {
        formData.append("image", values.image);
      }

      const response = await fetch("/api/teams/new", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Errore nella creazione del team");
      }

      await response.json();

      form.reset();
      setOpen(false);
      router.refresh(); // Refresh della pagina padre
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <PlusIcon size={16} className="opacity-60" /> Crea il tuo team
        </Button>
      </DialogTrigger>

      <DialogContent className="w-1/3">
        <DialogHeader className="text-left">
          <DialogTitle>Crea il tuo team</DialogTitle>
          <DialogDescription>
            Crea il tuo team compilando questo form
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
            encType="multipart/form-data"
          >
            <FormField
              control={form.control as any}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immagine del team</FormLabel>
                  <ImageTeam
                    onImageSelected={(file) => {
                      field.onChange(file);
                    }}
                    onError={(error) => {
                      form.setError("image", { message: error });
                    }}
                  />
                  <FormDescription>
                    Carica il logo del team (opzionale)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del team" {...field} />
                  </FormControl>
                  <FormDescription>Digita il nome del team</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-row justify-end">
              <DialogClose asChild>
                <Button size="sm" type="reset" variant="ghost">
                  Cancella
                </Button>
              </DialogClose>

              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading ? "Creazione in corso..." : "Salva"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
