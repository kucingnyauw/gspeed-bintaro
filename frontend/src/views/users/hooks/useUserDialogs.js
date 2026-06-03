import { useState, useCallback } from "react";

export const useUserDialogs = () => {
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [resendDialog, setResendDialog] = useState({ open: false, user: null });
  const [detailDialog, setDetailDialog] = useState({ open: false, userId: null });
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

  const openCreateDialog = useCallback(() => setCreateDialog(true), []);
  const closeCreateDialog = useCallback(() => setCreateDialog(false), []);

  const openEditDialog = useCallback((user) => {
    setEditDialog({ open: true, user });
  }, []);
  const closeEditDialog = useCallback(() => {
    setEditDialog({ open: false, user: null });
  }, []);

  const openDeleteDialog = useCallback((user) => {
    setDeleteDialog({ open: true, user });
  }, []);
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, user: null });
  }, []);

  const openResendDialog = useCallback((user) => {
    setResendDialog({ open: true, user });
  }, []);
  const closeResendDialog = useCallback(() => {
    setResendDialog({ open: false, user: null });
  }, []);

  const openDetailDialog = useCallback((user) => {
    setDetailDialog({ open: true, userId: user.id });
  }, []);
  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, userId: null });
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

  return {
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
  };
};