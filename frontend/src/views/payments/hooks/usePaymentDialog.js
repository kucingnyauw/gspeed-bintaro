import { useState, useCallback } from "react";

export const usePaymentDialog = () => {
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    paymentId: null,
  });

  const [refundDialog, setRefundDialog] = useState({
    open: false,
    payment: null,
    reason: "",
  });

  const [bulkRefundDialog, setBulkRefundDialog] = useState({
    open: false,
    selectedIds: [],
    selectedCount: 0,
  });

  const openDetailDialog = useCallback((paymentId) => {
    setDetailDialog({ open: true, paymentId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, paymentId: null });
  }, []);

  const openRefundDialog = useCallback((payment) => {
    setRefundDialog({ open: true, payment, reason: "" });
  }, []);

  const closeRefundDialog = useCallback(() => {
    setRefundDialog({ open: false, payment: null, reason: "" });
  }, []);

  const setRefundReason = useCallback((reason) => {
    setRefundDialog((prev) => ({ ...prev, reason }));
  }, []);

  const openBulkRefundDialog = useCallback((selectedIds, selectedCount) => {
    setBulkRefundDialog({ open: true, selectedIds, selectedCount });
  }, []);

  const closeBulkRefundDialog = useCallback(() => {
    setBulkRefundDialog({ open: false, selectedIds: [], selectedCount: 0 });
  }, []);

  const clearSelection = useCallback(() => {
    setBulkRefundDialog((prev) => ({ ...prev, selectedIds: [], selectedCount: 0 }));
  }, []);

  return {
    detailDialog,
    refundDialog,
    bulkRefundDialog,
    openDetailDialog,
    closeDetailDialog,
    openRefundDialog,
    closeRefundDialog,
    setRefundReason,
    openBulkRefundDialog,
    closeBulkRefundDialog,
    clearSelection,
  };
};