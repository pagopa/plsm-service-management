import { ProductOptions } from "../../types/productType";
import { useStepOneContext } from "../../context/StepOneContext";
import { useFormContext } from "../../context/FormContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  productOptionsToDisplay: ProductOptions;
};
export const Product = ({ productOptionsToDisplay }: Props) => {
  const { form } = useStepOneContext();
  const { isStepThree } = useFormContext();
  return (
    <Card className="shadow-xl mb-12 rounded-none ">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>Prodotto</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="hidden">Prodotto</FormLabel>
              <div className="flex gap-4 items-center justify-center">
                <Select
                  disabled={isStepThree}
                  key={field.value}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none hover:cursor-pointer">
                      <SelectValue placeholder="Seleziona un prodotto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Prodotti</SelectLabel>
                      {productOptionsToDisplay.map((option) => (
                        <SelectItem key={option.tag} value={option.tag}>
                          {option.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
