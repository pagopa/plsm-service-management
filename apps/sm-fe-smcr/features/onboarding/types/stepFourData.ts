export type StepFourData = {
  taxcode: string;
  product: string;
  subunit: string;
  subunitCode: string;
  businessName: string;
  productId: string;
  dataTable:
    | {
        productId: string;
        product: string;
        businessName: string;
        subunit: string;
        subunitCode: string | undefined;
        taxcode: string;
        workflowType: string | undefined;
        updatedAt: Date | undefined;
        createdAt: Date;
        status: string;
      }[]
    | undefined;
};
