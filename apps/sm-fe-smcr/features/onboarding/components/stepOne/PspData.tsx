import { trueFalseOptions } from "../../utils/constants";
import { useFormContext } from "../../context/FormContext";
import { useStepOneContext } from "../../context/StepOneContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export const PspData = () => {
  const { form } = useStepOneContext();
  const { isStepThree } = useFormContext();

  return (
    <Card className="shadow-xl rounded-none">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>Dati PSP</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          <FormField
            control={form.control}
            name="businessRegisterNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>businessRegisterNumber</FormLabel>
                <FormControl>
                  <Input
                    className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                    disabled={isStepThree}
                    placeholder=""
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormDescription>businessRegisterNumber</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="abiCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>abiCode</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>abiCode</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="pec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pec</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>pec</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>email</FormLabel>
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
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>address</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>address</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="legalRegisterNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>legalRegisterNumber</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>legalRegisterNumber</FormDescription>
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
                name="legalRegisterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>legalRegisterName</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>legalRegisterName</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="vatNumberGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>vatNumberGroup</FormLabel>

                    <Select
                      disabled={isStepThree}
                      key={String(field.value)}
                      onValueChange={(value) => {
                        field.onChange(value === "true");
                      }}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trueFalseOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>vatNumberGroup</FormDescription>
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>code</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="desc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>desc</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>desc</FormDescription>
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
