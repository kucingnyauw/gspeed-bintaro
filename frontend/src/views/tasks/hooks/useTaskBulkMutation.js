import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkStartOrders, bulkCompleteOrders } from "@api/taskApi.js";

export const useBulkStartOrdersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkStartOrders,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks-by-order"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};

export const useBulkCompleteOrdersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkCompleteOrders,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks-by-order"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};