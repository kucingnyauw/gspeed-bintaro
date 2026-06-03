import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { useRefundPaymentsMutation } from "@views/payments/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const PaymentBulkRefundDialog = ({
  selectedIds,
  selectedCount,
  onClose,
  onClearSelection,
  open,
}) => {
  const dispatch = useDispatch();

  const mutation = useRefundPaymentsMutation({
    onSuccess: (data) => {
      const { summary } = data;
      let message = `${summary.refunded} pembayaran berhasil direfund`;
      if (summary.skipped > 0) message += `, ${summary.skipped} dilewati`;
      if (summary.failed > 0) message += `, ${summary.failed} gagal`;
      dispatch(
        showNotification({
          message,
          type: summary.skipped > 0 || summary.failed > 0 ? "warning" : "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClearSelection?.();
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal merefund pembayaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleConfirm = () => {
    mutation.mutate(selectedIds);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={mutation.isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Refund Pembayaran
          </Typography>
          <IconButton onClick={onClose} disabled={mutation.isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan merefund{" "}
          <strong>{selectedCount} pembayaran</strong> yang dipilih.
        </Typography>
        <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
          Hanya pembayaran dengan status PAID yang akan direfund. Pesanan terkait akan otomatis dibatalkan.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={mutation.isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleConfirm}
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {mutation.isPending ? "Merefund..." : `Refund ${selectedCount} Pembayaran`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentBulkRefundDialog;