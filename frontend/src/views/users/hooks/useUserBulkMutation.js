import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateUsers, activateUsers } from "@api/userApi.js";

/**
 * Custom hook untuk menonaktifkan banyak user sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useDeactivateUsersMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.deactivated} user berhasil dinonaktifkan`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useDeactivateUsersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUsers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};

/**
 * Custom hook untuk mengaktifkan banyak user sekaligus.
 *
 * @param {Object} options - Opsi konfigurasi.
 * @param {function} [options.onSuccess] - Callback setelah berhasil.
 * @param {function} [options.onFailed] - Callback jika gagal.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 *
 * @example
 * const mutation = useActivateUsersMutation({
 *   onSuccess: (data) => {
 *     toast.success(`${data.summary.activated} user berhasil diaktifkan`);
 *   },
 * });
 *
 * mutation.mutate(["id1", "id2"]);
 */
export const useActivateUsersMutation = ({ onSuccess, onFailed } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUsers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.(data);
    },
    onError: (error) => {
      onFailed?.(error);
    },
  });
};