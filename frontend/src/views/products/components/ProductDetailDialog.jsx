import { useState } from "react";
import { ChevronDown, Package, X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
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

import { productTypeColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { useProductDetailQuery } from "@views/products/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={200} />
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const ProductDetailDialog = ({ onClose, open, productId }) => {
  const theme = useTheme();
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const { data: detailData, isLoading } = useProductDetailQuery(productId, open);

  const hasPriceHistory = detailData?.priceHistory?.length > 0;
  const margin = (detailData?.price || 0) - (detailData?.cost || 0);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Produk
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
            {/* Gambar */}
            {detailData.image?.url ? (
              <Box
                sx={{
                  width: "100%",
                  height: 250,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  overflow: "hidden",
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                }}
              >
                <Box component="img" src={detailData.image.url} alt={detailData.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 250,
                  gap: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={24} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Tidak ada gambar
                </Typography>
              </Box>
            )}

            {/* Header Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  {detailData.name}
                </Typography>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {detailData.sku || "—"}
                  </Typography>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Chip
                      color={productTypeColorMap[detailData.type] || "default"}
                      label={detailData.type === "SERVICE" ? "Servis" : "Sparepart"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                    <Chip
                      color={detailData.isActive ? "success" : "default"}
                      label={detailData.isActive ? "Aktif" : "Nonaktif"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Pricing */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Harga Jual</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    {formatToIdr(detailData.price)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Harga Modal</Typography>
                  <Typography variant="body2">{formatToIdr(detailData.cost)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Margin</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.success.main }}>
                    {formatToIdr(margin)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    {detailData.type !== "SERVICE" ? "Stok" : "Tipe"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: detailData.type !== "SERVICE" && detailData.stock === 0 ? 600 : 500,
                      color: detailData.type === "SERVICE" ? "text.primary" : detailData.stock > 0 ? "text.primary" : "error.main",
                    }}
                  >
                    {detailData.type === "SERVICE" ? "Layanan" : detailData.stock}
                  </Typography>
                </Stack>
              </Box>
            </Card>

            {/* Deskripsi */}
            {detailData.description && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Deskripsi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {detailData.description}
                  </Typography>
                </Box>
              </Card>
            )}

            {/* Info & Riwayat Harga */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3, pb: hasPriceHistory ? 0 : 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Dibuat</Typography>
                  <Typography variant="body2">{formatDateTime(detailData.createdAt)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Diupdate</Typography>
                  <Typography variant="body2">{formatDateTime(detailData.updatedAt)}</Typography>
                </Stack>
              </Box>

              {hasPriceHistory && (
                <>
                  <Divider />
                  <Box
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      px: 3,
                      py: 2.5,
                      cursor: "pointer",
                      transition: theme.transitions.create("background-color", { duration: theme.transitions.duration.shorter }),
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                    }}
                  >
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Riwayat Harga
                      </Typography>
                      <Chip label={detailData.priceHistory.length} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 22 }} />
                    </Stack>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      style={{
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                        transform: historyExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        opacity: 0.5,
                      }}
                    />
                  </Box>

                  <Collapse in={historyExpanded} timeout="auto" unmountOnExit>
                    <Divider />
                    <Box sx={{ p: 3 }}>
                      <Stack>
                        {detailData.priceHistory.map((history, index) => (
                          <Box key={history.id}>
                            <Box sx={{ pl: 3, borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`, py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatToIdr(history.price)}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Modal: {formatToIdr(history.cost)}</Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: "block" }}>{formatDateTime(history.effectiveFrom)}</Typography>
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

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailDialog;