import { useActionState, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { onboardingStatus } from "../actions/getOnboardingStatus";
import { StatusSchema } from "../types/getFormStatusSchema";
import { isNotEmptyObj } from "../utils/isNotEmptyObj";

type Status = "pending" | "blocked" | "completed";
export function useStatus(formValues: StatusSchema) {
  // const [status, setStatus] = useState<Status>("pending");
  const [status, setStatus] = useState<Status>("blocked");
  const [id, setId] = useState<string>("");
  const isStatusPending = status === "pending";
  const isStatusCompleted = status === "completed";

  const handleStatusChange = useCallback((status: Status) => {
    setStatus(status);
  }, []);

  const handleProductIdChange = useCallback((productId: string) => {
    setId(productId);
  }, []);

  const [state, action, isPending] = useActionState(onboardingStatus, {
    apiResponse: undefined,
    formValues,
    validationErrors: {},
  });

  useEffect(() => {
    if (!state || isPending) return;

    if (isNotEmptyObj(state.validationErrors)) {
      let result = "";
      for (const [key, value] of Object.entries(state.validationErrors)) {
        result += `${key}: ${value.message}\n`;
      }
      toast.error(result);
      return;
    }
    if (!state.apiResponse) return;

    if (!state.apiResponse.success) {
      if (state.apiResponse.error) {
        handleStatusChange("blocked");
        toast.error(
          state.apiResponse.error.message ?? "Qualcosa è andato storto",
        );
      }
      return;
    }

    const { data } = state.apiResponse;
    switch (data.status) {
      case "COMPLETED":
        handleStatusChange("completed");
        break;

      case "PENDING":
        handleStatusChange("pending");
        handleProductIdChange(data.id);
        break;

      default:
        handleStatusChange("blocked");
        break;
    }
    toast.success("Status controllato");
  }, [state, isPending, handleStatusChange, handleProductIdChange]);

  return {
    status,
    handleStatusChange,
    isStatusCompleted,
    isStatusPending,
    id,
    state,
    action,
    isPending,
  };
}
