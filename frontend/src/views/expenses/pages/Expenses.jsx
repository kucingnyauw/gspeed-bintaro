/**
 * Expenses - Komponen halaman untuk mengelola pengeluaran kasir dengan filter dan pencarian.
 *
 * @component
 * @returns {JSX.Element} Halaman pengeluaran
 */
import { useCallback, useMemo, useState } from "react";
import { FilePenLine, ListFilter, Plus, RotateCcw, Trash2 } from "lucide-react";
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
import { ExpenseCategory, expenseCategoryColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  ExpenseBulkDeleteDialog,
  ExpenseDeleteDialog,
  ExpenseDetailDialog,
  ExpenseFilterDialog,
  ExpenseFormDialog,
} from "@views/expenses/components";
import {
  useCashiersExpenseQuery,
  useExpenseDialog,
  useExpenseFilters,
} from "@views/expenses/hooks";

const Expenses = () => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const debouncedSearch = useDebounce(search);

  const {
    bulkDeleteDialog,
    deleteDialog,
    detailDialog,
    dialogMode,
    dialogOpen,
    clearSelection,
    closeBulkDeleteDialog,
    closeDeleteDialog,
    closeDetailDialog,
    closeFormDialog,
    openBulkDeleteDialog,
    openCreateDialog,
    openDeleteDialog,
    openDetailDialog,
    openUpdateDialog,
    selectedExpense,
  } = useExpenseDialog();
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

  const { data, isLoading, refetch } = useCashiersExpenseQuery(params);

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

  const handleOpenCreate = useCallback(
    () => openCreateDialog(),
    [openCreateDialog]
  );

  const handleOpenUpdate = useCallback(
    (row) => openUpdateDialog(row),
    [openUpdateDialog]
  );

  const handleEditClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleOpenUpdate(row);
    },
    [handleOpenUpdate]
  );

  const handleCloseFormDialog = useCallback(
    () => closeFormDialog(),
    [closeFormDialog]
  );

  const handleRowDoubleClick = useCallback(
    (row) => openDetailDialog(row),
    [openDetailDialog]
  );

  const handleDeleteClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      openDeleteDialog(row);
    },
    [openDeleteDialog]
  );

  const handleBulkDelete = useCallback(
    (ids) => {
      openBulkDeleteDialog(ids, ids.length);
    },
    [openBulkDeleteDialog]
  );

  const handleCloseBulkDelete = useCallback(() => {
    closeBulkDeleteDialog();
    setSelectedRows([]);
  }, [closeBulkDeleteDialog]);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedRows(newSelection);
  }, []);

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

      <Typography key={`recordedBy-${row.id}`} variant="body2" sx={{ fontWeight: 400 }}>
        {row.recordedBy?.fullName || "—"}
      </Typography>,

      <Typography key={`date-${row.id}`} variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
        {formatDateTime(row.date)}
      </Typography>,

      <Box key={`receipt-${row.id}`}>
        {row.receipt ? (
          <Box
            component="img"
            src={row.receipt}
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

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title="Edit">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleEditClick(e, row)}
              size="small"
              aria-label="Edit Pengeluaran"
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
        <Tooltip title="Hapus">
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleDeleteClick(e, row)}
              size="small"
              aria-label="Hapus Pengeluaran"
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
    [handleEditClick, handleDeleteClick, theme]
  );

  const tableActions = useMemo(
    () => [
      { icon: Plus, label: "Tambah Pengeluaran", onClick: handleOpenCreate },
      { icon: ListFilter, label: "Filter", onClick: openFilter },
      { icon: RotateCcw, label: "Refresh", onClick: () => refetch() },
      { icon: Trash2, label: "Hapus Terpilih", onClick: handleBulkDelete, isBulkAction: true },
    ],
    [handleOpenCreate, openFilter, refetch, handleBulkDelete]
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
        emptyStateMessage="Tidak ada pengeluaran ditemukan"
        enableMultiSelect
        headers={["Judul", "Jumlah", "Kategori", "Pencatat", "Tanggal", "Nota", "Aksi"]}
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
        searchPlaceholder="Cari pengeluaran..."
        searchVal={search}
        selectedRows={selectedRows}
        subtitle="Kelola pengeluaran bengkel"
        title="Pengeluaran"
      />

      <ExpenseFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />

      <ExpenseFormDialog
        mode={dialogMode}
        onClose={handleCloseFormDialog}
        open={dialogOpen}
        selectedExpense={selectedExpense}
      />

      <ExpenseDeleteDialog
        expense={deleteDialog.expense}
        onClose={closeDeleteDialog}
        open={deleteDialog.open}
      />

      <ExpenseBulkDeleteDialog
        selectedIds={bulkDeleteDialog.selectedIds}
        selectedCount={bulkDeleteDialog.selectedCount}
        onClose={handleCloseBulkDelete}
        onClearSelection={clearSelection}
        open={bulkDeleteDialog.open}
      />

      <ExpenseDetailDialog
        expense={detailDialog.expense}
        onClose={closeDetailDialog}
        open={detailDialog.open}
      />
    </>
  );
};

export default Expenses;