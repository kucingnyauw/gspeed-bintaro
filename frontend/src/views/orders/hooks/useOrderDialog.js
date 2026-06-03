import { useState, useCallback } from "react";

export const useOrderDialog = () => {
  const [dialog, setDialog] = useState({ open: false, type: null, data: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, order: null });
  const [detailDialog, setDetailDialog] = useState({ open: false, order: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, order: null });
  const [exportDialog, setExportDialog] = useState(false);
  const [bulkCancelDialog, setBulkCancelDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });
  const [bulkCloseDialog, setBulkCloseDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });

  const openDialog = useCallback((type, data = null) => {
    setDialog({ open: true, type, data });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false, type: null, data: null });
  }, []);

  const openCancelDialog = useCallback((order) => {
    setCancelDialog({ open: true, order });
  }, []);

  const closeCancelDialog = useCallback(() => {
    setCancelDialog({ open: false, order: null });
  }, []);

  const openDetailDialog = useCallback((order) => {
    setDetailDialog({ open: true, order });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, order: null });
  }, []);

  const openDeleteDialog = useCallback((order) => {
    setDeleteDialog({ open: true, order });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, order: null });
  }, []);

  const openExportDialog = useCallback(() => {
    setExportDialog(true);
  }, []);

  const closeExportDialog = useCallback(() => {
    setExportDialog(false);
  }, []);

  const openBulkCancelDialog = useCallback((selectedIds, selectedCount) => {
    setBulkCancelDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkCancelDialog = useCallback(() => {
    setBulkCancelDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const openBulkCloseDialog = useCallback((selectedIds, selectedCount) => {
    setBulkCloseDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkCloseDialog = useCallback(() => {
    setBulkCloseDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const clearSelection = useCallback(() => {
    setBulkCancelDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
    setBulkCloseDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
  }, []);

  return {
    dialog,
    cancelDialog,
    detailDialog,
    deleteDialog,
    exportDialog,
    bulkCancelDialog,
    bulkCloseDialog,
    openDialog,
    closeDialog,
    openCancelDialog,
    closeCancelDialog,
    openDetailDialog,
    closeDetailDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openExportDialog,
    closeExportDialog,
    openBulkCancelDialog,
    closeBulkCancelDialog,
    openBulkCloseDialog,
    closeBulkCloseDialog,
    clearSelection,
  };
};