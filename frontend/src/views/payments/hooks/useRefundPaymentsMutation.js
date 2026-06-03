import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refundPayments } from "@api/paymentApi.js";

/**
 * Custom hook untuk refund banyak pembayaran sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useRefundPaymentsMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.refunded} pembayaran berhasil direfund`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useRefundPaymentsMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refundPayments,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};