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

import {
  PaymentMethod,
  paymentMethodColorMap,
  paymentStatusColorMap,
} from "@shared/constant";
import { formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentDetailQuery } from "@views/payments/hooks";
import { CopyButton } from "@components";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={140} />
    <Skeleton variant="rounded" height={180} />
  </Stack>
);

const PaymentDetailDialog = ({ open, paymentId, onClose }) => {
  const theme = useTheme();

  const { data: detailData, isLoading } = usePaymentDetailQuery(paymentId, open);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Pembayaran
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
            {/* Informasi Pembayaran */}
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
                    Informasi Pembayaran
                  </Typography>
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Chip
                      color={paymentMethodColorMap[detailData.method] || "default"}
                      label={PaymentMethod[detailData.method] || detailData.method}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                    <Chip
                      color={paymentStatusColorMap[detailData.status] || "default"}
                      label={detailData.statusLabel}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                  </Stack>
                </Stack>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Jumlah Dibayar</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatToIdr(detailData.amountPaid)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kembalian</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.change)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Bayar</Typography>
                    <Typography variant="body2">{detailData.paidAt ? formatDateTime(detailData.paidAt) : "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Dibuat</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Detail Pesanan + Items + Total */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5 }}>
                  Detail Pesanan
                </Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">No. Order</Typography>
                    <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.order?.orderNumber || "—"}</Typography>
                      <CopyButton text={detailData.order?.orderNumber} successMessage="No. Order disalin" />
                    </Stack>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kasir</Typography>
                    <Typography variant="body2">{detailData.order?.cashier?.fullName || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2">{detailData.order?.customer?.name || "—"}</Typography>
                  </Stack>
                  {detailData.order?.vehicle && (
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Kendaraan</Typography>
                      <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
                        <Typography variant="body2">{detailData.order.vehicle.plateNumber}</Typography>
                        <CopyButton text={detailData.order.vehicle.plateNumber} />
                      </Stack>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Pesanan</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.order?.createdAt)}</Typography>
                  </Stack>
                </Stack>

                {detailData.order?.items?.length > 0 && (
                  <>
                    <Divider sx={{ my: 2.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Item Pesanan ({detailData.order.items.length})
                    </Typography>
                    <Stack sx={{ gap: 2 }}>
                      {detailData.order.items.map((item, index) => (
                        <Box key={index}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Stack sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" sx={{ gap: 1, alignItems: "center", mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.productName}</Typography>
                                {item.type && (
                                  <Chip
                                    label={item.type === "SERVICE" ? "Servis" : "Sparepart"}
                                    size="small"
                                    variant="outlined"
                                    color={item.type === "SERVICE" ? "secondary" : "warning"}
                                    sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 20 }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" sx={{ gap: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {item.quantity} × {formatToIdr(item.unitPrice)}
                                </Typography>
                                {item.mechanics?.length > 0 && (
                                  <Typography variant="caption" color="text.disabled">
                                    {item.mechanics.map((m) => m.name).join(", ")}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                            <Typography variant="body2" sx={{ fontWeight: 500, flexShrink: 0 }}>
                              {formatToIdr(item.subtotal)}
                            </Typography>
                          </Stack>
                          {index < detailData.order.items.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                <Divider sx={{ my: 2.5 }} />

                <Stack sx={{ gap: 1.5 }}>
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

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDetailDialog;