/**
 * StockDeleteDialog - Dialog konfirmasi untuk menghapus mutasi stok.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {Object} props.movement - Data mutasi stok yang akan dihapus
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useDeleteStockMovementMutation } from "@views/stock/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockDeleteDialog = ({ open, movement, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const br = `${theme.shape.borderRadius}px`;

  const deleteMutation = useDeleteStockMovementMutation({
    onSuccess: () => {
      dispatch(showNotification({
        message: "Mutasi stok berhasil dihapus",
        type: "success", title: "Berhasil", variant: "snackbar", autoHide: 3000,
      }));
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(showNotification({
        message: error.message || "Gagal menghapus mutasi stok",
        type: "error", title: "Error", variant: "snackbar", autoHide: 5000,
      }));
    },
  });

  const isPending = deleteMutation.isPending;

  const handleConfirm = () => {
    if (!movement) return;
    deleteMutation.mutate(movement.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Hapus Mutasi Stok
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 } }}>
        <Stack sx={{ gap: 2 }}>
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}>
            Anda akan menghapus data mutasi stok ini. Tindakan ini{" "}
            <Box component="span" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
              tidak dapat dibatalkan
            </Box>.
          </Typography>
          {movement && (
            <Stack sx={{ gap: 1, p: 2, borderRadius: br, bgcolor: alpha(theme.palette.error.main, 0.04), border: `1px solid ${alpha(theme.palette.error.main, 0.1)}` }}>
              <Typography variant="caption" color="text.secondary">Data yang akan dihapus:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{movement.productName || movement.product?.name || "—"}</Typography>
              <Typography variant="caption" color="text.secondary">
                Jumlah: {movement.quantity} · {movement.type === "IN" ? "Masuk" : movement.type === "OUT" ? "Keluar" : "Penyesuaian"}
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, justifyContent: "space-between" }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}
          sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
          Batal
        </Button>
        <Button variant="contained" color="error" disabled={isPending} onClick={handleConfirm}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 600, textTransform: "none", borderRadius: br, px: 2.5, fontSize: { xs: "0.8125rem", sm: "0.875rem" }, boxShadow: "none" }}>
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockDeleteDialog;