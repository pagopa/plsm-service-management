import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Card,
  CardContent,
} from "@repo/ui";
import { DataTable } from "./DataTable";
import { columns } from "./OnboardingColumns";
import { ProductStatus } from "../types/productStatus";

type Props = {
  dataTable: ProductStatus[];
};
export const OnboardingStatusTable = ({ dataTable }: Props) => {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full mb-12"
      defaultValue="status"
    >
      <AccordionItem value="status">
        <AccordionTrigger className="font-bold uppercase tracking-wider text-sm">
          Onboarding status
        </AccordionTrigger>
        <AccordionContent>
          <Card className="rounded-none ">
            <CardContent>
              <DataTable columns={columns} data={dataTable} />
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
