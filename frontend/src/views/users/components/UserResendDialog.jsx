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

import { useResendMagicLinkMutation } from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const UserResendDialog = ({ open, user, onClose }) => {
  const dispatch = useDispatch();

  const resendMutation = useResendMagicLinkMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Email verifikasi berhasil dikirim ke ${user?.email}`,
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
          message: error.message || "Gagal mengirim email verifikasi",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = resendMutation.isPending;

  const handleConfirm = () => {
    if (!user) return;
    resendMutation.mutate(user.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Kirim Ulang Email Verifikasi
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Kirim ulang email verifikasi ke{" "}
          <strong>{user?.fullName || "karyawan ini"}</strong>?
        </Typography>
        {user?.email && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {user.email}
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isPending ? "Mengirim..." : "Ya, Kirim"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserResendDialog;