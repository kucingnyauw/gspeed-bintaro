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

import { useDeleteUserMutation } from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const DeleteUserDialog = ({ open, user, onClose }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteUserMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Karyawan "${user?.fullName}" berhasil dihapus`,
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
          message: error.message || "Gagal menghapus karyawan",
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
    if (!user) return;
    deleteMutation.mutate(user.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Hapus Karyawan
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan menghapus karyawan{" "}
          <strong>{user?.fullName || "ini"}</strong> dari sistem.
        </Typography>
        <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
          Tindakan ini tidak dapat dibatalkan. Semua data terkait akan dihapus.
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
          {isPending ? "Menghapus..." : "Ya, Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserDialog;