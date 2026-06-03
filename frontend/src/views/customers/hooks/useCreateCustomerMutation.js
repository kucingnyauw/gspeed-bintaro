import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer } from "@api/customerApi.js";

/**
 * Custom hook untuk membuat customer baru beserta kendaraannya.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useCreateCustomerMutation({
 *   onSuccess: (data) => {
 *     toast.success("Customer berhasil ditambahkan!");
 *   },
 *   onFailed: (error) => {
 *     toast.error(error.message);
 *   },
 * });
 *
 * mutation.mutate({ name: "Budi", phone: "0812", vehicle: { plateNumber: "B 1234" } });
 */
export const useCreateCustomerMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};