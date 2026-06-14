/**
 * ProductDetailDialog - Dialog untuk menampilkan detail produk.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {string} props.productId - ID produk
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { useState } from "react";
import { ChevronDown, ImageOff, X } from "lucide-react";
import {
  Box, Button, Card, Chip, Collapse, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Skeleton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { productTypeColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { useProductDetailQuery } from "@views/products/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={220} sx={{ minHeight: 180 }} />
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
    <Skeleton variant="rounded" height={140} sx={{ minHeight: 120 }} />
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
  </Stack>
);

const ProductDetailDialog = ({ onClose, open, productId }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const { data: detailData, isLoading } = useProductDetailQuery(productId, open);
  const br = `${theme.shape.borderRadius}px`;

  const hasPriceHistory = detailData?.priceHistory?.length > 0;
  const margin = (detailData?.price || 0) - (detailData?.cost || 0);
  const marginPercent = detailData?.cost > 0 ? ((margin / detailData.cost) * 100).toFixed(1) : "0";

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Detail Produk
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
            {/* Gambar */}
            {detailData.image?.url ? (
              <Box sx={{ width: "100%", height: { xs: 220, sm: 280 }, borderRadius: br, overflow: "hidden", border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, bgcolor: alpha(theme.palette.divider, 0.1) }}>
                <Box component="img" src={detailData.image.url} alt={detailData.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
            ) : (
              <Box sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                py: { xs: 5, sm: 6 }, gap: 2, minHeight: { xs: 160, sm: 200 },
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                borderRadius: br, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              }}>
                <Box sx={{
                  width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 },
                  borderRadius: "50%", bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ImageOff size={isMobile ? 20 : 24} strokeWidth={1.5} style={{ opacity: 0.25 }} />
                </Box>
                <Stack sx={{ gap: 0.5, alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Tidak ada gambar
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Gambar produk tidak tersedia
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Header Info */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}>
                  {detailData.name}
                </Typography>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">SKU: {detailData.sku || "—"}</Typography>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Chip color={productTypeColorMap[detailData.type] || "default"} label={detailData.type === "SERVICE" ? "Servis" : "Sparepart"} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                    <Chip color={detailData.isActive ? "success" : "default"} label={detailData.isActive ? "Aktif" : "Nonaktif"} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Pricing */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Informasi Harga
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  {[
                    { label: "Harga Jual", value: formatToIdr(detailData.price), bold: true, color: theme.palette.secondary.main },
                    { label: "Harga Modal", value: formatToIdr(detailData.cost) },
                    { label: "Margin", value: `${formatToIdr(margin)} (${marginPercent}%)`, bold: true, color: margin >= 0 ? theme.palette.success.main : theme.palette.error.main },
                    { label: detailData.type !== "SERVICE" ? "Stok" : "Tipe", value: detailData.type === "SERVICE" ? "Layanan" : detailData.stock, bold: detailData.type !== "SERVICE" && detailData.stock === 0, color: detailData.type === "SERVICE" ? "text.primary" : detailData.stock > 0 ? "text.primary" : "error.main" },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: item.bold ? 600 : 500, color: item.color || "text.primary" }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Deskripsi */}
            {detailData.description && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Deskripsi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    {detailData.description}
                  </Typography>
                </Box>
              </Card>
            )}

            {/* Info & Riwayat Harga */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: hasPriceHistory ? 0 : { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Informasi Lainnya
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Dibuat</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Diupdate</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.updatedAt)}</Typography>
                  </Stack>
                </Stack>
              </Box>

              {hasPriceHistory && (
                <>
                  <Divider />
                  <Box
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: { xs: 2.5, sm: 3 }, py: 2.5, cursor: "pointer", transition: theme.transitions.create("background-color", { duration: theme.transitions.duration.shorter }), "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.03) } }}>
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                        Riwayat Harga
                      </Typography>
                      <Chip label={detailData.priceHistory.length} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 22 }} />
                    </Stack>
                    <ChevronDown size={16} strokeWidth={1.5} style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: historyExpanded ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }} />
                  </Box>

                  <Collapse in={historyExpanded} timeout="auto" unmountOnExit>
                    <Divider />
                    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                      <Stack>
                        {detailData.priceHistory.map((history, index) => (
                          <Box key={history.id}>
                            <Box sx={{ pl: 3, py: 2, borderLeft: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}` }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatToIdr(history.price)}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Modal: {formatToIdr(history.cost)}</Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>{formatDateTime(history.effectiveFrom)}</Typography>
                            </Box>
                            {index < detailData.priceHistory.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                </>
              )}
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

export default ProductDetailDialog;