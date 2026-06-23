import { useCallback, useMemo, useState } from "react";
import { Download, ListFilter, RotateCcw } from "lucide-react";
import { Box, Chip, Stack, Typography, useTheme } from "@mui/material";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  OrderDetailDialog,
  OrderExportDialog,
  OrderFilterDialog,
} from "@views/orders/components";
import {
  useOrderDialog,
  useOrderFilters,
  useOrderHistoryQuery,
} from "@views/orders/hooks";

const OrderHistory = () => {
  const theme = useTheme();

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");

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
  } = useOrderFilters();

  const {
    closeDetailDialog,
    closeExportDialog,
    detailDialog,
    exportDialog,
    openDetailDialog,
    openExportDialog,
  } = useOrderDialog();

  const params = useMemo(
    () => ({
      customerId: activeFilters.customer?.id || undefined,
      endDate: activeFilters.endDate
        ? activeFilters.endDate.toISOString()
        : undefined,
      limit,
      page,
      search: debouncedSearch,
      startDate: activeFilters.startDate
        ? activeFilters.startDate.toISOString()
        : undefined,
      status: activeFilters.status || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useOrderHistoryQuery(params);

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

  const getItemTypeChip = (row) => {
    const hasService = row.items?.some(
      (item) => item.product?.type === "SERVICE"
    );
    const hasSparepart = row.items?.some(
      (item) => item.product?.type === "SPAREPART"
    );

    if (hasService && hasSparepart) {
      return (
        <Chip
          label="Campuran"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (hasService) {
      return (
        <Chip
          label="Servis"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (hasSparepart) {
      return (
        <Chip
          label="Sparepart"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    return (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    );
  };

  const getPaymentChip = (row) => {
    const status = row.paymentStatus;

    if (status === "Lunas") {
      return (
        <Chip
          label="Lunas"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (status === "Menunggu Pembayaran" || status === "Belum Bayar") {
      return (
        <Chip
          label={status}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    if (status === "Direfund") {
      return (
        <Chip
          label="Direfund"
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 400 }}
        />
      );
    }
    return (
      <Chip
        label={status || "—"}
        size="small"
        color="error"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />
    );
  };

  const renderRow = useCallback((row) => {
    return [
      <Typography key={`order-${row.id}`} variant="body2" fontWeight={400}>
        {row.orderNumber}
      </Typography>,
      <Typography key={`total-${row.id}`} variant="body2" fontWeight={400}>
        {formatToIdr(row.total)}
      </Typography>,
      <Chip
        key={`status-${row.id}`}
        color={statusColorMap[row.status] || "default"}
        label={normalizeEnumText(OrderStatus[row.status] || row.status)}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,
      <Box key={`payment-${row.id}`}>{getPaymentChip(row)}</Box>,
      <Box key={`items-${row.id}`}>
        <Typography
          variant="body2"
          fontWeight={400}
          sx={{
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.items?.[0]?.productName || "—"}
        </Typography>
        {row.totalItems > 1 && (
          <Typography variant="caption" color="text.secondary" fontWeight={400}>
            +{row.totalItems - 1} item lainnya
          </Typography>
        )}
      </Box>,
      <Box key={`type-${row.id}`}>{getItemTypeChip(row)}</Box>,
      <Typography key={`customer-${row.id}`} variant="body2" fontWeight={400}>
        {row.customer?.name || "—"}
      </Typography>,
      <Typography key={`cashier-${row.id}`} variant="body2" fontWeight={400}>
        {row.cashier?.fullName || "—"}
      </Typography>,
      <Typography
        key={`date-${row.id}`}
        variant="body2"
        color="text.secondary"
        fontWeight={400}
      >
        {formatDateTime(row.createdAt)}
      </Typography>,
    ];
  }, []);

  const tableHeaders = useMemo(() => {
    return [
      "No. Order",
      "Total",
      "Status",
      "Pembayaran",
      "Item",
      "Tipe",
      "Pelanggan",
      "Kasir",
      "Tanggal",
    ];
  }, []);

  const tableActions = useMemo(() => {
    return [
      { icon: Download, label: "Export CSV", onClick: openExportDialog },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
    ];
  }, [openExportDialog, openFilter, refetch]);

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
        emptyStateMessage="Tidak ada pesanan ditemukan"
        headers={tableHeaders}
        isLoading={isLoading}
        onChange={handlePageChange}
        onRowDoubleClick={handleRowDoubleClick}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={onSearchChange}
        page={metadata.currentPage || page}
        renderRow={renderRow}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25, 50]}
        searchPlaceholder="Cari pesanan..."
        searchVal={search}
        subtitle="Semua riwayat pesanan pelanggan"
        title="Riwayat Pesanan"
      />

      <OrderFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <OrderDetailDialog
        orderId={detailDialog.order?.id}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />

      <OrderExportDialog open={exportDialog} onClose={closeExportDialog} />
    </>
  );
};

export default OrderHistory;
