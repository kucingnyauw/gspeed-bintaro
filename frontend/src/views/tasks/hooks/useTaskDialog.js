import { useState, useCallback } from "react";

export const useTaskDialog = () => {
  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    task: null,
  });

  const [detailDialog, setDetailDialog] = useState({
    open: false,
    orderId: null,
  });

  const [assignDialog, setAssignDialog] = useState({ open: false, step: null, data: null });
  const [orderIdentifier, setOrderIdentifier] = useState("");
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  const [taskDialog, setTaskDialog] = useState({ open: false, mechanic: null });

  const [bulkStartDialog, setBulkStartDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });

  const [bulkCompleteDialog, setBulkCompleteDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });

  const openStartDialog = useCallback((task) => {
    setDialog({ open: true, type: "start", task });
  }, []);

  const openEndDialog = useCallback((task) => {
    setDialog({ open: true, type: "end", task });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false, type: null, task: null });
  }, []);

  const openDetailDialog = useCallback((orderId) => {
    setDetailDialog({ open: true, orderId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, orderId: null });
  }, []);

  const openAssignDialog = useCallback((mechanic) => {
    setSelectedMechanic(mechanic);
    setOrderIdentifier("");
    setAssignDialog({ open: true, step: "input-order", data: null });
  }, []);

  const closeAssignDialog = useCallback(() => {
    setAssignDialog({ open: false, step: null, data: null });
    setOrderIdentifier("");
    setSelectedMechanic(null);
  }, []);

  const setDialogData = useCallback((data) => {
    setAssignDialog((prev) => ({ ...prev, data }));
  }, []);

  const goToConfirmStep = useCallback(() => {
    setAssignDialog((prev) => ({ ...prev, step: "confirm" }));
  }, []);

  const openTaskDialog = useCallback((mechanic) => {
    setTaskDialog({ open: true, mechanic });
  }, []);

  const closeTaskDialog = useCallback(() => {
    setTaskDialog({ open: false, mechanic: null });
  }, []);

  const openBulkStartDialog = useCallback((selectedIds, selectedCount) => {
    setBulkStartDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkStartDialog = useCallback(() => {
    setBulkStartDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const openBulkCompleteDialog = useCallback((selectedIds, selectedCount) => {
    setBulkCompleteDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkCompleteDialog = useCallback(() => {
    setBulkCompleteDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const clearSelection = useCallback(() => {
    setBulkStartDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
    setBulkCompleteDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
  }, []);

  return {
    dialog,
    detailDialog,
    assignDialog,
    orderIdentifier,
    selectedMechanic,
    taskDialog,
    bulkStartDialog,
    bulkCompleteDialog,
    openStartDialog,
    openEndDialog,
    closeDialog,
    openDetailDialog,
    closeDetailDialog,
    openAssignDialog,
    closeAssignDialog,
    setOrderIdentifier,
    setDialogData,
    goToConfirmStep,
    openTaskDialog,
    closeTaskDialog,
    openBulkStartDialog,
    closeBulkStartDialog,
    openBulkCompleteDialog,
    closeBulkCompleteDialog,
    clearSelection,
  };
};