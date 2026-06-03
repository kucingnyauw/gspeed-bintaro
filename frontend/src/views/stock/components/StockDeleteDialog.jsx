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

import { useDeleteStockMovementMutation } from "@views/stock/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockDeleteDialog = ({ open, movement, onClose }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteStockMovementMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Mutasi stok berhasil dihapus",
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
          message: error.message || "Gagal menghapus mutasi stok",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = deleteMutation.isPending;

  const handleConfirm = () => {
    if (!movement) return;
    deleteMutation.mutate(movement.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Hapus Mutasi Stok
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan menghapus data mutasi stok ini. Tindakan ini tidak dapat dibatalkan.
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
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockDeleteDialog;