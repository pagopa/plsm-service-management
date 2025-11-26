import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
export const IdentificationData = () => {
  const { form } = useStepOneContext();

  return (
    <Card className="shadow-xl rounded-none">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>Dati Identificativi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>id</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        placeholder=""
                        disabled
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Id</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="externalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>externalId</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        placeholder=""
                        disabled
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>externalId</FormDescription>
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
