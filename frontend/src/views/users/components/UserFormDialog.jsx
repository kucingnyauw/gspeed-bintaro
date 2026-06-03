import { useEffect, useCallback } from "react";
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
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useUserForm } from "@views/users/hooks";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const UserFormDialog = ({ open, user, onClose, type = "create" }) => {
  const dispatch = useDispatch();
  const isEdit = type === "edit";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useUserForm();

  const createMutation = useCreateUserMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Undangan telah dikirim ke ${data?.email || "karyawan baru"}`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      handleClose();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal mengirim undangan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const updateMutation = useUpdateUserMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Karyawan "${data?.fullName || user?.fullName}" berhasil diperbarui`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      handleClose();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal memperbarui karyawan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  useEffect(() => {
    if (open) {
      if (isEdit && user) {
        reset({
          email: user.email || "",
          fullName: user.fullName || "",
          phone: user.phone || "",
          role: user.role || "CASHIER",
          isActive: user.isActive ?? true,
        });
      } else {
        reset({
          email: "",
          fullName: "",
          phone: "",
          role: "CASHIER",
          isActive: true,
        });
      }
    }
  }, [open, user, isEdit, reset]);

  const onSubmit = (formData) => {
    if (isEdit && user) {
      updateMutation.mutate({
        id: user.id,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: formData.role,
        isActive: formData.isActive,
      });
    } else {
      createMutation.mutate({
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        role: formData.role,
      });
    }
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
          </Typography>
          <IconButton onClick={handleClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Stack sx={{ gap: 3 }}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email wajib diisi",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Format email tidak valid",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus={!isEdit}
                  label="Email"
                  placeholder="Masukkan alamat email"
                  disabled={isEdit}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            <Controller
              name="fullName"
              control={control}
              rules={{ required: "Nama lengkap wajib diisi" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  autoFocus={isEdit}
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                  disabled={isPending}
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Nomor Telepon"
                  placeholder="08123456789"
                  disabled={isPending}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              rules={{ required: "Role wajib dipilih" }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role} disabled={isPending}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    <MenuItem value="CASHIER">Kasir</MenuItem>
                    <MenuItem value="MECHANIC">Mekanik</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            {isEdit && (
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} disabled={isPending} />
                    }
                    label={<Typography variant="body2">{field.value ? "Aktif" : "Nonaktif"}</Typography>}
                  />
                )}
              />
            )}
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button color="inherit" variant="outlined" disabled={isPending} onClick={handleClose}>
            Batal
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={isPending || (isEdit && !isDirty)}
            startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Kirim Undangan"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UserFormDialog;