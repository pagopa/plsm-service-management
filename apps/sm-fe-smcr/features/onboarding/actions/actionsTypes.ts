import { StatusSchema } from "../types/getFormStatusSchema";

type SuccessResponse = {
  success: true;
  data: {
    status: string;
    message: string;
    id: string;
    businessName: string;
  };
};

type ErrorResponse = {
  success: false;
  error: {
    message: string;
    status?: number;
    statusText?: string;
  } | null;
};

export type StatusActionState = {
  validationErrors: Record<string, { message: string }>;
  formValues: StatusSchema;
  apiResponse: (SuccessResponse | ErrorResponse) | undefined;
};
