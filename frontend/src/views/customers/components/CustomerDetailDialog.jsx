/**
 * CustomerDetailDialog - Dialog untuk menampilkan detail pelanggan.
 *
 * @component
 * @param {Object} props
 * @param {string} props.customerId - ID pelanggan
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { X } from "lucide-react";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Skeleton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime, formatToIdr } from "@shared/utils";
import { useCustomerDetailQuery } from "@views/customers/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
    <Skeleton variant="rounded" height={80} sx={{ minHeight: 60 }} />
    <Skeleton variant="rounded" height={140} sx={{ minHeight: 120 }} />
  </Stack>
);

const CustomerDetailDialog = ({ customerId, onClose, open }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data: detailData, isLoading } = useCustomerDetailQuery(customerId, open);
  const br = `${theme.shape.borderRadius}px`;

  const hasVehicles = detailData?.vehicles?.length > 0;
  const hasOrders = detailData?.orders?.length > 0;

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Detail Pelanggan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: 4 }}>
            {/* Info Utama */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                  {detailData.name}
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Telepon</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.phone || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Daftar</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Statistik */}
            <Stack direction="row" sx={{ gap: { xs: 2, sm: 3 } }}>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2, sm: 2.5 }, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase", fontSize: { xs: "0.625rem", sm: "0.6875rem" }, letterSpacing: "0.05em" }}>
                    Kendaraan
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, display: "block", mt: 1, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                    {detailData.totalVehicles}
                  </Typography>
                </Box>
              </Card>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2, sm: 2.5 }, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase", fontSize: { xs: "0.625rem", sm: "0.6875rem" }, letterSpacing: "0.05em" }}>
                    Order
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, display: "block", mt: 1, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                    {detailData.totalOrders}
                  </Typography>
                </Box>
              </Card>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2, sm: 2.5 }, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase", fontSize: { xs: "0.625rem", sm: "0.6875rem" }, letterSpacing: "0.05em" }}>
                    Total Belanja
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, display: "block", mt: 1, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                    {formatToIdr(detailData.totalSpent || 0)}
                  </Typography>
                </Box>
              </Card>
            </Stack>

            {/* Kendaraan */}
            {hasVehicles && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Kendaraan ({detailData.vehicles.length})
                  </Typography>
                  <Stack sx={{ gap: 2 }}>
                    {detailData.vehicles.map((v) => (
                      <Box key={v.id} sx={{ p: 2, borderRadius: br, border: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{v.plateNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">{v.brand} {v.model}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Riwayat Order */}
            {hasOrders && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Riwayat Order ({detailData.orders.length})
                  </Typography>
                  <Stack sx={{ gap: 2.5 }}>
                    {detailData.orders.map((o, index) => (
                      <Box key={o.id}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{o.orderNumber}</Typography>
                            <Chip label={o.status} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 20 }} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{formatDateTime(o.createdAt)}</Typography>
                        </Stack>
                        {index < detailData.orders.length - 1 && <Divider sx={{ mt: 2.5 }} />}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}
          </Stack>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, px: 3 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog;