/**
 * StockMovementDetailDialog - Dialog untuk menampilkan detail mutasi stok.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {string} props.movementId - ID mutasi stok
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { X } from "lucide-react";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Skeleton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatToIdr, formatDateTime } from "@shared/utils";
import { useStockMovementDetailQuery } from "@views/stock/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={140} sx={{ minHeight: 120 }} />
    <Skeleton variant="rounded" height={120} sx={{ minHeight: 100 }} />
    <Skeleton variant="rounded" height={120} sx={{ minHeight: 100 }} />
  </Stack>
);

const StockMovementDetailDialog = ({ open, movementId, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data: detailData, isLoading } = useStockMovementDetailQuery(movementId, open);
  const br = `${theme.shape.borderRadius}px`;

  const isIn = detailData?.type === "IN";
  const isOut = detailData?.type === "OUT";
  const hasOrder = !!detailData?.orderItem?.order;

  const getSourceLabel = (sourceType) => {
    const labels = { SALE: "Penjualan", PURCHASE: "Pembelian", MANUAL: "Manual", RETURN: "Retur", ADJUSTMENT: "Penyesuaian" };
    return labels[sourceType] || sourceType || "—";
  };

  const getMovementLabel = () => { if (isIn) return "Masuk"; if (isOut) return "Keluar"; return "Penyesuaian"; };
  const getMovementColor = () => { if (isIn) return "success"; if (isOut) return "error"; return "warning"; };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Detail Mutasi Stok
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
            {/* Informasi Mutasi */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Informasi Mutasi
                  </Typography>
                  <Chip label={getMovementLabel()} color={getMovementColor()} size="small" variant="soft" sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }} />
                </Stack>
                <Stack sx={{ gap: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.125rem" }, color: isIn ? theme.palette.success.main : isOut ? theme.palette.error.main : theme.palette.warning.main }}>
                      {isIn ? "+" : ""}{detailData.quantity}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Sumber</Typography>
                    <Typography variant="body2">{getSourceLabel(detailData.sourceType)}</Typography>
                  </Stack>
                  {detailData.note && (
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, mr: 2 }}>Catatan</Typography>
                      <Typography variant="body2" sx={{ maxWidth: "65%", textAlign: "right", lineHeight: 1.5 }}>{detailData.note}</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Produk */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Produk
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  {[
                    { label: "Nama", value: detailData.product?.name || "—", bold: true },
                    { label: "SKU", value: detailData.product?.sku || "—" },
                    { label: "Stok Saat Ini", value: detailData.product?.stock ?? 0, bold: true },
                    { label: "Harga", value: formatToIdr(detailData.product?.price || 0) },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: item.bold ? 600 : 500 }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Order Info */}
            {hasOrder && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`, bgcolor: alpha(theme.palette.secondary.main, 0.02), boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Pesanan Terkait
                  </Typography>
                  <Stack sx={{ gap: 2.5 }}>
                    {[
                      { label: "No. Order", value: detailData.orderItem.order.orderNumber, bold: true },
                      { label: "Produk", value: detailData.orderItem.productName },
                      { label: "Qty × Harga", value: `${detailData.orderItem.quantity} × ${formatToIdr(detailData.orderItem.unitPrice)}` },
                      { label: "Subtotal", value: formatToIdr(detailData.orderItem.subtotal), bold: true },
                    ].map((item, i) => (
                      <Stack key={i} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: item.bold ? 600 : 500 }}>{item.value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Dicatat Oleh */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Dicatat Oleh
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Nama</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.recordedBy?.fullName || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Chip label={detailData.recordedBy?.role || "—"} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                  </Stack>
                </Stack>
              </Box>
            </Card>
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

export default StockMovementDetailDialog;