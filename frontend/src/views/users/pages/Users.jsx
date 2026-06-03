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

const Users = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
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
  } = useUserFilters();

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

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      isActive:
        activeFilters.isActive !== ""
          ? activeFilters.isActive === "true"
          : undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = useUsersQuery(params);

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

  const handleResendClick = useCallback(
    (e, user) => {
      e.stopPropagation();
      openResendDialog(user);
    },
    [openResendDialog]
  );

  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openEditDialog(row);
    },
    [openEditDialog]
  );

  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  const handleBulkDeactivate = useCallback(
    (ids) => {
      openBulkDeactivateDialog(ids, ids.length);
    },
    [openBulkDeactivateDialog]
  );

  const handleBulkActivate = useCallback(
    (ids) => {
      openBulkActivateDialog(ids, ids.length);
    },
    [openBulkActivateDialog]
  );

  const handleCloseBulkDeactivate = useCallback(() => {
    closeBulkDeactivateDialog();
    setSelectedRows([]);
  }, [closeBulkDeactivateDialog]);

  const handleCloseBulkActivate = useCallback(() => {
    closeBulkActivateDialog();
    setSelectedRows([]);
  }, [closeBulkActivateDialog]);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedRows(newSelection);
  }, []);

  const renderRow = useCallback(
    (row) => [
      <Typography key={`name-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.fullName}
      </Typography>,

      <Typography key={`email-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {row.email}
      </Typography>,

      <Typography key={`phone-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
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

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.createdAt)}
      </Typography>,

      <Stack key={`actions-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
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

  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Karyawan", onClick: openCreateDialog },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
      { icon: ToggleLeft, label: "Nonaktifkan", onClick: handleBulkDeactivate, isBulkAction: true },
      { icon: ToggleRight, label: "Aktifkan", onClick: handleBulkActivate, isBulkAction: true },
    ],
    [openCreateDialog, openFilter, refetch, handleBulkDeactivate, handleBulkActivate]
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

      <UserFilterDialog
        open={filterOpen}
        tempFilters={tempFilters}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      <UserFormDialog
        open={createDialog}
        onClose={closeCreateDialog}
        type="create"
      />

      <UserFormDialog
        open={editDialog.open}
        user={editDialog.user}
        onClose={closeEditDialog}
        type="edit"
      />

      <DeleteUserDialog
        open={deleteDialog.open}
        user={deleteDialog.user}
        onClose={closeDeleteDialog}
      />

      <UserResendDialog
        open={resendDialog.open}
        user={resendDialog.user}
        onClose={closeResendDialog}
      />

      <UserDetailDialog
        open={detailDialog.open}
        userId={detailDialog.userId}
        onClose={closeDetailDialog}
      />

      <UserBulkDeactivateDialog
        selectedIds={bulkDeactivateDialog.selectedIds}
        selectedCount={bulkDeactivateDialog.selectedCount}
        onClose={handleCloseBulkDeactivate}
        onClearSelection={clearSelection}
        open={bulkDeactivateDialog.open}
      />

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