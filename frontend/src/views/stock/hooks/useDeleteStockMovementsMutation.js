import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteStockMovements } from "@api/stockApi.js";

/**
 * Custom hook untuk menghapus banyak mutasi stok sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useDeleteStockMovementsMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.deleted} mutasi stok berhasil dihapus`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useDeleteStockMovementsMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStockMovements,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};