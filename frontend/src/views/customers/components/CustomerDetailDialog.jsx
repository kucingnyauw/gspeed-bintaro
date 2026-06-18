/**
 * CustomerDetailDialog - Dialog untuk menampilkan detail lengkap pelanggan.
 *
 * Menampilkan:
 * - Informasi utama (nama, telepon, tanggal daftar)
 * - Statistik (kendaraan, order, total belanja)
 * - Daftar kendaraan dengan plat nomor, brand, model
 * - Riwayat order dengan nomor order, status, dan tanggal
 * - Loading skeleton saat data di-fetch
 *
 * @component
 * @param {Object} props
 * @param {string} props.customerId - ID pelanggan
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element} Dialog detail pelanggan
 */
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

import { formatDateTime, formatToIdr } from "@shared/utils";
import { useCustomerDetailQuery } from "@views/customers/hooks";
import { useDevice } from "@hooks";

/**
 * DetailSkeleton - Skeleton loading untuk konten detail pelanggan.
 *
 * @returns {JSX.Element} Skeleton placeholder
 */
const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={120} />
    <Stack direction="row" sx={{ gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={80} sx={{ flex: 1 }} />
      ))}
    </Stack>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={140} />
  </Stack>
);

const CustomerDetailDialog = ({ customerId, onClose, open }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();

  /**
   * Fetch detail pelanggan. Hanya fetch jika dialog terbuka.
   */
  const { data: detailData, isLoading } = useCustomerDetailQuery(customerId, open);

  /** @type {string} */
  const br = `${theme.shape.borderRadius}px`;

  /** @type {boolean} */
  const hasVehicles = detailData?.vehicles?.length > 0;

  /** @type {boolean} */
  const hasOrders = detailData?.orders?.length > 0;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : br,
            overflow: "hidden",
          },
        },
      }}
    >
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
          <Stack sx={{ gap: 3 }}>
            {/* Info Utama */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5, fontSize: "1rem" }}>
                  {detailData.name}
                </Typography>

                <Stack sx={{ gap: 1 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Telepon</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.phone || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Terdaftar</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Statistik */}
            <Stack direction="row" sx={{ gap: { xs: 2, sm: 3 } }}>
              {[
                { label: "Kendaraan", value: detailData.totalVehicles },
                { label: "Order", value: detailData.totalOrders },
                { label: "Total Belanja", value: formatToIdr(detailData.totalSpent || 0) },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  sx={{
                    flex: 1,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    boxShadow: "none",
                    borderRadius: br,
                  }}
                >
                  <Box sx={{ p: { xs: 2, sm: 2.5 }, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, lineHeight: 1.2 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 500,
                        textTransform: "uppercase",
                        fontSize: "0.6875rem",
                        letterSpacing: "0.05em",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Stack>

            {/* Kendaraan */}
            {hasVehicles && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: br,
                }}
              >
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5, fontSize: "0.875rem" }}>
                    Kendaraan ({detailData.vehicles.length})
                  </Typography>
                  <Stack sx={{ gap: 1.5 }}>
                    {detailData.vehicles.map((v) => (
                      <Stack
                        key={v.id}
                        sx={{
                          p: 2,
                          borderRadius: br,
                          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                          {v.plateNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {v.brand} {v.model}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Riwayat Order */}
            {hasOrders && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: br,
                }}
              >
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5, fontSize: "0.875rem" }}>
                    Riwayat Order ({detailData.orders.length})
                  </Typography>
                  <Stack sx={{ gap: 1.5 }}>
                    {detailData.orders.map((o) => (
                      <Stack
                        key={o.id}
                        direction="row"
                        sx={{
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          borderRadius: br,
                          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        }}
                      >
                        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {o.orderNumber}
                          </Typography>
                          <Chip
                            label={o.status}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 22 }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(o.createdAt)}
                        </Typography>
                      </Stack>
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
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, px: 3 }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailDialog;