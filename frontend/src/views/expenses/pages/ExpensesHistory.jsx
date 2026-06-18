/**
 * ExpenseHistory - Halaman riwayat pengeluaran (read-only).
 *
 * Fitur:
 * - Tabel riwayat pengeluaran dengan kolom: Judul, Jumlah, Kategori, Shift, Pencatat, Tanggal, Nota
 * - Pencarian real-time dengan debounce
 * - Filter berdasarkan kategori, rentang tanggal, dan sorting
 * - Detail pengeluaran dengan double-click
 * - Preview thumbnail nota
 * - Server-side pagination
 * - Read-only (tidak ada aksi edit/hapus)
 *
 * @component
 * @returns {JSX.Element} Halaman riwayat pengeluaran
 */
import { useCallback, useMemo, useState } from "react";
import { ListFilter, RotateCcw } from "lucide-react";
import { Box, Chip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { ExpenseCategory, expenseCategoryColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  ExpenseDetailDialog,
  ExpenseFilterDialog,
} from "@views/expenses/components";
import {
  useExpenseDialog,
  useExpenseFilters,
  useExpensesHistoryQuery,
} from "@views/expenses/hooks";

const ExpenseHistory = () => {
  const theme = useTheme();

  /** @type {[number, Function]} */
  const [page, setPage] = useState(1);

  /** @type {[number, Function]} */
  const [limit, setLimit] = useState(10);

  /** @type {[string, Function]} */
  const [search, setSearch] = useState("");

  /** @type {string} */
  const debouncedSearch = useDebounce(search);

  const { detailDialog, openDetailDialog, closeDetailDialog } = useExpenseDialog();

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useExpenseFilters();

  /**
   * Query params untuk fetch data.
   *
   * @type {Object}
   */
  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      category: activeFilters.category || undefined,
      startDate: activeFilters.startDate ? activeFilters.startDate.toISOString() : undefined,
      endDate: activeFilters.endDate ? activeFilters.endDate.toISOString() : undefined,
      sortBy: activeFilters.sortBy || "date",
      sortOrder: activeFilters.sortOrder || "desc",
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useExpensesHistoryQuery(params);

  /** @type {Array} */
  const tableData = data?.data || [];

  /** @type {Object} */
  const metadata = data?.metadata || {};

  /**
   * Apply filter & reset ke halaman 1.
   */
  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  /**
   * Reset filter & reset ke halaman 1.
   */
  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  /**
   * Handler double-click row untuk buka detail.
   *
   * @param {Object} row - Data pengeluaran
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  /**
   * Render satu baris tabel riwayat pengeluaran.
   *
   * @param {Object} row - Data pengeluaran
   * @param {string} row.id - ID
   * @param {string} row.title - Judul
   * @param {string} [row.description] - Deskripsi
   * @param {number} row.amount - Jumlah
   * @param {string} row.category - Kategori
   * @param {Object} [row.shift] - Data shift
   * @param {Object} row.recordedBy - Pencatat
   * @param {string} row.date - Tanggal
   * @param {Object} [row.receipt] - Nota
   * @returns {JSX.Element[]} Elemen sel tabel
   */
  const renderRow = useCallback(
    (row) => [
      <Box key={`title-${row.id}`}>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {row.title}
        </Typography>
        {row.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mt: 0.25,
            }}
          >
            {row.description}
          </Typography>
        )}
      </Box>,

      <Typography key={`amount-${row.id}`} variant="body2" sx={{ fontWeight: 400, color: "error.main" }}>
        -{formatToIdr(row.amount)}
      </Typography>,

      <Chip
        key={`category-${row.id}`}
        color={expenseCategoryColorMap[row.category] || "default"}
        label={normalizeEnumText(ExpenseCategory[row.category] || row.category)}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400, height: 24 }}
      />,

      <Box key={`shift-${row.id}`}>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {row.shift?.id ? formatDateTime(row.shift.openedAt) : "—"}
        </Typography>
        {row.shift?.id && (
          <Typography variant="caption" color="text.secondary">
            {row.shift.closedAt ? `s/d ${formatDateTime(row.shift.closedAt)}` : "Masih berjalan"}
          </Typography>
        )}
      </Box>,

      <Typography key={`recordedBy-${row.id}`} variant="body2" color="text.secondary">
        {row.recordedBy?.fullName || "—"}
      </Typography>,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary">
        {formatDateTime(row.date)}
      </Typography>,

      <Box key={`receipt-${row.id}`}>
        {row.receipt?.url ? (
          <Box
            component="img"
            src={row.receipt.url}
            alt="Nota"
            sx={{
              width: 48,
              height: 48,
              borderRadius: `${theme.shape.borderRadius}px`,
              objectFit: "cover",
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            }}
          />
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        )}
      </Box>,
    ],
    [theme]
  );

  /**
   * Action buttons di header tabel.
   *
   * @type {Array<{icon: React.ElementType, label: string, onClick: Function}>}
   */
  const tableActions = useMemo(
    () => [
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openFilter, refetch]
  );

  /**
   * Handler perubahan halaman.
   *
   * @param {Object} event - Event change
   * @param {number} newPage - Nomor halaman baru
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Handler perubahan jumlah baris per halaman.
   *
   * @param {number} newLimit - Jumlah baris baru
   */
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Handler perubahan input pencarian.
   *
   * @param {React.ChangeEvent} e - Event change
   */
  const onSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <>
      <AppTable
        actions={tableActions}
        count={metadata.totalPages || 0}
        data={tableData}
        emptyStateMessage="Tidak ada riwayat pengeluaran"
        headers={["Judul", "Jumlah", "Kategori", "Shift", "Pencatat", "Tanggal", "Nota"]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari pengeluaran..."
        searchVal={search}
        subtitle="Riwayat pengeluaran bengkel"
        title="Riwayat Pengeluaran"
      />

      <ExpenseFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ExpenseDetailDialog
        expense={detailDialog.expense}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />
    </>
  );
};

export default ExpenseHistory;