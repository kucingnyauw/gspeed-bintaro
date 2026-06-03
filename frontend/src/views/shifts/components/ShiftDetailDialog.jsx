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

import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useShiftDetailQuery } from "@views/shifts/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={80} />
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={240} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const ShiftDetailDialog = ({ onClose, open, shiftId }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useShiftDetailQuery(shiftId, open);

  const hasOrders = detailData?.orders?.length > 0;
  const hasExpenses = detailData?.expenses?.length > 0;
  const isOpen = detailData?.status === "OPEN";

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Shift
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
            {/* Header Info */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Kasir</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.25 }}>{detailData.cashier?.fullName || "—"}</Typography>
                  </Box>
                  <Chip color={isOpen ? "success" : "default"} label={isOpen ? "Aktif" : "Tutup"} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />
                </Stack>
              </Box>
            </Card>

            {/* Waktu */}
            <Stack direction="row" sx={{ gap: 2 }}>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary">Waktu Buka</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{formatDateTime(detailData.openedAt)}</Typography>
                </Box>
              </Card>
              <Card sx={{ flex: 1, border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary">Waktu Tutup</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{detailData.closedAt ? formatDateTime(detailData.closedAt) : "—"}</Typography>
                </Box>
              </Card>
            </Stack>

            {/* Ringkasan Keuangan */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5 }}>Ringkasan Keuangan</Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Saldo Awal</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.startingCash)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Penjualan Tunai</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.cashSales || 0)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kas Masuk</Typography>
                    <Typography variant="body2" sx={{ color: "success.main" }}>+{formatToIdr(detailData.cashIn || 0)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Kas Keluar</Typography>
                    <Typography variant="body2" sx={{ color: "error.main" }}>-{formatToIdr(detailData.cashOut || 0)}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Saldo Akhir</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {detailData.endingCash !== null && detailData.endingCash !== undefined ? formatToIdr(detailData.endingCash) : "—"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Selisih</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: detailData.discrepancy !== 0 ? "error.main" : "text.primary" }}>
                      {formatToIdr(detailData.discrepancy || 0)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Total Order</Typography>
                    <Typography variant="body2">{detailData.totalOrders || 0}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Total Pengeluaran</Typography>
                    <Typography variant="body2">{formatToIdr(detailData.totalExpenses || 0)}</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Orders */}
            {hasOrders && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Pesanan ({detailData.orders.length})</Typography>
                  <Stack sx={{ gap: 2 }}>
                    {detailData.orders.map((order, index) => (
                      <Box key={order.id}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{order.orderNumber}</Typography>
                              <Chip color={statusColorMap[order.status] || "default"} label={normalizeEnumText(OrderStatus[order.status] || order.status)} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 20 }} />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                              {order.customer?.name || "—"}{order.paymentStatus === "PAID" && " • Lunas"}{order.paymentStatus === "REFUNDED" && " • Direfund"} • {order.totalItems} item
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatToIdr(order.total)}</Typography>
                        </Stack>
                        {index < detailData.orders.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            )}

            {/* Expenses */}
            {hasExpenses && (
              <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Pengeluaran ({detailData.expenses.length})</Typography>
                  <Stack sx={{ gap: 2 }}>
                    {detailData.expenses.map((expense, index) => (
                      <Box key={expense.id}>
                        <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: `${theme.shape.borderRadius}px`, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(theme.palette.secondary.main, 0.08), color: theme.palette.text.secondary, flexShrink: 0, fontSize: "0.875rem", overflow: "hidden" }}>
                            {expense.receipt?.url ? (
                              <Box component="img" alt="Bukti" src={expense.receipt.url} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              expense.category?.charAt(0) || "?"
                            )}
                          </Box>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{expense.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{normalizeEnumText(expense.category)} • {formatDateTime(expense.date)}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>-{formatToIdr(expense.amount)}</Typography>
                        </Stack>
                        {index < detailData.expenses.length - 1 && <Divider sx={{ mt: 2 }} />}
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

export default ShiftDetailDialog;