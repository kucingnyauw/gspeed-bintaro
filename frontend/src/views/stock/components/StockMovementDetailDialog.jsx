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

import { formatToIdr, formatDateTime } from "@shared/utils";
import { useStockMovementDetailQuery } from "@views/stock/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={140} />
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={100} />
  </Stack>
);

const StockMovementDetailDialog = ({ open, movementId, onClose }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useStockMovementDetailQuery(movementId, open);

  const isIn = detailData?.type === "IN";
  const isOut = detailData?.type === "OUT";
  const hasOrder = !!detailData?.orderItem?.order;

  const movementColor = isIn ? theme.palette.success.main : isOut ? theme.palette.error.main : theme.palette.warning.main;

  const getSourceLabel = (sourceType) => {
    const labels = { SALE: "Penjualan", PURCHASE: "Pembelian", MANUAL: "Manual", RETURN: "Retur", ADJUSTMENT: "Penyesuaian" };
    return labels[sourceType] || sourceType || "—";
  };

  const getMovementLabel = () => {
    if (isIn) return "Masuk";
    if (isOut) return "Keluar";
    return "Penyesuaian";
  };

  const getMovementColor = () => {
    if (isIn) return "success";
    if (isOut) return "error";
    return "warning";
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Mutasi Stok
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
            {/* Informasi Mutasi */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Informasi Mutasi
                  </Typography>
                  <Chip
                    label={getMovementLabel()}
                    color={getMovementColor()}
                    size="small"
                    variant="soft"
                    sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
                  />
                </Stack>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: movementColor, fontSize: "1.125rem" }}>
                      {isIn ? "+" : ""}{detailData.quantity}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Sumber</Typography>
                    <Typography variant="body2">{getSourceLabel(detailData.sourceType)}</Typography>
                  </Stack>
                  {detailData.note && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Catatan</Typography>
                      <Typography variant="body2" sx={{ maxWidth: "60%", textAlign: "right" }}>{detailData.note}</Typography>
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
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Produk
                </Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Nama</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.product?.name || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">SKU</Typography>
                    <Typography variant="body2">{detailData.product?.sku || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Stok Saat Ini</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{detailData.product?.stock ?? 0}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Harga</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.product?.price || 0)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Order Info */}
            {hasOrder && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  boxShadow: "none",
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Pesanan Terkait
                  </Typography>
                  <Stack sx={{ gap: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">No. Order</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.orderItem.order.orderNumber}</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Produk</Typography>
                      <Typography variant="body2">{detailData.orderItem.productName}</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Qty × Harga</Typography>
                      <Typography variant="body2">{detailData.orderItem.quantity} × {formatToIdr(detailData.orderItem.unitPrice)}</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatToIdr(detailData.orderItem.subtotal)}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Dicatat Oleh */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Dicatat Oleh
                </Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
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

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockMovementDetailDialog;