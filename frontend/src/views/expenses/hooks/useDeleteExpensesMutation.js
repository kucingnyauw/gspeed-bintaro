import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExpenses } from "@api/expenseApi.js";

/**
 * Custom hook untuk menghapus banyak pengeluaran sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useDeleteExpensesMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.deleted} pengeluaran berhasil dihapus`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useDeleteExpensesMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpenses,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};