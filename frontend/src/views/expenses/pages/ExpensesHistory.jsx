/**
 * ExpenseHistory - Komponen halaman untuk melihat riwayat pengeluaran dengan filter dan pencarian.
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

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

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      category: activeFilters.category || undefined,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
      sortBy: activeFilters.sortBy || "date",
      sortOrder: activeFilters.sortOrder || "desc",
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useExpensesHistoryQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

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
              fontWeight: 400,
              display: "block",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.description}
          </Typography>
        )}
      </Box>,

      <Typography key={`amount-${row.id}`} variant="body2" color="error.main" sx={{ fontWeight: 400 }}>
        -{formatToIdr(row.amount)}
      </Typography>,

      <Chip
        key={`category-${row.id}`}
        color={expenseCategoryColorMap[row.category] || "default"}
        label={normalizeEnumText(ExpenseCategory[row.category] || row.category)}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Box key={`shift-${row.id}`}>
        <Typography variant="body2" sx={{ fontWeight: 400 }}>
          {row.shift?.id ? formatDateTime(row.shift.openedAt) : "—"}
        </Typography>
        {row.shift?.id && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
            {row.shift.closedAt ? `s/d ${formatDateTime(row.shift.closedAt)}` : "Masih berjalan"}
          </Typography>
        )}
      </Box>,

      <Typography key={`recordedBy-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.recordedBy?.fullName || "—"}
      </Typography>,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
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
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.8),
            }}
          />
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 400 }}>
            —
          </Typography>
        )}
      </Box>,
    ],
    [theme]
  );

  const tableActions = useMemo(
    () => [
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openFilter, refetch]
  );

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

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