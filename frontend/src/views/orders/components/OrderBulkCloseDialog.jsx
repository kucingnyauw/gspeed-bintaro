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

import { useCloseOrdersMutation } from "@views/orders/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const OrderBulkCloseDialog = ({ selectedIds, selectedCount, onClose, onClearSelection, open }) => {
  const dispatch = useDispatch();

  const mutation = useCloseOrdersMutation({
    onSuccess: (data) => {
      const { summary } = data;
      let message = `${summary.closed} pesanan berhasil ditutup`;
      if (summary.skipped > 0) message += `, ${summary.skipped} dilewati`;
      if (summary.failed > 0) message += `, ${summary.failed} gagal`;

      const hasIssues = summary.skipped > 0 || summary.failed > 0;
      dispatch(
        showNotification({
          message,
          type: hasIssues ? "warning" : "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: hasIssues ? 6000 : 3000,
        })
      );
      onClearSelection?.();
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal menutup pesanan",
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
            Tutup Pesanan
          </Typography>
          <IconButton onClick={onClose} disabled={mutation.isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan menutup{" "}
          <strong>{selectedCount} pesanan</strong> yang dipilih.
        </Typography>
        <Typography variant="body2" color="info.main" sx={{ mt: 2 }}>
          Hanya pesanan dengan status COMPLETED yang dapat ditutup. Pesanan dengan status lain akan dilewati.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={mutation.isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {mutation.isPending ? "Menutup..." : `Tutup ${selectedCount} Pesanan`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderBulkCloseDialog;