/**
 * Customers - Halaman manajemen data pelanggan.
 *
 * Fitur:
 * - Tabel pelanggan dengan kolom: Nama, Telepon, Kendaraan, Order, Tanggal Daftar
 * - Pencarian real-time dengan debounce
 * - Multi-select untuk bulk delete
 * - CRUD: Create (stepper form), Update, Delete, Bulk Delete
 * - Detail pelanggan dengan double-click
 * - Server-side pagination
 * - Action buttons dengan tooltip dan hover effect
 *
 * @component
 * @returns {JSX.Element} Halaman data pelanggan
 */
import { useCallback, useMemo, useState } from "react";
import { FilePenLine, Plus, RotateCcw, Trash2 } from "lucide-react";
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
import { useDebounce } from "@hooks";
import { formatDateTime } from "@shared/utils";
import {
  CustomerBulkDeleteDialog,
  CustomerCreateDialog,
  CustomerDeleteDialog,
  CustomerDetailDialog,
  CustomerUpdateDialog,
} from "@views/customers/components";
import {
  useCustomerCreateForm,
  useCustomerDialog,
  useCustomersQuery,
  useCustomerUpdateForm,
} from "@views/customers/hooks";

const Customers = () => {
  const theme = useTheme();

  /** @type {[number, Function]} */
  const [page, setPage] = useState(1);

  /** @type {[number, Function]} */
  const [limit, setLimit] = useState(10);

  /** @type {[string, Function]} */
  const [search, setSearch] = useState("");

  /** @type {[string[], Function]} */
  const [selectedRows, setSelectedRows] = useState([]);

  /** @type {string} */
  const debouncedSearch = useDebounce(search);

  const {
    activeStep,
    bulkDeleteDialog,
    deleteDialog,
    detailDialog,
    dialogOpen,
    updateDialog,
    closeCreateDialog,
    closeBulkDeleteDialog,
    closeDeleteDialog,
    closeDetailDialog,
    closeUpdateDialog,
    clearSelection,
    handleBack,
    handleNext,
    openCreateDialog,
    openBulkDeleteDialog,
    openDeleteDialog,
    openDetailDialog,
    openUpdateDialog,
  } = useCustomerDialog();

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    trigger,
    formState: createFormState,
  } = useCustomerCreateForm();

  const {
    control: updateControl,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    formState: updateFormState,
  } = useCustomerUpdateForm();

  /**
   * Header kolom tabel.
   *
   * @type {string[]}
   */
  const headers = useMemo(
    () => ["Nama", "Telepon", "Kendaraan", "Order", "Terdaftar", "Aksi"],
    []
  );

  /**
   * Query params untuk fetch data.
   *
   * @type {Object}
   */
  const params = useMemo(
    () => ({ page, limit, search: debouncedSearch }),
    [page, limit, debouncedSearch]
  );

  const { data, isLoading, refetch } = useCustomersQuery(params);

  /** @type {Array} */
  const tableData = data?.data || [];

  /** @type {Object} */
  const metadata = data?.metadata || {};

  /**
   * Buka dialog create dengan form kosong.
   */
  const handleOpenCreate = useCallback(() => {
    resetCreate();
    openCreateDialog();
  }, [resetCreate, openCreateDialog]);

  /**
   * Tutup dialog create & reset form.
   */
  const handleCloseCreate = useCallback(() => {
    closeCreateDialog();
    resetCreate();
  }, [closeCreateDialog, resetCreate]);

  /**
   * Buka dialog update dengan data pelanggan.
   *
   * @param {Object} row - Data pelanggan
   */
  const handleOpenUpdate = useCallback(
    (row) => {
      resetUpdate({ name: row.name || "", phone: row.phone || "" });
      openUpdateDialog(row);
    },
    [resetUpdate, openUpdateDialog]
  );

  /**
   * Handler klik tombol edit.
   *
   * @param {React.MouseEvent} e - Event klik
   * @param {Object} row - Data pelanggan
   */
  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleOpenUpdate(row);
    },
    [handleOpenUpdate]
  );

  /**
   * Tutup dialog update & reset form.
   */
  const handleCloseUpdate = useCallback(() => {
    closeUpdateDialog();
    resetUpdate();
  }, [closeUpdateDialog, resetUpdate]);

  /**
   * Handler double-click row untuk buka detail.
   *
   * @param {Object} row - Data pelanggan
   */
  const handleRowDoubleClick = useCallback(
    (row) => {
      openDetailDialog(row.id);
    },
    [openDetailDialog]
  );

  /**
   * Handler klik tombol hapus.
   *
   * @param {React.MouseEvent} e - Event klik
   * @param {Object} row - Data pelanggan
   */
  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  /**
   * Handler bulk delete.
   *
   * @param {string[]} ids - Array ID yang dipilih
   */
  const handleBulkDelete = useCallback(
    (ids) => {
      openBulkDeleteDialog(ids, ids.length);
    },
    [openBulkDeleteDialog]
  );

  /**
   * Handler close bulk delete dialog.
   */
  const handleCloseBulkDelete = useCallback(() => {
    closeBulkDeleteDialog();
    setSelectedRows([]);
  }, [closeBulkDeleteDialog]);

  /**
   * Handler perubahan seleksi row.
   *
   * @param {string[]} newSelection - Array ID terpilih
   */
  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedRows(newSelection);
  }, []);

  /**
   * Render satu baris tabel pelanggan.
   *
   * @param {Object} row - Data pelanggan
   * @param {string} row.id - ID pelanggan
   * @param {string} row.name - Nama pelanggan
   * @param {string} [row.phone] - Nomor telepon
   * @param {number} row.totalVehicles - Jumlah kendaraan
   * @param {number} row.totalOrders - Jumlah order
   * @param {string} row.createdAt - Tanggal daftar
   * @returns {JSX.Element[]} Elemen sel tabel
   */
  const renderRow = useCallback(
    (row) => [
      <Typography key={`name-${row.id}`} variant="body2" sx={{ fontWeight: 500 }}>
        {row.name}
      </Typography>,

      <Typography key={`phone-${row.id}`} variant="body2" color="text.secondary">
        {row.phone || "—"}
      </Typography>,

      <Chip
        key={`vehicles-${row.id}`}
        label={row.totalVehicles ?? 0}
        size="small"
        variant="outlined"
        sx={{
          height: 24,
          fontWeight: 500,
          fontSize: "0.75rem",
          borderColor: alpha(theme.palette.divider, 0.6),
          color: "text.secondary",
        }}
      />,

      <Chip
        key={`orders-${row.id}`}
        label={row.totalOrders ?? 0}
        size="small"
        variant="outlined"
        sx={{
          height: 24,
          fontWeight: 500,
          fontSize: "0.75rem",
          borderColor: alpha(theme.palette.divider, 0.6),
          color: "text.secondary",
        }}
      />,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary">
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title="Edit Pelanggan" placement="top" arrow>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleEditClick(e, row)}
              size="small"
              aria-label="Edit Pelanggan"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                color: "text.secondary",
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  color: "secondary.main",
                },
              }}
            >
              <FilePenLine size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>

        <Tooltip title="Hapus Pelanggan" placement="top" arrow>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleDeleteClick(e, row)}
              size="small"
              aria-label="Hapus Pelanggan"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                color: "text.secondary",
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  borderColor: alpha(theme.palette.error.main, 0.4),
                  color: "error.main",
                },
              }}
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleEditClick, handleDeleteClick, theme]
  );

  /**
   * Action buttons di header tabel.
   *
   * @type {Array<{icon: React.ElementType, label: string, onClick: Function, isBulkAction?: boolean}>}
   */
  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Pelanggan", onClick: handleOpenCreate },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
      { icon: Trash2, label: "Hapus Terpilih", onClick: handleBulkDelete, isBulkAction: true },
    ],
    [handleOpenCreate, refetch, handleBulkDelete]
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
        emptyStateMessage="Tidak ada pelanggan ditemukan"
        enableMultiSelect
        headers={headers}
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
        searchPlaceholder="Cari pelanggan..."
        searchVal={search}
        selectedRows={selectedRows}
        subtitle="Kelola data pelanggan terdaftar"
        title="Data Pelanggan"
      />

      <CustomerCreateDialog
        activeStep={activeStep}
        control={createControl}
        handleSubmit={handleCreateSubmit}
        onBack={handleBack}
        onClose={handleCloseCreate}
        onNext={handleNext}
        open={dialogOpen}
        trigger={trigger}
        formState={createFormState}
      />

      <CustomerUpdateDialog
        control={updateControl}
        customer={updateDialog.customer}
        formState={updateFormState}
        handleSubmit={handleUpdateSubmit}
        onClose={handleCloseUpdate}
        open={updateDialog.open}
      />

      <CustomerDeleteDialog
        customer={deleteDialog.customer}
        onClose={closeDeleteDialog}
        open={deleteDialog.open}
      />

      <CustomerBulkDeleteDialog
        selectedIds={bulkDeleteDialog.selectedIds}
        selectedCount={bulkDeleteDialog.selectedCount}
        onClose={handleCloseBulkDelete}
        onClearSelection={clearSelection}
        open={bulkDeleteDialog.open}
      />

      <CustomerDetailDialog
        customerId={detailDialog.customerId}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />
    </>
  );
};

export default Customers;