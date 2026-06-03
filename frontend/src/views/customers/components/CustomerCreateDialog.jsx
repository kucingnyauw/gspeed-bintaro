import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Controller } from "react-hook-form";
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

import { useCreateCustomerMutation } from "@views/customers/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const CustomerCreateDialog = ({
  activeStep,
  control,
  handleSubmit,
  onBack,
  onClose,
  onNext,
  open,
  trigger,
}) => {
  const dispatch = useDispatch();

  const mutation = useCreateCustomerMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pelanggan "${data?.data?.name || "baru"}" berhasil ditambahkan`,
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
          message: error?.message || "Gagal menambahkan pelanggan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const onSubmit = useCallback(
    (formData) => mutation.mutateAsync(formData),
    [mutation]
  );

  const handleNext = async () => {
    const valid = await trigger(["name", "phone"]);
    if (valid) onNext();
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={mutation.isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Pelanggan Baru
          </Typography>
          <IconButton onClick={onClose} disabled={mutation.isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Box component="form" id="customer-form" onSubmit={handleSubmit(onSubmit)}>
          {activeStep === 0 && (
            <Stack sx={{ gap: 3 }}>
              <Controller
                control={control}
                name="name"
                rules={{ required: "Nama pelanggan wajib diisi" }}
                render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth autoFocus error={!!fieldState.error} helperText={fieldState.error?.message} label="Nama Pelanggan" placeholder="Masukkan nama lengkap" disabled={mutation.isPending} />
                )}
              />
              <Controller
                control={control}
                name="phone"
                rules={{ required: "Telepon wajib diisi" }}
                render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} label="Telepon" placeholder="Contoh: 08123456789" disabled={mutation.isPending} />
                )}
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack sx={{ gap: 3 }}>
              <Controller
                control={control}
                name="vehicle.plateNumber"
                rules={{ required: "Plat nomor wajib diisi" }}
                render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth autoFocus error={!!fieldState.error} helperText={fieldState.error?.message} label="Plat Nomor" placeholder="Contoh: B 1234 ABC" disabled={mutation.isPending} />
                )}
              />
              <Controller
                control={control}
                name="vehicle.brand"
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Merek" placeholder="Contoh: Honda, Yamaha (opsional)" disabled={mutation.isPending} />
                )}
              />
              <Controller
                control={control}
                name="vehicle.model"
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Model" placeholder="Contoh: Vario, Beat (opsional)" disabled={mutation.isPending} />
                )}
              />
            </Stack>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        {activeStep === 1 && (
          <Button color="inherit" variant="outlined" onClick={onBack} disabled={mutation.isPending}>
            Kembali
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {activeStep === 0 ? (
          <Button variant="contained" onClick={handleNext}>Lanjut</Button>
        ) : (
          <Button variant="contained" type="submit" form="customer-form" disabled={mutation.isPending} startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}>
            {mutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerCreateDialog;