import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
export const GeographicData = () => {
  const { form } = useStepOneContext();
  const { isStepThree } = useFormContext();

  return (
    <Card className="shadow-xl rounded-none">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>Dati Geografici</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="registeredOffice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sede legale</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>registeredOffice</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>city</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="istatCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Istat</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>istatCode</FormDescription>
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
                name="county"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comune</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>county</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice avviamento postale</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>zipCode</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paese</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>country</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
