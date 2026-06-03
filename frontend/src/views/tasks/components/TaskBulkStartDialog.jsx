import { useDispatch, useSelector } from "react-redux";
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
  Typography,
  Stack
} from "@mui/material";

import { useBulkStartOrdersMutation } from "@views/tasks/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const TaskBulkStartDialog = ({ selectedIds, selectedCount, onClose, onClearSelection, open }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const mutation = useBulkStartOrdersMutation({
    onSuccess: (data) => {
      const { summary } = data;
      let message = `${summary.started} order berhasil dimulai`;
      if (summary.failed > 0) {
        message += `, ${summary.failed} gagal`;
      }
      dispatch(
        showNotification({
          message,
          type: summary.failed > 0 ? "warning" : "success",
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
          message: error?.message || "Gagal memulai order",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleConfirm = () => {
    const orders = selectedIds.map((orderId) => ({
      orderId,
      mechanicId: user?.id,
    }));
    mutation.mutate(orders);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={mutation.isPending ? undefined : onClose}
      open={open}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Mulai Pengerjaan
          </Typography>
          <IconButton onClick={onClose} disabled={mutation.isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
          Anda akan memulai pengerjaan untuk{" "}
          <strong>{selectedCount} order</strong> yang dipilih.
        </Typography>
        <Typography variant="body2" color="info.main" sx={{ mt: 2, fontWeight: 400 }}>
          Hanya order dengan status QUEUED yang akan diproses. Order dengan status lain akan dilewati.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={mutation.isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {mutation.isPending ? "Memulai..." : `Mulai ${selectedCount} Order`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskBulkStartDialog;