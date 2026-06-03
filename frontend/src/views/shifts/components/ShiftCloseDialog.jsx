import { useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
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
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatToIdr } from "@shared/utils";
import { useCloseShiftMutation, useExpectedCash } from "@views/shifts/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ShiftCloseDialog = ({ onClose, open, shiftId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { endingCash: "" },
  });
  const watchEndingCash = watch("endingCash");

  const { data: expectedCash, isLoading } = useExpectedCash(shiftId, open && !!shiftId);

  const closeShiftMutation = useCloseShiftMutation({
    onSuccess: () => {
      dispatch(showNotification({ message: "Shift berhasil ditutup", type: "success", title: "Berhasil", variant: "snackbar", autoHide: 3000 }));
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(showNotification({ message: error.message || "Gagal menutup shift", type: "error", title: "Error", variant: "snackbar", autoHide: 5000 }));
    },
  });

  const isPending = closeShiftMutation.isPending;

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (formData) => {
    if (!shiftId) return;
    closeShiftMutation.mutate({ id: shiftId, payload: { endingCash: Number(formData.endingCash) } });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : handleClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Tutup Shift
          </Typography>
          <IconButton onClick={handleClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Stack sx={{ gap: 3 }}>
          {isLoading ? (
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 2.5 }}>
                <Skeleton width="50%" height={16} />
                <Skeleton width="100%" height={14} sx={{ mt: 1.5 }} />
                <Skeleton width="80%" height={14} sx={{ mt: 1 }} />
                <Skeleton width="60%" height={14} sx={{ mt: 1 }} />
              </Box>
            </Card>
          ) : expectedCash ? (
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase", display: "block", mb: 2 }}>
                  Perhitungan Sistem
                </Typography>

                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Saldo Awal</Typography>
                    <Typography variant="body2">{formatToIdr(expectedCash.startingCash)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Penjualan Tunai</Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 500 }}>+{formatToIdr(expectedCash.cashSales)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kas Masuk</Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 500 }}>+{formatToIdr(expectedCash.cashIn)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kas Keluar</Typography>
                    <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>-{formatToIdr(expectedCash.cashOut)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pengeluaran</Typography>
                    <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>-{formatToIdr(expectedCash.totalExpenses)}</Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ p: 2, borderRadius: `${theme.shape.borderRadius}px`, bgcolor: alpha(theme.palette.secondary.main, 0.06), border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}` }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Saldo Diharapkan</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>{formatToIdr(expectedCash.expectedCash)}</Typography>
                  </Stack>
                </Box>

                {expectedCash.paymentBreakdown && (
                  <>
                    <Divider sx={{ my: 2.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 2 }}>
                      Rincian Pembayaran
                    </Typography>
                    <Stack sx={{ gap: 1.5 }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">Tunai</Typography>
                        <Typography variant="body2">{formatToIdr(expectedCash.paymentBreakdown.cash?.total || 0)} ({expectedCash.paymentBreakdown.cash?.count || 0}x)</Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">QRIS</Typography>
                        <Typography variant="body2">{formatToIdr(expectedCash.paymentBreakdown.qris?.total || 0)} ({expectedCash.paymentBreakdown.qris?.count || 0}x)</Typography>
                      </Stack>
                    </Stack>
                  </>
                )}
              </Box>
            </Card>
          ) : (
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">Tidak dapat memuat perhitungan</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>Masukkan saldo akhir secara manual</Typography>
              </Box>
            </Card>
          )}

          <Controller
            control={control}
            name="endingCash"
            rules={{ required: true, min: 0 }}
            render={({ field, fieldState }) => (
              <TextField {...field} fullWidth autoFocus label="Saldo Akhir Aktual" placeholder="Rp 0" error={!!fieldState.error} helperText={fieldState.error ? "Saldo akhir wajib diisi" : ""} disabled={isPending} value={field.value ? formatToIdr(field.value) : ""} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); field.onChange(raw ? Number(raw) : ""); }} />
            )}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={handleClose}>Batal</Button>
        <Button variant="contained" disabled={!watchEndingCash || isPending} onClick={handleSubmit(onSubmit)} startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}>
          {isPending ? "Menutup Shift..." : "Tutup Shift"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftCloseDialog;