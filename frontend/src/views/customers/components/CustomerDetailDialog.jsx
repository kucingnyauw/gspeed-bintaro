import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime } from "@shared/utils";
import { useCustomerDetailQuery } from "@views/customers/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={80} />
    <Skeleton variant="rounded" height={120} />
  </Stack>
);

const CustomerDetailDialog = ({ customerId, onClose, open }) => {
  const theme = useTheme();

  const { data: detailData, isLoading } = useCustomerDetailQuery(customerId, open);

  const hasVehicles = detailData?.vehicles?.length > 0;
  const hasOrders = detailData?.orders?.length > 0;

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Pelanggan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: 3 }}>
            {/* Info Utama */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>{detailData.name}</Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Telepon</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.phone || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Daftar</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Statistik */}
            <Stack direction="row" sx={{ gap: 2 }}>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 2.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase" }}>Kendaraan</Typography>
                  <Typography variant="h5" component="span" sx={{ fontWeight: 700, display: "block", mt: 1 }}>{detailData.totalVehicles}</Typography>
                </Box>
              </Card>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 2.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase" }}>Order</Typography>
                  <Typography variant="h5" component="span" sx={{ fontWeight: 700, display: "block", mt: 1 }}>{detailData.totalOrders}</Typography>
                </Box>
              </Card>
            </Stack>

            {/* Kendaraan */}
            {hasVehicles && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Kendaraan ({detailData.vehicles.length})</Typography>
                  <Stack sx={{ gap: 1.5 }}>
                    {detailData.vehicles.map((v) => (
                      <Box key={v.id} sx={{ p: 2, borderRadius: `${theme.shape.borderRadius}px`, border: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{v.plateNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">{v.brand} {v.model}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Riwayat Order */}
            {hasOrders && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Riwayat Order ({detailData.orders.length})</Typography>
                  <Stack sx={{ gap: 2 }}>
                    {detailData.orders.map((o, index) => (
                      <Box key={o.id}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{o.orderNumber}</Typography>
                            <Chip label={o.status} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 20 }} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{formatDateTime(o.createdAt)}</Typography>
                        </Stack>
                        {index < detailData.orders.length - 1 && <Divider sx={{ mt: 2 }} />}
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

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog;