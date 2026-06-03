import { useState, useCallback } from "react";

export const useCustomerDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    customer: null,
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });
  const [updateDialog, setUpdateDialog] = useState({
    open: false,
    customer: null,
  });
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    customerId: null,
  });

  const openCreateDialog = useCallback(() => {
    setActiveStep(0);
    setDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setDialogOpen(false);
    setActiveStep(0);
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep(1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep(0);
  }, []);

  const openUpdateDialog = useCallback((customer) => {
    setUpdateDialog({ open: true, customer });
  }, []);

  const closeUpdateDialog = useCallback(() => {
    setUpdateDialog({ open: false, customer: null });
  }, []);

  const openDeleteDialog = useCallback((customer) => {
    setDeleteDialog({ open: true, customer });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, customer: null });
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

  const openDetailDialog = useCallback((customerId) => {
    setDetailDialog({ open: true, customerId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, customerId: null });
  }, []);

  return {
    dialogOpen,
    activeStep,
    deleteDialog,
    bulkDeleteDialog,
    updateDialog,
    detailDialog,
    openCreateDialog,
    closeCreateDialog,
    handleNext,
    handleBack,
    openUpdateDialog,
    closeUpdateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    clearSelection,
    openDetailDialog,
    closeDetailDialog,
  };
};