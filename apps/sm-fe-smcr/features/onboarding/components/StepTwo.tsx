import { zodResolver } from "@hookform/resolvers/zod";

import { useFieldArray, useForm } from "react-hook-form";
import {
  defaultValues,
  stepTwoSchema,
  StepTwoSchema,
} from "../types/stepTwoSchema";

import { LoaderCircle } from "lucide-react";
import { useActionState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getUserTaxCode } from "../actions/getUserTaxCode";
import { roleOptions } from "../utils/constants";
import Header from "./Header";
import StepOneTwoControls from "./StepOneTwoControls";
import { useFormContext } from "../context/FormContext";
import { getStepTwoData } from "../utils/getStepData";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export default function StepTwo({ children, ...props }: Props) {
  const {
    isStepThree,
    isStepTwo,
    formData,
    updateFormData,
    nextStep,
    isStepTwoSubmitted,
    handleStepTwoSubmit,
  } = useFormContext();

  const form = useForm<StepTwoSchema>({
    resolver: zodResolver(stepTwoSchema),
    mode: "onChange",
    defaultValues: isStepTwoSubmitted
      ? getStepTwoData(formData)
      : defaultValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "users",
  });

  const handleAddUser = useCallback(() => {
    append({
      name: "",
      surname: "",
      email: "",
      role: "MANAGER",
      taxCode: "",
    });
  }, [append]);

  function handleRemoveUser(index: number) {
    remove(index);
  }

  function onSubmit(values: StepTwoSchema, event: any) {
    if (!isStepThree) {
      updateFormData(values);
      handleStepTwoSubmit();
      if (event.nativeEvent.submitter.name === "next") {
        nextStep();
      }
    }
  }

  const [state, action, isPending] = useActionState(getUserTaxCode, null);

  useEffect(() => {
    if (isPending || !state) return;

    if (state.success && state.data) {
      function hasUserAnyData(user: StepTwoSchema["users"][number]): boolean {
        return (
          user.taxCode !== "" ||
          user.name !== "" ||
          user.surname !== "" ||
          user.email !== ""
        );
      }
      function areThereManagers(users: StepTwoSchema["users"]): boolean {
        return users.some((user) => user.role === "MANAGER");
      }
      const users = form.getValues("users");
      const validUsers = users.filter(hasUserAnyData);

      const newUsers: StepTwoSchema["users"] = [
        ...validUsers,
        {
          name: state.data.name,
          surname: state.data.surname,
          email: "",
          role: areThereManagers(validUsers) ? "DELEGATE" : "MANAGER",
          taxCode: state.taxCode as string,
        },
      ];

      replace(newUsers);
      form.trigger("users");
    } else if (!state.success) {
      toast.error(`${state.message}`);
    } else {
      toast.error("Utente trovato ma dati mancanti");
    }
  }, [state, isPending, replace, form]);

  useEffect(() => {
    if (!isStepTwo) return;
    const users = form.getValues("users");
    if (users.length > 0) return;
    handleAddUser();
  }, [form, handleAddUser, isStepTwo]);

  return (
    <div {...props}>
      {children}
      {!isStepThree && (
        <Header
          taxcode={formData.taxcode}
          businessName={formData.businessName}
          product={formData.productId ?? ""}
          subunitCode={formData.subunitCode}
          subunit={formData.subunit}
        />
      )}
      <h2 className="text-2xl font-semibold">Utenti</h2>
      {!isStepThree && (
        <Card className="shadow-xl mt-8 rounded-none">
          <CardContent>
            <form action={action}>
              <div className="flex gap-4 py-8  items-center justify-between">
                <div className="shrink-0">
                  <Label id="taxCode">Codice fiscale</Label>
                </div>

                <div className="basis-full">
                  <Input
                    id="taxCode"
                    name="taxCode"
                    placeholder=""
                    type="text"
                    className="w-full"
                  />
                </div>
                {!isStepThree && (
                  <Button
                    className="w-fit sm:w-32"
                    type="submit"
                    variant="outline"
                  >
                    {isPending ? (
                      <LoaderCircle
                        className="ui:animate-spin"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    ) : (
                      "Cerca"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-3xl mx-auto py-10 "
        >
          {!isStepThree && (
            <Button
              type="button"
              onClick={handleAddUser}
              variant="outline"
              className="w-fit"
            >
              Aggiungi
            </Button>
          )}

          {fields.map((field, index) => (
            <div key={field.id}>
              <Card className="shadow-xl rounded-none">
                <CardContent>
                  <>
                    <div className="flex gap-4  items-center mb-4">
                      <div className="p-2 ui:bg-secondary rounded-lg text-sm ">{`Utente #${index + 1}`}</div>
                      {!isStepThree && (
                        <Button
                          variant="destructive"
                          type="button"
                          onClick={() => handleRemoveUser(index)}
                        >
                          Rimuovi
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-4 space-y-8">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`users.${index}.name`}
                          key={`users.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input
                                  className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                                  disabled={isStepThree}
                                  placeholder=""
                                  type="text"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>name</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`users.${index}.surname`}
                          key={`users.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cognome</FormLabel>
                              <FormControl>
                                <Input
                                  className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                                  disabled={isStepThree}
                                  placeholder=""
                                  type="text"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>surname</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 space-y-8">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`users.${index}.email`}
                          key={`users.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                                  disabled={isStepThree}
                                  placeholder=""
                                  type="email"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>email</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`users.${index}.role`}
                          key={`users.${index}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ruolo</FormLabel>
                              <Select
                                disabled={isStepThree}
                                key={field.value}
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleOptions.map((option) => (
                                    <SelectItem
                                      key={option["tag"]}
                                      value={option["value"]}
                                    >
                                      {option["value"]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>role</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`users.${index}.taxCode`}
                          key={`users.${index}.taxCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Codice fiscale</FormLabel>
                              <FormControl>
                                <Input
                                  className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                                  disabled={isStepThree}
                                  placeholder=""
                                  type="text"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>taxcode</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </>
                </CardContent>
              </Card>
            </div>
          ))}
          {!isStepThree && <StepOneTwoControls form={form} />}
        </form>
      </Form>
    </div>
  );
}
