import { useQuery } from "@tanstack/react-query";
import { getExpenses, getUserExpenses } from "@api/expenseApi.js";
import { STALE_TIME } from "@shared/constant";

/**
 * Custom hook untuk mengambil riwayat semua pengeluaran.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.category] - Filter berdasarkan kategori.
 * @param {string} [params.startDate] - Filter tanggal mulai.
 * @param {string} [params.endDate] - Filter tanggal akhir.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useExpensesHistoryQuery({ page: 1, limit: 10 });
 */
export const useExpensesHistoryQuery = (params) => {
  return useQuery({
    queryKey: ["expenses-history", params],
    queryFn: () => getExpenses(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Custom hook untuk mengambil daftar pengeluaran user yang sedang login.
 *
 * @param {Object} [params] - Parameter query untuk filter/pagination.
 * @param {number} [params.page] - Nomor halaman.
 * @param {number} [params.limit] - Jumlah item per halaman.
 * @param {string} [params.category] - Filter berdasarkan kategori.
 * @param {string} [params.startDate] - Filter tanggal mulai.
 * @param {string} [params.endDate] - Filter tanggal akhir.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useUserExpensesQuery({ page: 1, limit: 10 });
 */
export const useUserExpensesQuery = (params) => {
  return useQuery({
    queryKey: ["user-expenses", params],
    queryFn: () => getUserExpenses(params),
    staleTime: STALE_TIME,
  });
};