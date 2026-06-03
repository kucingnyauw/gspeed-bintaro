import { useCallback, useMemo, useState } from "react";
import { Download, ListFilter, Printer, RotateCcw, Undo2 } from "lucide-react";
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

import { AppTable, Invoice } from "@components";
import { useDebounce } from "@hooks";
import { PaymentMethod, paymentStatusColorMap } from "@shared/constant";
import { downloadPdf, formatDateTime, formatToIdr } from "@shared/utils";
import {
  PaymentBulkRefundDialog,
  PaymentDetailDialog,
  PaymentExportDialog,
  PaymentFilterDialog,
  RefundPaymentDialog,
} from "@views/payments/components";
import {
  usePaymentDialog,
  usePaymentFilters,
  usePaymentsQuery,
} from "@views/payments/hooks";

const Payments = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const debouncedSearch = useDebounce(search);

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = usePaymentFilters();

  const {
    bulkRefundDialog,
    detailDialog,
    refundDialog,
    clearSelection,
    closeBulkRefundDialog,
    closeDetailDialog,
    closeRefundDialog,
    openBulkRefundDialog,
    openDetailDialog,
    openRefundDialog,
    setRefundReason,
  } = usePaymentDialog();

  const params = useMemo(
    () => ({
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
      limit,
      method: activeFilters.method || undefined,
      page,
      search: debouncedSearch,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      status: activeFilters.status || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = usePaymentsQuery(params);

  const tableData = data?.data || [];
  const metadata = data?.metadata || {};

  const handlePrintInvoice = useCallback((row) => {
    downloadPdf({
      component: <Invoice data={row} />,
      fileName: `Invoice-${row.order?.orderNumber || "payment"}.pdf`,
    });
  }, []);

  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  const handleBulkRefund = useCallback(
    (ids) => {
      openBulkRefundDialog(ids, ids.length);
    },
    [openBulkRefundDialog]
  );

  const handleCloseBulkRefund = useCallback(() => {
    closeBulkRefundDialog();
    setSelectedRows([]);
  }, [closeBulkRefundDialog]);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedRows(newSelection);
  }, []);

  const renderRow = useCallback(
    (row) => [
      <Typography key={`order-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.order?.orderNumber || "—"}
      </Typography>,

      <Typography key={`method-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {PaymentMethod[row.method] || row.method}
      </Typography>,

      <Typography key={`paid-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {formatToIdr(row.amountPaid)}
      </Typography>,

      <Typography key={`change-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {formatToIdr(row.change)}
      </Typography>,

      <Chip
        key={`status-${row.id}`}
        color={paymentStatusColorMap[row.status] || "default"}
        label={row.statusLabel}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Typography key={`cashier-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.order?.cashier?.fullName || "—"}
      </Typography>,

      <Typography key={`customer-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.order?.customer?.name || "—"}
      </Typography>,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title={row.status === "PAID" ? "Cetak Invoice" : "Invoice belum tersedia"}>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrintInvoice(row);
              }}
              disabled={row.status !== "PAID"}
              size="small"
              aria-label="Cetak Invoice"
              sx={{
                border: "1px solid",
                borderColor: row.status === "PAID"
                  ? alpha(theme.palette.divider, 0.8)
                  : alpha(theme.palette.divider, 0.4),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: row.status === "PAID"
                  ? alpha(theme.palette.background.paper, 0.6)
                  : "transparent",
                color: row.status === "PAID"
                  ? theme.palette.text.secondary
                  : theme.palette.action.disabled,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": row.status === "PAID"
                  ? {
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      color: theme.palette.secondary.main,
                    }
                  : {},
              }}
            >
              <Printer size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip title={row.status === "PAID" ? "Refund Pembayaran" : row.status === "REFUNDED" ? "Sudah direfund" : "Pembayaran belum lunas"}>
  <Box component="span" sx={{ display: "inline-flex" }}>
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        if (row.status === "PAID") openRefundDialog(row);
      }}
      disabled={row.status !== "PAID"}
      size="small"
      aria-label="Refund Pembayaran"
      sx={{
        border: "1px solid",
        borderColor: row.status === "PAID"
          ? alpha(theme.palette.divider, 0.8)
          : alpha(theme.palette.divider, 0.4),
        borderRadius: `${theme.shape.borderRadius}px`,
        bgcolor: row.status === "PAID"
          ? alpha(theme.palette.background.paper, 0.6)
          : "transparent",
        color: row.status === "PAID"
          ? theme.palette.text.secondary
          : theme.palette.action.disabled,
        transition: theme.transitions.create(
          ["background-color", "border-color", "color"],
          { duration: theme.transitions.duration.shorter }
        ),
        "&:hover": row.status === "PAID"
          ? {
              bgcolor: alpha(theme.palette.error.main, 0.06),
              borderColor: alpha(theme.palette.error.main, 0.4),
              color: theme.palette.error.main,
            }
          : {},
      }}
    >
      <Undo2 size={16} strokeWidth={1.5} />
    </IconButton>
  </Box>
</Tooltip>
      </Stack>,
    ],
    [handlePrintInvoice, openRefundDialog, theme]
  );

  const tableActions = useMemo(
    () => [
      { icon: Download, label: "Export CSV", onClick: () => setExportOpen(true) },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
      { icon: Undo2, label: "Refund Terpilih", onClick: handleBulkRefund, isBulkAction: true },
    ],
    [openFilter, refetch, handleBulkRefund]
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
        emptyStateMessage="Tidak ada data pembayaran"
        enableMultiSelect
        headers={[
          "No. Order",
          "Metode",
          "Dibayar",
          "Kembalian",
          "Status",
          "Kasir",
          "Customer",
          "Tanggal",
          "Aksi",
        ]}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        onSelectionChange={handleSelectionChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari pembayaran..."
        searchVal={search}
        selectedRows={selectedRows}
        subtitle="Riwayat pembayaran pesanan"
        title="Data Pembayaran"
      />

      <PaymentExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      <PaymentFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <RefundPaymentDialog
        onClose={closeRefundDialog}
        onReasonChange={setRefundReason}
        open={refundDialog.open}
        payment={refundDialog.payment}
        reason={refundDialog.reason}
      />

      <PaymentBulkRefundDialog
        selectedIds={bulkRefundDialog.selectedIds}
        selectedCount={bulkRefundDialog.selectedCount}
        onClose={handleCloseBulkRefund}
        onClearSelection={clearSelection}
        open={bulkRefundDialog.open}
      />

      <PaymentDetailDialog
        onClose={closeDetailDialog}
        open={detailDialog.open}
        paymentId={detailDialog.paymentId}
      />
    </>
  );
};

export default Payments;