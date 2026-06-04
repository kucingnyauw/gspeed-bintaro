import { useState, useCallback } from "react";

/**
 * Nilai default untuk filter user/karyawan.
 *
 * @constant {Object}
 * @property {string} isActive - Filter status keaktifan ("" untuk semua)
 */
const initialFilters = {
  isActive: "",
};

/**
 * Custom hook untuk mengelola state filter user/karyawan dengan mekanisme apply/temporary.
 *
 * Menyediakan sistem filter dua layer:
 * - `activeFilters`: Filter yang sedang aktif dan diterapkan ke query API.
 * - `tempFilters`: Filter sementara yang sedang diedit di UI (belum diterapkan).
 *
 * Pola ini memungkinkan pengguna mengubah-ubah filter di UI tanpa langsung
 * memicu query, dan hanya menerapkan perubahan saat tombol "Apply" ditekan.
 *
 * Alur kerja:
 * 1. `openFilter()` - Menyalin activeFilters ke tempFilters dan membuka panel
 * 2. `setTempFilters()` - Mengubah filter sementara saat pengguna berinteraksi
 * 3. `applyFilter()` - Menerapkan tempFilters ke activeFilters dan menutup panel
 * 4. `closeFilter()` - Menutup panel tanpa menyimpan perubahan
 * 5. `resetFilter()` - Mengembalikan semua filter ke nilai default
 *
 * Filter yang tersedia:
 * - `isActive`: Filter berdasarkan status aktif user ("" | "true" | "false")
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola filter
 * @returns {Object} return.activeFilters - Filter yang sedang aktif/diterapkan
 * @returns {Object} return.tempFilters - Filter sementara yang sedang diedit
 * @returns {boolean} return.filterOpen - Status apakah panel filter sedang terbuka
 * @returns {Function} return.setTempFilters - Setter untuk mengubah tempFilters
 * @returns {Function} return.openFilter - Membuka panel filter dan menginisialisasi tempFilters
 * @returns {Function} return.closeFilter - Menutup panel filter tanpa menyimpan perubahan
 * @returns {Function} return.applyFilter - Menerapkan tempFilters ke activeFilters dan menutup panel
 * @returns {Function} return.resetFilter - Mereset semua filter ke nilai default
 *
 * @example
 * const {
 *   activeFilters,
 *   tempFilters,
 *   filterOpen,
 *   setTempFilters,
 *   openFilter,
 *   closeFilter,
 *   applyFilter,
 *   resetFilter,
 * } = useUserFilters();
 *
 * const { data } = useUsersQuery({
 *   isActive: activeFilters.isActive !== "" ? activeFilters.isActive === "true" : undefined,
 * });
 */
export const useUserFilters = () => {
  /**
   * Filter yang sedang aktif dan diterapkan ke query API.
   * @type {[Object, Function]}
   */
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  /**
   * Filter sementara yang sedang diedit di UI.
   * Disalin dari activeFilters saat panel dibuka.
   * @type {[Object, Function]}
   */
  const [tempFilters, setTempFilters] = useState(initialFilters);

  /**
   * Status apakah panel/dialog filter sedang terbuka.
   * @type {[boolean, Function]}
   */
  const [filterOpen, setFilterOpen] = useState(false);

  /**
   * Membuka panel filter.
   * Menyalin nilai activeFilters ke tempFilters agar pengguna
   * dapat mengedit tanpa mempengaruhi filter yang sedang aktif.
   *
   * @type {Function}
   */
  const openFilter = useCallback(() => {
    setTempFilters({ ...activeFilters });
    setFilterOpen(true);
  }, [activeFilters]);

  /**
   * Menutup panel filter tanpa menyimpan perubahan.
   * tempFilters akan dibuang, activeFilters tetap tidak berubah.
   *
   * @type {Function}
   */
  const closeFilter = useCallback(() => {
    setFilterOpen(false);
  }, []);

  /**
   * Menerapkan tempFilters ke activeFilters.
   * Menyimpan perubahan filter dan menutup panel.
   * Setelah ini, komponen yang menggunakan activeFilters akan re-render.
   *
   * @type {Function}
   */
  const applyFilter = useCallback(() => {
    setActiveFilters({ ...tempFilters });
    setFilterOpen(false);
  }, [tempFilters]);

  /**
   * Mereset semua filter ke nilai default.
   * Mengembalikan tempFilters dan activeFilters ke initialFilters,
   * lalu menutup panel filter.
   *
   * @type {Function}
   */
  const resetFilter = useCallback(() => {
    setTempFilters({ ...initialFilters });
    setActiveFilters({ ...initialFilters });
    setFilterOpen(false);
  }, []);

  return {
    activeFilters,
    tempFilters,
    filterOpen,
    setTempFilters,
    openFilter,
    closeFilter,
    applyFilter,
    resetFilter,
  };
};