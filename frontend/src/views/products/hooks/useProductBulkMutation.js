import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateProducts, activateProducts } from "@api/productApi.js";

/**
 * Custom hook untuk menonaktifkan banyak produk sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useDeactivateProductsMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.deactivated} produk berhasil dinonaktifkan`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useDeactivateProductsMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};

/**
 * Custom hook untuk mengaktifkan banyak produk sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useActivateProductsMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.activated} produk berhasil diaktifkan`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useActivateProductsMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};