import { useState, useCallback } from "react";

export const useProductDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    product: null,
  });
  const [bulkDeactivateDialog, setBulkDeactivateDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });
  const [bulkActivateDialog, setBulkActivateDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    productId: null,
  });

  const openCreateDialog = useCallback(() => {
    setDialogMode("create");
    setSelectedProduct(null);
    setDialogOpen(true);
  }, []);

  const openUpdateDialog = useCallback((product) => {
    setDialogMode("update");
    setSelectedProduct(product);
    setDialogOpen(true);
  }, []);

  const closeFormDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedProduct(null);
  }, []);

  const openDeleteDialog = useCallback((product) => {
    setDeleteDialog({ open: true, product });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, product: null });
  }, []);

  const openBulkDeactivateDialog = useCallback((selectedIds, selectedCount) => {
    setBulkDeactivateDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkDeactivateDialog = useCallback(() => {
    setBulkDeactivateDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const openBulkActivateDialog = useCallback((selectedIds, selectedCount) => {
    setBulkActivateDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkActivateDialog = useCallback(() => {
    setBulkActivateDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const clearSelection = useCallback(() => {
    setBulkDeactivateDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
    setBulkActivateDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
  }, []);

  const openDetailDialog = useCallback((productId) => {
    setDetailDialog({ open: true, productId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, productId: null });
  }, []);

  return {
    dialogOpen,
    dialogMode,
    selectedProduct,
    deleteDialog,
    bulkDeactivateDialog,
    bulkActivateDialog,
    detailDialog,
    openCreateDialog,
    openUpdateDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openBulkDeactivateDialog,
    closeBulkDeactivateDialog,
    openBulkActivateDialog,
    closeBulkActivateDialog,
    clearSelection,
    openDetailDialog,
    closeDetailDialog,
  };
};