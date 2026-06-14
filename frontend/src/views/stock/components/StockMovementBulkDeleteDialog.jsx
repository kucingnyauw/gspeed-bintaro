/**
 * StockMovementBulkDeleteDialog - Dialog konfirmasi untuk menghapus banyak mutasi stok.
 *
 * @component
 * @param {Object} props
 * @param {string[]} props.selectedIds - Array ID mutasi stok yang dipilih
 * @param {number} props.selectedCount - Jumlah mutasi stok yang dipilih
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onClearSelection - Handler clear selection setelah berhasil
 * @param {boolean} props.open - Status dialog
 * @returns {JSX.Element}
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useDeleteStockMovementsMutation } from "@views/stock/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockMovementBulkDeleteDialog = ({ selectedIds, selectedCount, onClose, onClearSelection, open }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const br = `${theme.shape.borderRadius}px`;

  const mutation = useDeleteStockMovementsMutation({
    onSuccess: (data) => {
      const { summary } = data;
      let message = `${summary.deleted} mutasi stok berhasil dihapus`;
      if (summary.skipped > 0) message += `, ${summary.skipped} dilewati`;
      if (summary.failed > 0) message += `, ${summary.failed} gagal`;
      dispatch(showNotification({
        message,
        type: summary.skipped > 0 || summary.failed > 0 ? "warning" : "success",
        title: "Berhasil", variant: "snackbar", autoHide: 3000,
      }));
      onClearSelection?.();
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(showNotification({
        message: error?.message || "Gagal menghapus mutasi stok",
        type: "error", title: "Error", variant: "snackbar", autoHide: 5000,
      }));
    },
  });

  const isPending = mutation.isPending;

  const handleConfirm = () => {
    mutation.mutate(selectedIds);
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
            Anda akan menghapus{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>{selectedCount} mutasi stok</Box> yang dipilih.
            Tindakan ini{" "}
            <Box component="span" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
              tidak dapat dibatalkan
            </Box>.
          </Typography>
          <Stack sx={{ gap: 1, p: 2, borderRadius: br, bgcolor: alpha(theme.palette.error.main, 0.04), border: `1px solid ${alpha(theme.palette.error.main, 0.1)}` }}>
            <Typography variant="caption" color="text.secondary">Data mutasi stok akan dihapus permanen dari sistem.</Typography>
          </Stack>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, justifyContent: "space-between" }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}
          sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
          Batal
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 600, textTransform: "none", borderRadius: br, px: 2.5, fontSize: { xs: "0.8125rem", sm: "0.875rem" }, boxShadow: "none" }}>
          {isPending ? "Menghapus..." : `Hapus ${selectedCount} Mutasi Stok`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockMovementBulkDeleteDialog;