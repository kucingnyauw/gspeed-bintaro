import { X } from "lucide-react";
import { useDispatch } from "react-redux";

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

import { useCancelOrderMutation } from "@views/orders/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const OrderCancelDialog = ({ onClose, open, order }) => {
  const dispatch = useDispatch();

  const cancelOrder = useCancelOrderMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pesanan #${data?.orderNumber || order?.orderNumber} berhasil dibatalkan`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal membatalkan pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = cancelOrder.isPending;

  const handleConfirm = () => {
    if (!order) return;
    cancelOrder.mutate({
      id: order.id,
      reason: "Dibatalkan oleh kasir",
    });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Batalkan Pesanan
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan membatalkan pesanan{" "}
          <strong>{order?.orderNumber}</strong>
          {order?.customer?.name && (
            <> untuk pelanggan <strong>{order.customer.name}</strong></>
          )}.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isPending ? "Membatalkan..." : "Ya, Batalkan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderCancelDialog;