import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import {
  Avatar,
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
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { getOrder } from "@api/orderApi.js";
import { formatToIdr } from "@shared/utils";
import { statusColorMap, OrderStatus } from "@shared/constant";
import { useAssignMechanicMutation } from "@views/tasks/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const AssignMechanicDialog = ({
  open,
  step,
  selectedMechanic,
  orderIdentifier,
  onClose,
  onOrderIdentifierChange,
  onNextStep,
  onDataFetched,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const orderQuery = useQuery({
    queryKey: ["order-detail", orderIdentifier],
    queryFn: () => getOrder(orderIdentifier),
    enabled: false,
  });

  const assignMutation = useAssignMechanicMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Mekanik berhasil ditugaskan ke pesanan",
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
          message: error.message || "Gagal menugaskan mekanik",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = assignMutation.isPending;
  const orderData = orderQuery.data;

  const handleNextStep = useCallback(async () => {
    if (!orderIdentifier.trim()) return;
    const result = await orderQuery.refetch();
    const order = result?.data;
    if (order) {
      onDataFetched?.(order);
      onNextStep?.();
    }
  }, [orderIdentifier, orderQuery, onDataFetched, onNextStep]);

  const handleConfirmAssign = useCallback(() => {
    if (!selectedMechanic || !orderQuery.data) return;
    assignMutation.mutate({
      orderId: orderQuery.data.id,
      mechanicId: selectedMechanic.id,
    });
  }, [selectedMechanic, orderQuery.data, assignMutation]);

  return (
    <>
      {/* Step 1: Input Order */}
      <Dialog open={open && step === "input-order"} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Assign Mekanik
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 3 }}>
          <Stack sx={{ gap: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Masukkan nomor order atau ID pesanan yang akan ditugaskan ke{" "}
              <strong>{selectedMechanic?.fullName}</strong>
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label="Nomor Order / ID"
              value={orderIdentifier}
              onChange={(e) => onOrderIdentifierChange(e.target.value)}
              placeholder="ORD-20260215-XXXX"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep();
              }}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose} disabled={orderQuery.isFetching}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleNextStep}
            disabled={!orderIdentifier.trim() || orderQuery.isFetching}
            startIcon={orderQuery.isFetching ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {orderQuery.isFetching ? "Mencari..." : "Lanjut"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Step 2: Confirm */}
      <Dialog open={open && step === "confirm"} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Konfirmasi Penugasan
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
          <Stack sx={{ gap: 3 }}>
            {/* Detail Pesanan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {orderData?.orderNumber}
                    </Typography>
                    <Chip
                      label={OrderStatus[orderData?.status] || orderData?.status}
                      color={statusColorMap[orderData?.status] || "default"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                  </Box>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                    {formatToIdr(orderData?.total || 0)}
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2">{orderData?.customer?.name || "—"}</Typography>
                  </Stack>
                  {orderData?.vehicle?.plateNumber && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Kendaraan</Typography>
                      <Typography variant="body2">
                        {orderData.vehicle.plateNumber}
                        {orderData.vehicle.brand ? ` · ${orderData.vehicle.brand} ${orderData.vehicle.model || ""}` : ""}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Card>

            {/* Items */}
            {orderData?.items?.length > 0 && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                <Box sx={{ p: 3, pb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5 }}>
                    Item Pesanan ({orderData.items.length})
                  </Typography>
                  <Stack sx={{ gap: 2 }}>
                    {orderData.items.map((item, index) => (
                      <Box key={item.id}>
                        <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                          <Avatar
                            alt={item.productName || item.product?.name}
                            src={item.product?.image?.url || ""}
                            variant="rounded"
                            sx={{
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                              borderRadius: `${theme.shape.borderRadius}px`,
                              bgcolor: !item.product?.image?.url ? alpha(theme.palette.secondary.main, 0.08) : "transparent",
                              color: !item.product?.image?.url ? theme.palette.secondary.main : "transparent",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                            }}
                          >
                            {!item.product?.image?.url && (item.productName || item.product?.name)?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.productName || item.product?.name}
                            </Typography>
                            <Stack direction="row" sx={{ gap: 1, alignItems: "center", mt: 0.25 }}>
                              <Chip
                                label={item.product?.type === "SERVICE" ? "Servis" : "Sparepart"}
                                size="small"
                                variant="outlined"
                                color={item.product?.type === "SERVICE" ? "secondary" : "warning"}
                                sx={{ height: 20, fontSize: "0.6875rem" }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {item.quantity} × {formatToIdr(item.unitPrice)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Typography variant="body2">{formatToIdr(item.subtotal)}</Typography>
                        </Stack>
                        {index < orderData.items.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Info Mekanik */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Mekanik yang Ditugaskan
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedMechanic?.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Task aktif: {selectedMechanic?.activeTaskCount}
                </Typography>
              </Box>
            </Card>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAssign}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {isSubmitting ? "Menugaskan..." : "Ya, Tugaskan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssignMechanicDialog;