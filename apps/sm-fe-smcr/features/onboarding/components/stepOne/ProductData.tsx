import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  Input,
  FormDescription,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@repo/ui";
import { apiOriginValues } from "../../utils/constants";
import { useFormContext } from "../../context/FormContext";
import { useStepOneContext } from "../../context/StepOneContext";
export const ProductData = () => {
  const { form } = useStepOneContext();
  const { isStepThree } = useFormContext();

  return (
    <Card className="shadow-xl rounded-none">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>Dati Prodotto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <Select
                      disabled={isStepThree}
                      key={field.value}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none hover:cursor-pointer">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Origin</SelectLabel>
                          {apiOriginValues.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>origin</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="originId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OriginId</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>originId</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="recipientCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice SDI</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>recipientCode</FormDescription>
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
