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

import { useDeleteOrderMutation } from "@views/orders/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const OrderDeleteDialog = ({ onClose, open, order }) => {
  const dispatch = useDispatch();

  const deleteOrder = useDeleteOrderMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pesanan #${data?.orderNumber || order?.orderNumber} berhasil dihapus`,
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
          message: error.message || "Gagal menghapus pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isDeleting = deleteOrder.isPending;

  const handleConfirm = () => {
    if (!order) return;
    deleteOrder.mutate(order.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isDeleting ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Hapus Pesanan
          </Typography>
          <IconButton onClick={onClose} disabled={isDeleting} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan menghapus pesanan{" "}
          <strong>{order?.orderNumber}</strong>
          {order?.customer?.name && (
            <> untuk pelanggan <strong>{order.customer.name}</strong></>
          )}.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isDeleting} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isDeleting}
          onClick={handleConfirm}
          startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isDeleting ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDeleteDialog;