/**
 * PaymentDetailDialog - Dialog untuk menampilkan detail pembayaran.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {string} props.paymentId - ID pembayaran
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Box, Button, Card, Chip, Collapse, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Skeleton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PaymentMethod, paymentMethodColorMap, paymentStatusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentDetailQuery } from "@views/payments/hooks";
import { CopyButton } from "@components";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={140} sx={{ minHeight: 120 }} />
    <Skeleton variant="rounded" height={200} sx={{ minHeight: 180 }} />
  </Stack>
);

const PaymentDetailDialog = ({ open, paymentId, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data: detailData, isLoading } = usePaymentDetailQuery(paymentId, open);
  const br = `${theme.shape.borderRadius}px`;
  const [itemsExpanded, setItemsExpanded] = useState(false);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Detail Pembayaran
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
            {/* Informasi Pembayaran */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                    Informasi Pembayaran
                  </Typography>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Chip color={paymentMethodColorMap[detailData.method] || "default"} label={PaymentMethod[detailData.method] || detailData.method} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                    <Chip color={paymentStatusColorMap[detailData.status] || "default"} label={detailData.statusLabel} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                  </Stack>
                </Stack>
                <Stack sx={{ gap: 2.5 }}>
                  {[
                    { label: "Jumlah Dibayar", value: formatToIdr(detailData.amountPaid), bold: true },
                    { label: "Kembalian", value: formatToIdr(detailData.change) },
                    { label: "Tanggal Bayar", value: detailData.paidAt ? formatDateTime(detailData.paidAt) : "—" },
                    { label: "Tanggal Dibuat", value: formatDateTime(detailData.createdAt) },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: item.bold ? 600 : 500, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Detail Pesanan */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Detail Pesanan
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  {[
                    { label: "No. Order", value: detailData.order?.orderNumber || "—", copy: true },
                    { label: "Kasir", value: detailData.order?.cashier?.fullName || "—" },
                    { label: "Pelanggan", value: detailData.order?.customer?.name || "—" },
                    ...(detailData.order?.vehicle ? [{ label: "Kendaraan", value: detailData.order.vehicle.plateNumber, copy: true }] : []),
                    { label: "Tanggal Pesanan", value: formatDateTime(detailData.order?.createdAt) },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      {item.copy ? (
                        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>{item.value}</Typography>
                          <CopyButton text={item.value} successMessage={`${item.label} disalin`} />
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>{item.value}</Typography>
                      )}
                    </Stack>
                  ))}
                </Stack>

                {/* Collapsible Items */}
                {detailData.order?.items?.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => setItemsExpanded(!itemsExpanded)}
                      sx={{
                        justifyContent: "space-between", px: 1, py: 1.5,
                        textTransform: "none", fontWeight: 500, color: "text.secondary",
                        borderRadius: br, "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.04) },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                        Item Pesanan ({detailData.order.items.length})
                      </Typography>
                      <ChevronDown
                        size={16} strokeWidth={2}
                        style={{
                          transition: "transform 0.25s ease",
                          transform: itemsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </Button>

                    <Collapse in={itemsExpanded} timeout="auto">
                      <Stack sx={{ gap: 2.5, mt: 2.5 }}>
                        {detailData.order.items.map((item, index) => (
                          <Box key={index}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                              <Stack sx={{ flex: 1, minWidth: 0, gap: 0.75 }}>
                                <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.productName}</Typography>
                                  {item.type && (
                                    <Chip label={item.type === "SERVICE" ? "Servis" : "Sparepart"} size="small" variant="outlined"
                                      color={item.type === "SERVICE" ? "secondary" : "warning"}
                                      sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 20 }} />
                                  )}
                                </Stack>
                                <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
                                  <Typography variant="caption" color="text.secondary">{item.quantity} × {formatToIdr(item.unitPrice)}</Typography>
                                  {item.mechanics?.length > 0 && (
                                    <Typography variant="caption" color="text.disabled">{item.mechanics.map((m) => m.name).join(", ")}</Typography>
                                  )}
                                </Stack>
                              </Stack>
                              <Typography variant="body2" sx={{ fontWeight: 500, flexShrink: 0 }}>{formatToIdr(item.subtotal)}</Typography>
                            </Stack>
                            {index < detailData.order.items.length - 1 && <Divider sx={{ mt: 2.5 }} />}
                          </Box>
                        ))}
                      </Stack>
                    </Collapse>
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Total */}
                <Stack sx={{ gap: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.order?.subtotal)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pajak ({detailData.order?.taxRate}%)</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.order?.tax)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Total</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                      {formatToIdr(detailData.order?.total)}
                    </Typography>
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

export default PaymentDetailDialog;