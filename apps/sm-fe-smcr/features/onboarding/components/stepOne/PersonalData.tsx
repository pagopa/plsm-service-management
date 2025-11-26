import {
  institutionOptionsByProduct,
  ProductKeys,
} from "../../utils/constants";
import { useFormContext } from "../../context/FormContext";
import { useStepOneContext } from "../../context/StepOneContext";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Props = {
  isPIVANull: boolean;
  isPIVAequalToTaxcode: boolean;
  productId: ProductKeys;
  isSubunit: boolean;
};

export const PersonalData = ({
  isPIVANull,
  isPIVAequalToTaxcode,
  productId,
  isSubunit,
}: Props) => {
  const { form } = useStepOneContext();
  const { isStepThree } = useFormContext();
  return (
    <Card className="shadow-xl rounded-none">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>Dati Anagrafici</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          {!isStepThree && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 col-end-13">
                <div className="flex items-center space-x-2 mb-4">
                  <FormField
                    control={form.control}
                    name="isPIVANull"
                    render={({ field }) => (
                      <FormItem className="flex items-center  space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(value) => {
                              field.onChange(value);
                              form.setValue("vatNumber", "");
                              form.setValue("isPIVAequalToTaxcode", false);
                              form.trigger("vatNumber");
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Il mio ente non ha la PIVA
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="isPIVAequalToTaxcode"
                    render={({ field }) => (
                      <FormItem className="flex items-center  space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPIVANull}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          La PIVA coincide con il CF
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ragione sociale</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>businessName</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita iva</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={
                          isStepThree || isPIVAequalToTaxcode || isPIVANull
                        }
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>vatNumber</FormDescription>
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
                name="digitalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PEC</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>digitalAddress</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email di supporto</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>supportEmail</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="institutionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipologia</FormLabel>
                    <Select
                      disabled={isStepThree}
                      key={field.value}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none hover:cursor-pointer">
                          <SelectValue placeholder="Seleziona una tipologia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tipologie</SelectLabel>
                          {institutionOptionsByProduct
                            .get(productId)!
                            .map((option) => {
                              if (option) {
                                return (
                                  <SelectItem
                                    key={option["tag"]}
                                    value={option["value"]}
                                  >
                                    {option["value"]}
                                  </SelectItem>
                                );
                              }
                            })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>institutionType</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isSubunit && (
              <>
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name="subunitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipologia Subunit</FormLabel>
                        <FormControl>
                          <Input
                            className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                            disabled={isStepThree}
                            placeholder=""
                            type="text"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>subunitType</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name="taxcode"
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
