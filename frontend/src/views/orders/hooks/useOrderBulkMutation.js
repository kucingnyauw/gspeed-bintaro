import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrders, closeOrders } from "@api/orderApi.js";

/**
 * Custom hook untuk membatalkan banyak pesanan sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useCancelOrdersMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.cancelled} pesanan berhasil dibatalkan`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useCancelOrdersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrders,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};

/**
 * Custom hook untuk menutup banyak pesanan sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useCloseOrdersMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.closed} pesanan berhasil ditutup`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useCloseOrdersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeOrders,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};
