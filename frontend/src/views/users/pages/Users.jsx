/**
 * Users - Halaman manajemen data karyawan dengan fitur CRUD, filter, dan bulk actions.
 *
 * @module Users
 */
import { useCallback, useMemo, useState } from "react";
import {
  FilePenLine,
  ListFilter,
  Plus,
  RotateCcw,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
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
import { useDebounce } from "@hooks";
import { roleColorMap } from "@shared/constant";
import { formatDateTime, normalizeEnumText } from "@shared/utils";
import {
  DeleteUserDialog,
  UserBulkActivateDialog,
  UserBulkDeactivateDialog,
  UserDetailDialog,
  UserFilterDialog,
  UserFormDialog,
  UserResendDialog,
} from "@views/users/components";
import {
  useUsersQuery,
  useUserDialogs,
  useUserFilters,
} from "@views/users/hooks";

/**
 * Users - Halaman utama untuk mengelola data karyawan.
 *
 * Fitur:
 * - Tabel data karyawan dengan kolom: Nama, Email, Telepon, Role, Status, Verifikasi, Bergabung
 * - Pencarian karyawan dengan debounce
 * - Filter berdasarkan status keaktifan (Semua/Aktif/Nonaktif)
 * - Multi-select untuk bulk actions (Aktifkan/Nonaktifkan)
 * - CRUD operations: Tambah, Edit, Hapus karyawan
 * - Resend magic link untuk karyawan yang belum verifikasi
 * - Detail karyawan dengan double-click pada row
 * - Pagination dengan konfigurasi rows per page
 * - Tooltip pada setiap action button
 * - Icon button dengan border styling yang konsisten
 *
 * @component
 * @returns {JSX.Element} Halaman daftar karyawan
 */
const Users = () => {
  const theme = useTheme();

  /** @type {[number, Function]} State halaman saat ini */
  const [page, setPage] = useState(1);

  /** @type {[number, Function]} State jumlah item per halaman */
  const [limit, setLimit] = useState(10);

  /** @type {[string, Function]} State pencarian */
  const [search, setSearch] = useState("");

  /** @type {[string[], Function]} State ID baris yang dipilih */
  const [selectedRows, setSelectedRows] = useState([]);

  /** @type {string} Nilai pencarian yang sudah di-debounce */
  const debouncedSearch = useDebounce(search);

  /**
   * Hook untuk mengelola filter dialog.
   * @type {Object}
   * @property {Object} activeFilters - Filter yang sedang aktif
   * @property {Function} applyFilter - Terapkan filter
   * @property {Function} closeFilter - Tutup dialog filter
   * @property {boolean} filterOpen - Status dialog filter
   * @property {Function} openFilter - Buka dialog filter
   * @property {Function} resetFilter - Reset filter
   * @property {Function} setTempFilters - Set filter sementara
   * @property {Object} tempFilters - Filter sementara
   */
  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = useUserFilters();

  /**
   * Hook untuk mengelola semua dialog terkait user.
   * @type {Object}
   */
  const {
    createDialog,
    editDialog,
    deleteDialog,
    resendDialog,
    detailDialog,
    bulkDeactivateDialog,
    bulkActivateDialog,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openResendDialog,
    closeResendDialog,
    openDetailDialog,
    closeDetailDialog,
    openBulkDeactivateDialog,
    closeBulkDeactivateDialog,
    openBulkActivateDialog,
    closeBulkActivateDialog,
    clearSelection,
  } = useUserDialogs();

  /**
   * Parameter query untuk fetch data users.
   * Mengkonversi filter isActive ke boolean/undefined.
   *
   * @type {Object}
   */

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      isActive:
        activeFilters.isActive !== undefined && activeFilters.isActive !== ""
          ? activeFilters.isActive === "true"
          : undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  /**
   * Query untuk fetch data users.
   * @type {Object}
   * @property {Array} data - Data users
   * @property {Object} metadata - Metadata pagination
   * @property {boolean} isLoading - Status loading
   * @property {Function} refetch - Fungsi refresh data
   */
  const { data, isLoading, refetch } = useUsersQuery(params);

  /** @type {Array<Object>} Data tabel yang sudah di-flat */
  const tableData = data?.data || [];

  /** @type {Object} Metadata pagination */
  const metadata = data?.metadata || {};

  /**
   * Handler apply filter.
   * Terapkan filter dan reset ke halaman 1.
   *
   * @type {Function}
   */
  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  /**
   * Handler reset filter.
   * Reset filter dan kembali ke halaman 1.
   *
   * @type {Function}
   */
  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  /**
   * Handler klik tombol resend magic link.
   *
   * @param {React.MouseEvent} e - Event klik
   * @param {Object} user - Data user
   */
  const handleResendClick = useCallback(
    (e, user) => {
      e.stopPropagation();
      openResendDialog(user);
    },
    [openResendDialog]
  );

  /**
   * Handler klik tombol edit.
   *
   * @param {React.MouseEvent} e - Event klik
   * @param {Object} row - Data user
   */
  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openEditDialog(row);
    },
    [openEditDialog]
  );

  /**
   * Handler klik tombol hapus.
   *
   * @param {React.MouseEvent} e - Event klik
   * @param {Object} row - Data user
   */
  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  /**
   * Handler double-click pada row untuk membuka detail.
   *
   * @param {Object} row - Data user
   */
  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  /**
   * Handler bulk deactivate users.
   *
   * @param {string[]} ids - Array ID user yang dipilih
   */
  const handleBulkDeactivate = useCallback(
    (ids) => {
      openBulkDeactivateDialog(ids, ids.length);
    },
    [openBulkDeactivateDialog]
  );

  /**
   * Handler bulk activate users.
   *
   * @param {string[]} ids - Array ID user yang dipilih
   */
  const handleBulkActivate = useCallback(
    (ids) => {
      openBulkActivateDialog(ids, ids.length);
    },
    [openBulkActivateDialog]
  );

  /**
   * Handler close bulk deactivate dialog.
   * Reset selected rows setelah dialog ditutup.
   */
  const handleCloseBulkDeactivate = useCallback(() => {
    closeBulkDeactivateDialog();
    setSelectedRows([]);
  }, [closeBulkDeactivateDialog]);

  /**
   * Handler close bulk activate dialog.
   * Reset selected rows setelah dialog ditutup.
   */
  const handleCloseBulkActivate = useCallback(() => {
    closeBulkActivateDialog();
    setSelectedRows([]);
  }, [closeBulkActivateDialog]);

  /**
   * Handler perubahan seleksi row.
   *
   * @param {string[]} newSelection - Array ID yang baru dipilih
   */
  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedRows(newSelection);
  }, []);

  /**
   * Render function untuk setiap row tabel.
   * Menghasilkan array elemen JSX untuk setiap kolom.
   *
   * @param {Object} row - Data user per baris
   * @param {string} row.id - ID user
   * @param {string} row.fullName - Nama lengkap
   * @param {string} row.email - Email
   * @param {string} row.phone - Nomor telepon
   * @param {string} row.role - Role user
   * @param {boolean} row.isActive - Status keaktifan
   * @param {boolean} row.isAuthenticated - Status verifikasi
   * @param {string} row.createdAt - Tanggal bergabung
   * @returns {Array<JSX.Element>} Array elemen untuk setiap kolom
   */
  const renderRow = useCallback(
    (row) => [
      <Typography
        key={`name-${row.id}`}
        variant="body2"
        sx={{ fontWeight: 400 }}
      >
        {row.fullName}
      </Typography>,

      <Typography
        key={`email-${row.id}`}
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 400 }}
      >
        {row.email}
      </Typography>,

      <Typography
        key={`phone-${row.id}`}
        variant="body2"
        sx={{ fontWeight: 400 }}
      >
        {row.phone || "—"}
      </Typography>,

      <Chip
        key={`role-${row.id}`}
        label={normalizeEnumText(row.role)}
        size="small"
        color={roleColorMap[row.role] || "default"}
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Chip
        key={`status-${row.id}`}
        label={row.isActive ? "Aktif" : "Nonaktif"}
        color={row.isActive ? "success" : "default"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Chip
        key={`auth-${row.id}`}
        label={row.isAuthenticated ? "Terverifikasi" : "Pending"}
        color={row.isAuthenticated ? "success" : "warning"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 400 }}
      />,

      <Typography
        key={`date-${row.id}`}
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 400 }}
      >
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`actions-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        {/**
         * Tombol Resend Magic Link
         * Hanya aktif untuk user yang belum terverifikasi
         */}
        <Tooltip
          title={
            row.isAuthenticated
              ? "Sudah terverifikasi"
              : "Kirim Ulang Magic Link"
          }
        >
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              disabled={row.isAuthenticated}
              onClick={(e) => handleResendClick(e, row)}
              aria-label="Kirim Ulang Magic Link"
              sx={{
                border: "1px solid",
                borderColor: row.isAuthenticated
                  ? alpha(theme.palette.divider, 0.4)
                  : alpha(theme.palette.divider, 0.8),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: row.isAuthenticated
                  ? "transparent"
                  : alpha(theme.palette.background.paper, 0.6),
                color: row.isAuthenticated
                  ? theme.palette.action.disabled
                  : theme.palette.text.secondary,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": row.isAuthenticated
                  ? {}
                  : {
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      color: theme.palette.secondary.main,
                    },
              }}
            >
              <Send size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>

        {/**
         * Tombol Edit Karyawan
         */}
        <Tooltip title="Edit Karyawan">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              onClick={(e) => handleEditClick(e, row)}
              aria-label="Edit Karyawan"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                color: theme.palette.text.secondary,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  color: theme.palette.secondary.main,
                },
              }}
            >
              <FilePenLine size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>

        {/**
         * Tombol Hapus Karyawan
         */}
        <Tooltip title="Hapus Karyawan">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              size="small"
              onClick={(e) => handleDeleteClick(e, row)}
              aria-label="Hapus Karyawan"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                color: theme.palette.text.secondary,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.error.main, 0.06),
                  borderColor: alpha(theme.palette.error.main, 0.4),
                  color: theme.palette.error.main,
                },
              }}
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleEditClick, handleDeleteClick, handleResendClick, theme]
  );

  /**
   * Konfigurasi action buttons di header tabel.
   *
   * @type {Array<{icon: React.ComponentType, label: string, onClick: Function, isBulkAction?: boolean}>}
   */
  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Karyawan", onClick: openCreateDialog },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
      {
        icon: ToggleLeft,
        label: "Nonaktifkan",
        onClick: handleBulkDeactivate,
        isBulkAction: true,
      },
      {
        icon: ToggleRight,
        label: "Aktifkan",
        onClick: handleBulkActivate,
        isBulkAction: true,
      },
    ],
    [
      openCreateDialog,
      openFilter,
      refetch,
      handleBulkDeactivate,
      handleBulkActivate,
    ]
  );

  /**
   * Handler perubahan halaman.
   *
   * @param {Object} event - Event perubahan
   * @param {number} newPage - Nomor halaman baru
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  /**
   * Handler perubahan jumlah item per halaman.
   *
   * @param {number} newLimit - Jumlah item per halaman baru
   */
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  /**
   * Handler perubahan input pencarian.
   *
   * @param {Object} e - Event perubahan input
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
        emptyStateMessage="Tidak ada karyawan ditemukan"
        enableMultiSelect
        headers={[
          "Nama",
          "Email",
          "Telepon",
          "Role",
          "Status",
          "Verifikasi",
          "Bergabung",
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
        searchPlaceholder="Cari karyawan..."
        searchVal={search}
        selectedRows={selectedRows}
        subtitle="Kelola data karyawan bengkel"
        title="Daftar Karyawan"
      />

      {/**
       * Dialog Filter Karyawan
       * Memfilter berdasarkan status keaktifan
       */}
      <UserFilterDialog
        open={filterOpen}
        tempFilters={tempFilters}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      {/**
       * Dialog Form Tambah Karyawan
       */}
      <UserFormDialog
        open={createDialog}
        onClose={closeCreateDialog}
        type="create"
      />

      {/**
       * Dialog Form Edit Karyawan
       */}
      <UserFormDialog
        open={editDialog.open}
        user={editDialog.user}
        onClose={closeEditDialog}
        type="edit"
      />

      {/**
       * Dialog Konfirmasi Hapus Karyawan
       */}
      <DeleteUserDialog
        open={deleteDialog.open}
        user={deleteDialog.user}
        onClose={closeDeleteDialog}
      />

      {/**
       * Dialog Kirim Ulang Magic Link
       */}
      <UserResendDialog
        open={resendDialog.open}
        user={resendDialog.user}
        onClose={closeResendDialog}
      />

      {/**
       * Dialog Detail Karyawan
       */}
      <UserDetailDialog
        open={detailDialog.open}
        userId={detailDialog.userId}
        onClose={closeDetailDialog}
      />

      {/**
       * Dialog Bulk Nonaktifkan Karyawan
       */}
      <UserBulkDeactivateDialog
        selectedIds={bulkDeactivateDialog.selectedIds}
        selectedCount={bulkDeactivateDialog.selectedCount}
        onClose={handleCloseBulkDeactivate}
        onClearSelection={clearSelection}
        open={bulkDeactivateDialog.open}
      />

      {/**
       * Dialog Bulk Aktifkan Karyawan
       */}
      <UserBulkActivateDialog
        selectedIds={bulkActivateDialog.selectedIds}
        selectedCount={bulkActivateDialog.selectedCount}
        onClose={handleCloseBulkActivate}
        onClearSelection={clearSelection}
        open={bulkActivateDialog.open}
      />
    </>
  );
};

export default Users;
