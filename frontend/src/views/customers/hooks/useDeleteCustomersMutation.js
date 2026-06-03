import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCustomers } from "@api/customerApi.js";

/**
 * Custom hook untuk menghapus banyak customer sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useDeleteCustomersMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.deleted} pelanggan berhasil dihapus`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useDeleteCustomersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};