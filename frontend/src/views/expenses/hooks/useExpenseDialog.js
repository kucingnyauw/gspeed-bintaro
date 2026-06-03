import { useState, useCallback } from "react";

export const useExpenseDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    expense: null,
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    expense: null,
  });

  const openCreateDialog = useCallback(() => {
    setDialogMode("create");
    setSelectedExpense(null);
    setDialogOpen(true);
  }, []);

  const openUpdateDialog = useCallback((expense) => {
    setDialogMode("update");
    setSelectedExpense(expense);
    setDialogOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedExpense(null);
  }, []);

  const openDeleteDialog = useCallback((expense) => {
    setDeleteDialog({ open: true, expense });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, expense: null });
  }, []);

  const openBulkDeleteDialog = useCallback((selectedIds, selectedCount) => {
    setBulkDeleteDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkDeleteDialog = useCallback(() => {
    setBulkDeleteDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const clearSelection = useCallback(() => {
    setBulkDeleteDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
  }, []);

  const openDetailDialog = useCallback((expense) => {
    setDetailDialog({ open: true, expense });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, expense: null });
  }, []);

  return {
    dialogOpen,
    dialogMode,
    selectedExpense,
    deleteDialog,
    bulkDeleteDialog,
    detailDialog,
    openCreateDialog,
    openUpdateDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    clearSelection,
    openDetailDialog,
    closeDetailDialog,
  };
};