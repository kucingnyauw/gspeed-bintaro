import { useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { formatToIdr, formatDateTime } from "@shared/utils";
import {
  useOpenShiftMutation,
  useStartingCashSuggestion,
} from "@views/shifts/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ShiftOpenDialog = ({ onClose, open }) => {
  const dispatch = useDispatch();

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { startingCash: "" },
  });
  const watchStartingCash = watch("startingCash");

  const { data: suggestion, isLoading: isSuggestionLoading } = useStartingCashSuggestion(open);

  const openShiftMutation = useOpenShiftMutation({
    onSuccess: () => {
      dispatch(showNotification({ message: "Shift baru berhasil dibuka", type: "success", title: "Berhasil", variant: "snackbar", autoHide: 3000 }));
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(showNotification({ message: error.message || "Gagal membuka shift", type: "error", title: "Error", variant: "snackbar", autoHide: 5000 }));
    },
  });

  const isPending = openShiftMutation.isPending;

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (formData) => {
    openShiftMutation.mutate({ startingCash: Number(formData.startingCash) });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : handleClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Buka Shift Baru
          </Typography>
          <IconButton onClick={handleClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Stack sx={{ gap: 3 }}>
          {isSuggestionLoading ? (
            <Card sx={{ border: `1px solid`, borderColor: "divider", boxShadow: "none", borderRadius: 1 }}>
              <Box sx={{ p: 2.5 }}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="60%" height={28} sx={{ mt: 1.5 }} />
                <Skeleton width="80%" height={14} sx={{ mt: 1 }} />
              </Box>
            </Card>
          ) : suggestion ? (
            <Card sx={{ border: `1px solid`, borderColor: "divider", boxShadow: "none", borderRadius: 1 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Saran Saldo Awal</Typography>
                <Typography variant="h5" component="span" sx={{ fontWeight: 700, color: "secondary.main", display: "block", mt: 0.5 }}>
                  {formatToIdr(suggestion.suggestedStartingCash)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{suggestion.message}</Typography>

                {suggestion.lastShift && (
                  <>
                    <Divider sx={{ my: 2.5 }} />
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Shift Sebelumnya</Typography>
                      <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                        <Chip label={formatToIdr(suggestion.lastShift.endingCash)} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                        <Typography variant="caption" color="text.disabled">{formatDateTime(suggestion.lastShift.closedAt)}</Typography>
                      </Stack>
                    </Stack>
                  </>
                )}
              </Box>
            </Card>
          ) : (
            <Card sx={{ border: `1px solid`, borderColor: "divider", boxShadow: "none", borderRadius: 1 }}>
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">Tidak ada data shift sebelumnya</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>Masukkan saldo awal secara manual</Typography>
              </Box>
            </Card>
          )}

          <Controller
            control={control}
            name="startingCash"
            rules={{ required: true, min: 1000 }}
            render={({ field, fieldState }) => (
              <TextField {...field} fullWidth autoFocus label="Saldo Awal" placeholder="Rp 0" error={!!fieldState.error} helperText={fieldState.error ? "Saldo awal wajib diisi (min. Rp 1.000)" : ""} disabled={isPending} value={field.value ? formatToIdr(field.value) : ""} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); field.onChange(raw ? Number(raw) : ""); }} />
            )}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={handleClose}>Batal</Button>
        <Button variant="contained" disabled={!watchStartingCash || isPending} onClick={handleSubmit(onSubmit)} startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}>
          {isPending ? "Membuka..." : "Buka Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftOpenDialog;