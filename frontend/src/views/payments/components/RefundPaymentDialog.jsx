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
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatToIdr } from "@shared/utils";
import { useRefundPaymentMutation } from "@views/payments/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const RefundPaymentDialog = ({
  onClose,
  onReasonChange,
  open,
  payment,
  reason,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const refundMutation = useRefundPaymentMutation({
    onSuccess: (data) => {
      dispatch(
        showNotification({
          message: `Pembayaran untuk #${data?.order?.orderNumber || payment?.order?.orderNumber} berhasil direfund`,
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
          message: error.message || "Gagal merefund pembayaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = refundMutation.isPending;

  const handleConfirm = () => {
    if (!payment) return;
    refundMutation.mutate({
      id: payment.id,
      reason: reason || undefined,
    });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={isPending ? undefined : onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Refund Pembayaran
          </Typography>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Stack sx={{ gap: 3 }}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <Box sx={{ p: 2.5 }}>
              <Stack sx={{ gap: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">No. Order</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{payment?.order?.orderNumber || "—"}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatToIdr(payment?.amountPaid || 0)}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Card>

          <TextField
            fullWidth
            label="Alasan Refund"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Masukkan alasan refund (opsional)"
            multiline
            rows={3}
            disabled={isPending}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isPending} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isPending ? "Merefund..." : "Refund"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundPaymentDialog;