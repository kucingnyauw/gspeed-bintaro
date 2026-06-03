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

import { useDeleteExpenseMutation } from "@views/expenses/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ExpenseDeleteDialog = ({ expense, onClose, open }) => {
  const dispatch = useDispatch();

  const deleteMutation = useDeleteExpenseMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Pengeluaran "${expense?.title}" berhasil dihapus`,
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
          message: error.message || "Gagal menghapus pengeluaran",
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
    if (expense?.id) deleteMutation.mutate(expense.id);
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Hapus Pengeluaran
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Anda akan menghapus pengeluaran{" "}
          <strong>{expense?.title}</strong>.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isPending ? "Menghapus..." : "Hapus"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDeleteDialog;