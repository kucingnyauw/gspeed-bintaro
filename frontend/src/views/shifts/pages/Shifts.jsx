import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ListFilter,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { AppTable } from "@components";
import { formatDateTime, formatToIdr } from "@shared/utils";
import {
  ShiftCashDialog,
  ShiftCloseDialog,
  ShiftOpenDialog,
  ShiftDetailDialog,
  ShiftFilterDialog,
} from "@views/shifts/components";
import {
  useShiftDialog,
  useShiftFilters,
  useShiftsQuery,
} from "@views/shifts/hooks";

const Shifts = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    openDialog,
    cashDialog,
    closeCashDialog,
    closeCloseDialog,
    closeDialog,
    closeOpenDialog,
    closeDetailDialog,
    detailDialog,
    openCashDialog,
    openCloseDialog,
    openDetailDialog,
    openOpenDialog,
    selectedShiftId,
  } = useShiftDialog();

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useShiftFilters();

  const params = useMemo(
    () => ({
      endDate: activeFilters.endDate ? activeFilters.endDate.toISOString() : undefined,
      limit,
      page,
      startDate: activeFilters.startDate ? activeFilters.startDate.toISOString() : undefined,
      status: activeFilters.status || undefined,
    }),
    [page, limit, activeFilters]
  );

  const { data, isLoading, refetch } = useShiftsQuery(params);

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
    (row) => { openDetailDialog(row.id); },
    [openDetailDialog]
  );

  const handleCashAction = useCallback(
    (e, row, type) => {
      e.stopPropagation();
      if (row.status !== "OPEN") return;
      openCashDialog(row.id, type);
    },
    [openCashDialog]
  );

  const handleCloseAction = useCallback(
    (e, row) => {
      e.stopPropagation();
      if (row.status !== "OPEN") return;
      openCloseDialog(row.id);
    },
    [openCloseDialog]
  );

  const renderRow = useCallback(
    (row) => {
      const isOpen = row.status === "OPEN";

      return [
        <Typography key={`cashier-${row.id}`} variant="body2">
          {row.cashier?.fullName ?? "—"}
        </Typography>,

        <Chip
          key={`status-${row.id}`}
          color={isOpen ? "success" : "default"}
          label={isOpen ? "Aktif" : "Tutup"}
          size="small"
          variant="outlined"
        />,

        <Typography key={`open-${row.id}`} variant="body2" color="text.secondary">
          {formatDateTime(row.openedAt)}
        </Typography>,

        <Typography key={`close-${row.id}`} variant="body2" color="text.secondary">
          {row.closedAt ? formatDateTime(row.closedAt) : "—"}
        </Typography>,

        <Typography key={`start-${row.id}`} variant="body2">
          {formatToIdr(row.startingCash)}
        </Typography>,

        <Typography key={`end-${row.id}`} variant="body2">
          {row.endingCash !== null && row.endingCash !== undefined ? formatToIdr(row.endingCash) : "—"}
        </Typography>,

        <Box key={`sales-${row.id}`}>
          <Typography variant="body2">
            {formatToIdr(row.cashSales ?? 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.totalOrders} order
          </Typography>
        </Box>,

        <Box key={`diff-${row.id}`}>
          <Typography
            variant="body2"
            color={row.discrepancy !== 0 ? "error.main" : "text.primary"}
          >
            {formatToIdr(row.discrepancy ?? 0)}
          </Typography>
          {row.status === "CLOSED" && row.expectedCash !== null && (
            <Typography variant="caption" color="text.secondary">
              Ekspektasi: {formatToIdr(row.expectedCash)}
            </Typography>
          )}
        </Box>,

        <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
          <Tooltip title={isOpen ? "Kas Masuk" : "Shift sudah ditutup"}>
            <Box component="span" sx={{ display: "inline-flex" }}>
              <IconButton
                size="small"
                onClick={(e) => handleCashAction(e, row, "in")}
                disabled={!isOpen}
                aria-label="Kas Masuk"
                sx={{
                  border: "1px solid",
                  borderColor: isOpen ? alpha(theme.palette.divider, 0.8) : alpha(theme.palette.divider, 0.4),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: isOpen ? alpha(theme.palette.background.paper, 0.6) : "transparent",
                  color: isOpen ? theme.palette.text.secondary : theme.palette.action.disabled,
                  transition: theme.transitions.create(["background-color", "border-color", "color"], { duration: theme.transitions.duration.shorter }),
                  "&:hover": isOpen ? {
                    bgcolor: alpha(theme.palette.success.main, 0.06),
                    borderColor: alpha(theme.palette.success.main, 0.4),
                    color: theme.palette.success.main,
                  } : {},
                }}
              >
                <ArrowDownCircle size={16} strokeWidth={1.5} />
              </IconButton>
            </Box>
          </Tooltip>

          <Tooltip title={isOpen ? "Kas Keluar" : "Shift sudah ditutup"}>
            <Box component="span" sx={{ display: "inline-flex" }}>
              <IconButton
                size="small"
                onClick={(e) => handleCashAction(e, row, "out")}
                disabled={!isOpen}
                aria-label="Kas Keluar"
                sx={{
                  border: "1px solid",
                  borderColor: isOpen ? alpha(theme.palette.divider, 0.8) : alpha(theme.palette.divider, 0.4),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: isOpen ? alpha(theme.palette.background.paper, 0.6) : "transparent",
                  color: isOpen ? theme.palette.text.secondary : theme.palette.action.disabled,
                  transition: theme.transitions.create(["background-color", "border-color", "color"], { duration: theme.transitions.duration.shorter }),
                  "&:hover": isOpen ? {
                    bgcolor: alpha(theme.palette.error.main, 0.06),
                    borderColor: alpha(theme.palette.error.main, 0.4),
                    color: theme.palette.error.main,
                  } : {},
                }}
              >
                <ArrowUpCircle size={16} strokeWidth={1.5} />
              </IconButton>
            </Box>
          </Tooltip>

          <Tooltip title={isOpen ? "Tutup Shift" : "Shift sudah ditutup"}>
            <Box component="span" sx={{ display: "inline-flex" }}>
              <IconButton
                size="small"
                onClick={(e) => handleCloseAction(e, row)}
                disabled={!isOpen}
                aria-label="Tutup Shift"
                sx={{
                  border: "1px solid",
                  borderColor: isOpen ? alpha(theme.palette.divider, 0.8) : alpha(theme.palette.divider, 0.4),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: isOpen ? alpha(theme.palette.background.paper, 0.6) : "transparent",
                  color: isOpen ? theme.palette.text.secondary : theme.palette.action.disabled,
                  transition: theme.transitions.create(["background-color", "border-color", "color"], { duration: theme.transitions.duration.shorter }),
                  "&:hover": isOpen ? {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    borderColor: alpha(theme.palette.secondary.main, 0.4),
                    color: theme.palette.secondary.main,
                  } : {},
                }}
              >
                <XCircle size={16} strokeWidth={1.5} />
              </IconButton>
            </Box>
          </Tooltip>
        </Stack>,
      ];
    },
    [handleCashAction, handleCloseAction, theme]
  );

  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Buka Shift", onClick: openOpenDialog },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ],
    [openOpenDialog, openFilter, refetch]
  );

  const handlePageChange = useCallback((event, newPage) => { setPage(newPage); }, []);
  const handleRowsPerPageChange = useCallback((newLimit) => { setLimit(newLimit); setPage(1); }, []);

  return (
    <>
      <AppTable
        actions={tableActions}
        count={metadata.totalPages || 0}
        data={tableData}
        emptyStateMessage="Tidak ada shift ditemukan"
        headers={["Kasir", "Status", "Waktu Buka", "Waktu Tutup", "Saldo Awal", "Saldo Akhir", "Penjualan Tunai", "Selisih", "Aksi"]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        subtitle="Pilih shift aktif untuk mengelola operasional"
        title="Daftar Shift"
      />

      <ShiftFilterDialog onApply={handleApplyFilter} onClose={closeFilter} onFilterChange={setTempFilters} onReset={handleResetFilter} open={filterOpen} tempFilters={tempFilters} />
      <ShiftOpenDialog onClose={closeOpenDialog} open={openDialog} />
      <ShiftCloseDialog onClose={closeCloseDialog} open={closeDialog} shiftId={selectedShiftId} />
      <ShiftCashDialog onClose={closeCashDialog} open={cashDialog.open} shiftId={selectedShiftId} type={cashDialog.type} />
      <ShiftDetailDialog onClose={closeDetailDialog} open={detailDialog.open} shiftId={detailDialog.shiftId} />
    </>
  );
};

export default Shifts;