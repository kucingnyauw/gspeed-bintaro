/**
 * ShiftsHistory - Komponen halaman untuk menampilkan riwayat semua shift dengan filter dan detail.
 *
 * @component
 * @returns {JSX.Element} Halaman riwayat shift
 */
import { useCallback, useMemo, useState } from "react";
import { ListFilter, RotateCcw } from "lucide-react";
import {
  Box, Chip, Typography, useTheme,
} from "@mui/material";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { ShiftDetailDialog, ShiftFilterDialog } from "@views/shifts/components";
import { useShiftsHistoryQuery, useShiftDialog, useShiftFilters } from "@views/shifts/hooks";

const ShiftsHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const { closeDetailDialog, detailDialog, openDetailDialog } = useShiftDialog();

  const {
    activeFilters, applyFilter, closeFilter, filterOpen, openFilter,
    resetFilter, setTempFilters, tempFilters,
  } = useShiftFilters();

  const params = useMemo(() => ({
    limit,
    page,
    search: debouncedSearch,
    status: activeFilters.status || undefined,
    cashierId: activeFilters.cashierId || undefined,
    startDate: activeFilters.startDate ? activeFilters.startDate.toISOString() : undefined,
    endDate: activeFilters.endDate ? activeFilters.endDate.toISOString() : undefined,
    sortBy: activeFilters.sortBy || "openedAt",
    sortOrder: activeFilters.sortOrder || "desc",
  }), [limit, page, debouncedSearch, activeFilters]);

  const { data, isLoading, refetch } = useShiftsHistoryQuery(params);

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

  const handleRowDoubleClick = useCallback((row) => {
    openDetailDialog(row.id);
  }, [openDetailDialog]);

  const renderRow = useCallback((row) => [
    <Typography key={`cashier-${row.id}`} variant="body2">{row.cashier?.fullName || "—"}</Typography>,

    <Chip key={`status-${row.id}`} color={row.status === "OPEN" ? "success" : "default"}
      label={row.status === "OPEN" ? "Aktif" : "Tutup"} size="small" variant="outlined"
      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />,

    <Typography key={`open-${row.id}`} variant="body2" color="text.secondary">
      {formatDateTime(row.openedAt)}
    </Typography>,

    <Typography key={`close-${row.id}`} variant="body2" color="text.secondary">
      {row.closedAt ? formatDateTime(row.closedAt) : "—"}
    </Typography>,

    <Typography key={`start-${row.id}`} variant="body2">{formatToIdr(row.startingCash)}</Typography>,

    <Typography key={`end-${row.id}`} variant="body2">
      {row.endingCash !== null && row.endingCash !== undefined ? formatToIdr(row.endingCash) : "—"}
    </Typography>,

    <Box key={`sales-${row.id}`}>
      <Typography variant="body2">{formatToIdr(row.cashSales ?? 0)}</Typography>
      <Typography variant="caption" color="text.secondary">{row.totalOrders} order</Typography>
    </Box>,

    <Box key={`diff-${row.id}`}>
      <Typography variant="body2" color={row.discrepancy !== 0 ? "error.main" : "text.primary"}>
        {formatToIdr(row.discrepancy ?? 0)}
      </Typography>
      {row.status === "CLOSED" && row.expectedCash !== null && (
        <Typography variant="caption" color="text.secondary">
          Ekspektasi: {formatToIdr(row.expectedCash)}
        </Typography>
      )}
    </Box>,
  ], []);

  const tableActions = useMemo(() => [
    { icon: ListFilter, label: "Filter", onClick: openFilter },
    { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
  ], [openFilter, refetch]);

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
        emptyStateMessage="Tidak ada shift ditemukan"
        headers={["Kasir", "Status", "Waktu Buka", "Waktu Tutup", "Saldo Awal", "Saldo Akhir", "Penjualan", "Selisih"]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari shift..."
        searchVal={search}
        subtitle="Riwayat seluruh shift kasir"
        title="Semua Shift"
      />

      <ShiftFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ShiftDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        shiftId={detailDialog.shiftId}
        showExpectedCash
      />
    </>
  );
};

export default ShiftsHistory;