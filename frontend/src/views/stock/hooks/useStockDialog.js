import { useState, useCallback } from "react";

export const useStockDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("in");
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    movementId: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    movement: null,
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });

  const openCreateDialog = useCallback((type = "in") => {
    setDialogType(type);
    setDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const openDetailDialog = useCallback((movementId) => {
    setDetailDialog({ open: true, movementId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, movementId: null });
  }, []);

  const openDeleteDialog = useCallback((movement) => {
    setDeleteDialog({ open: true, movement });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, movement: null });
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

  return {
    dialogOpen,
    dialogType,
    detailDialog,
    deleteDialog,
    bulkDeleteDialog,
    openCreateDialog,
    closeCreateDialog,
    openDetailDialog,
    closeDetailDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    clearSelection,
  };
};