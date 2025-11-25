import { SubunitOption } from "./subunitOptionsType";

export type ProductStatus = {
  id: string;
  product: string;
  status: string;
  updatedAt: Date | undefined;
  createdAt: Date;
  businessName: string;
  subunit: SubunitOption;
  taxcode?: string;
  subunitCode: string;
  endpoint?: string;
  productId?: string;
};
