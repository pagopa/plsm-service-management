import { productValues, trueFalseOptions } from "../../utils/constants";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
export const AdditionalData = () => {
  const { form } = useStepOneContext();
  const { isStepThree } = useFormContext();

  return (
    <Card className="shadow-xl rounded-none">
      <CardHeader className="font-bold uppercase tracking-wider text-sm">
        <CardTitle>
          Dati Addizionali GSP per il prodotto: {productValues[0]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="belongRegulatedMarket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>belongRegulatedMarket</FormLabel>
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
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="regulatedMarketNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>regulatedMarketNote</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>regulatedMarketNote</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-4">
              <FormField
                control={form.control}
                name="ipa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ipa</FormLabel>
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
                    <FormDescription>ipa</FormDescription>
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
                name="ipaCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ipaCode</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>ipaCode</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="establishedByRegulatoryProvision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>establishedByRegulatoryProvision</FormLabel>

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
                    <FormDescription>
                      establishedByRegulatoryProvision
                    </FormDescription>
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
                name="establishedByRegulatoryProvisionNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>establishedByRegulatoryProvisionNote</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      establishedByRegulatoryProvisionNote
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={form.control}
                name="otherNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>otherNote</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>otherNote</FormDescription>
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
                name="agentOfPublicService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>agentOfPublicService</FormLabel>

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
                    <FormDescription>agentOfPublicService</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="agentOfPublicServiceNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>agentOfPublicServiceNote</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>agentOfPublicServiceNote</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-4">
              <FormField
                control={form.control}
                name="rea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>rea</FormLabel>
                    <FormControl>
                      <Input
                        className="disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:shadow-none"
                        disabled={isStepThree}
                        placeholder=""
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>rea</FormDescription>
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
