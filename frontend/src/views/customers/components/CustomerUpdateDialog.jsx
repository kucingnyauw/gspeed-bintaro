import { Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useUpdateCustomerMutation } from "@views/customers/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const CustomerUpdateDialog = ({
  control,
  customer,
  formState,
  handleSubmit,
  onClose,
  open,
}) => {
  const dispatch = useDispatch();

  const updateMutation = useUpdateCustomerMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pelanggan "${data?.name || customer?.name}" berhasil diperbarui`,
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
          message: error?.message || "Gagal memperbarui pelanggan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = updateMutation.isPending;
  const isDirty = formState?.isDirty || false;

  const onSubmit = (formData) => {
    if (!customer) return;
    updateMutation.mutate({ id: customer.id, ...formData });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Update Pelanggan
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Box component="form" id="customer-update-form" onSubmit={handleSubmit(onSubmit)}>
          <Stack sx={{ gap: 3 }}>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Nama pelanggan wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField {...field} fullWidth autoFocus disabled={isPending} error={!!fieldState.error} helperText={fieldState.error?.message} label="Nama Pelanggan" placeholder="Masukkan nama lengkap" />
              )}
            />
            <Controller
              control={control}
              name="phone"
              rules={{ required: "Telepon wajib diisi" }}
              render={({ field, fieldState }) => (
                <TextField {...field} fullWidth disabled={isPending} error={!!fieldState.error} helperText={fieldState.error?.message} label="Telepon" placeholder="Contoh: 08123456789" />
              )}
            />
          </Stack>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending || !isDirty}
          type="submit"
          form="customer-update-form"
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerUpdateDialog;