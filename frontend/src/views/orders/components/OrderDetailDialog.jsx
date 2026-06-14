/**
 * OrderDetailDialog - Dialog untuk menampilkan detail pesanan.
 *
 * @component
 * @param {Object} props
 * @param {string} props.orderId - ID pesanan
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Avatar,
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

import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useOrderDetailQuery } from "@views/orders/hooks";
import { CopyButton } from "@components";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={160} sx={{ minHeight: 140 }} />
    <Skeleton variant="rounded" height={140} sx={{ minHeight: 120 }} />
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
    <Skeleton variant="rounded" height={220} sx={{ minHeight: 200 }} />
  </Stack>
);

const OrderDetailDialog = ({ orderId, onClose, open }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data, isLoading } = useOrderDetailQuery(orderId, open && !!orderId);
  const br = `${theme.shape.borderRadius}px`;

  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const hasCustomer = data?.customer?.name;
  const hasVehicle = data?.vehicle?.plateNumber;
  const hasPayment = !!data?.payment;

  const getPaymentChip = () => {
    const status = data?.paymentStatus;
    if (status === "Lunas")
      return (
        <Chip
          label="Lunas"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
        />
      );
    if (status === "Menunggu Pembayaran" || status === "Belum Bayar")
      return (
        <Chip
          label={status}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
        />
      );
    if (status === "Direfund")
      return (
        <Chip
          label="Direfund"
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
        />
      );
    return (
      <Chip
        label={status || "—"}
        size="small"
        color="error"
        variant="outlined"
        sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
      />
    );
  };

  const getPaymentMethodLabel = (method) => {
    const map = { CASH: "Tunai", QRIS: "QRIS" };
    return map[method] || method;
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}
          >
            Detail Pesanan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        {isLoading || !data ? (
          <DetailSkeleton />
        ) : (
          <Stack sx={{ gap: 4 }}>
            {/* Order Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      sx={{ gap: 1, alignItems: "center", mb: 1 }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: "0.9375rem", sm: "1rem" },
                        }}
                      >
                        {data.orderNumber}
                      </Typography>
                      <CopyButton
                        text={data.orderNumber}
                        successMessage="No. Order disalin"
                      />
                    </Stack>
                    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        color={statusColorMap[data.status] || "default"}
                        label={normalizeEnumText(
                          OrderStatus[data.status] || data.status
                        )}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      {getPaymentChip()}
                    </Stack>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.secondary.main,
                      fontSize: { xs: "1.125rem", sm: "1.25rem" },
                    }}
                  >
                    {formatToIdr(data.total)}
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Stack sx={{ gap: 2.5 }}>
                  {[
                    { label: "Kasir", value: data.cashier?.fullName || "—" },
                    { label: "Tanggal", value: formatDateTime(data.createdAt) },
                    ...(data.startedAt
                      ? [
                          {
                            label: "Dimulai",
                            value: formatDateTime(data.startedAt),
                          },
                        ]
                      : []),
                    ...(data.completedAt
                      ? [
                          {
                            label: "Selesai",
                            value: formatDateTime(data.completedAt),
                          },
                        ]
                      : []),
                    ...(data.closedAt
                      ? [
                          {
                            label: "Ditutup",
                            value: formatDateTime(data.closedAt),
                          },
                        ]
                      : []),
                  ].map((item, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body2">{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>

                {hasPayment && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        mb: 3,
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      Detail Pembayaran
                    </Typography>
                    <Stack sx={{ gap: 2.5 }}>
                      {[
                        {
                          label: "Metode",
                          value: getPaymentMethodLabel(data.payment.method),
                        },
                        {
                          label: "Jumlah Dibayar",
                          value: formatToIdr(data.payment.amountPaid),
                          bold: true,
                        },
                        ...(data.payment.paidAt
                          ? [
                              {
                                label: "Waktu Bayar",
                                value: formatDateTime(data.payment.paidAt),
                              },
                            ]
                          : []),
                      ].map((item, i) => (
                        <Stack
                          key={i}
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: item.bold ? 600 : 500 }}
                          >
                            {item.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </Box>
            </Card>

            {/* Customer & Vehicle */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  }}
                >
                  Data Pelanggan
                </Typography>
                {hasCustomer || hasVehicle ? (
                  <Stack sx={{ gap: 2.5 }}>
                    {hasCustomer && (
                      <>
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Nama
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {data.customer.name}
                          </Typography>
                        </Stack>
                        {data.customer.phone && (
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Telepon
                            </Typography>
                            <Stack
                              direction="row"
                              sx={{ gap: 1, alignItems: "center" }}
                            >
                              <Typography variant="body2">
                                {data.customer.phone}
                              </Typography>
                              <CopyButton text={data.customer.phone} />
                            </Stack>
                          </Stack>
                        )}
                      </>
                    )}
                    {hasVehicle && (
                      <>
                        <Divider />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                          }}
                        >
                          Data Kendaraan
                        </Typography>
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Plat Nomor
                          </Typography>
                          <Stack
                            direction="row"
                            sx={{ gap: 1, alignItems: "center" }}
                          >
                            <Typography variant="body2">
                              {data.vehicle.plateNumber}
                            </Typography>
                            <CopyButton text={data.vehicle.plateNumber} />
                          </Stack>
                        </Stack>
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Merek / Model
                          </Typography>
                          <Typography variant="body2">
                            {data.vehicle.brand} {data.vehicle.model || ""}
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 4 }}
                  >
                    Tidak ada data pelanggan
                  </Typography>
                )}
              </Box>
            </Card>

            {/* Items - Collapsible */}
            {data.items?.length > 0 && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: br,
                  overflow: "hidden",
                }}
              >
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setItemsExpanded(!itemsExpanded)}
                  sx={{
                    justifyContent: "space-between",
                    px: { xs: 2.5, sm: 3 },
                    py: 2,
                    textTransform: "none",
                    fontWeight: 500,
                    color: "text.secondary",
                    borderRadius: 0,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ gap: 1.5, alignItems: "center" }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      Item Pesanan
                    </Typography>
                    <Chip
                      label={data.items.length}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.6875rem",
                        height: 22,
                      }}
                    />
                  </Stack>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    style={{
                      transition: "transform 0.25s ease",
                      transform: itemsExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </Button>

                <Collapse in={itemsExpanded} timeout="auto">
                  <Divider />
                  <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Stack sx={{ gap: 3 }}>
                      {data.items.map((item, index) => (
                        <Box key={item.id}>
                          <Stack
                            direction="row"
                            sx={{
                              gap: { xs: 2, sm: 2.5 },
                              alignItems: "center",
                            }}
                          >
                            <Avatar
                              alt={item.productName || item.product?.name}
                              src={item.product?.image?.url || ""}
                              variant="rounded"
                              sx={{
                                width: { xs: 40, sm: 44 },
                                height: { xs: 40, sm: 44 },
                                flexShrink: 0,
                                borderRadius: br,
                                bgcolor: !item.product?.image?.url
                                  ? alpha(theme.palette.secondary.main, 0.08)
                                  : "transparent",
                                color: !item.product?.image?.url
                                  ? theme.palette.secondary.main
                                  : "transparent",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                              }}
                            >
                              {!item.product?.image?.url &&
                                (item.productName || item.product?.name)
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                            </Avatar>
                            <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
                              <Stack
                                direction="row"
                                sx={{
                                  gap: 1,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {item.productName || item.product?.name}
                                </Typography>
                                <Chip
                                  label={
                                    item.product?.type === "SERVICE"
                                      ? "Servis"
                                      : "Sparepart"
                                  }
                                  size="small"
                                  variant="outlined"
                                  color={
                                    item.product?.type === "SERVICE"
                                      ? "secondary"
                                      : "warning"
                                  }
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: "0.6875rem",
                                    height: 20,
                                  }}
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.quantity} × {formatToIdr(item.unitPrice)}
                              </Typography>
                              {item.assignments?.length > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  {item.assignments
                                    .map((a) => a.mechanic?.fullName)
                                    .filter(Boolean)
                                    .join(", ")}
                                </Typography>
                              )}
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, flexShrink: 0 }}
                            >
                              {formatToIdr(item.subtotal)}
                            </Typography>
                          </Stack>
                          {index < data.items.length - 1 && (
                            <Divider sx={{ mt: 3 }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            )}

            {/* History Timeline - Collapsible */}
            {data.histories?.length > 0 && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: br,
                  overflow: "hidden",
                }}
              >
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  sx={{
                    justifyContent: "space-between",
                    px: { xs: 2.5, sm: 3 },
                    py: 2,
                    textTransform: "none",
                    fontWeight: 500,
                    color: "text.secondary",
                    borderRadius: 0,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ gap: 1.5, alignItems: "center" }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      Riwayat Status
                    </Typography>
                    <Chip
                      label={data.histories.length}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.6875rem",
                        height: 22,
                      }}
                    />
                  </Stack>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    style={{
                      transition: "transform 0.25s ease",
                      transform: historyExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </Button>

                <Collapse in={historyExpanded} timeout="auto">
                  <Divider />
                  <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Stack sx={{ position: "relative", pl: 4 }}>
                      <Box
                        sx={{
                          position: "absolute",
                          top: 6,
                          bottom: 6,
                          left: 6.5,
                          width: 2,
                          bgcolor: alpha(theme.palette.divider, 0.6),
                          borderRadius: 1,
                        }}
                      />
                      {data.histories.map((history, index) => {
                        const statusColor =
                          theme.palette[
                            statusColorMap[history.status] || "grey"
                          ]?.main || theme.palette.grey[400];
                        const isLast = index === data.histories.length - 1;
                        return (
                          <Box
                            key={history.id}
                            sx={{ position: "relative", pb: isLast ? 0 : 5 }}
                          >
                            <Box
                              sx={{
                                position: "absolute",
                                top: 5,
                                left: -25.5,
                                width: 11,
                                height: 11,
                                borderRadius: "50%",
                                bgcolor: statusColor,
                                border: `2px solid ${theme.palette.background.paper}`,
                                boxShadow: `0 0 0 3px ${alpha(
                                  statusColor,
                                  0.15
                                )}`,
                                zIndex: 1,
                              }}
                            />
                            <Stack sx={{ gap: 1 }}>
                              <Stack
                                direction="row"
                                sx={{
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 1,
                                }}
                              >
                                <Chip
                                  color={
                                    statusColorMap[history.status] || "default"
                                  }
                                  label={normalizeEnumText(
                                    OrderStatus[history.status] ||
                                      history.status
                                  )}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    height: 24,
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  {formatDateTime(history.createdAt)}
                                </Typography>
                              </Stack>
                              {history.changedBy?.fullName && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: "0.8125rem" }}
                                >
                                  Oleh:{" "}
                                  <Box
                                    component="span"
                                    sx={{
                                      fontWeight: 500,
                                      color: "text.primary",
                                    }}
                                  >
                                    {history.changedBy.fullName}
                                  </Box>
                                </Typography>
                              )}
                              {history.note && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    fontStyle: "italic",
                                    bgcolor: alpha(
                                      theme.palette.secondary.main,
                                      0.04
                                    ),
                                    px: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    mt: 0.5,
                                    fontSize: "0.8125rem",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  "{history.note}"
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            )}

            {/* Total */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack sx={{ gap: 2.5 }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">
                      {formatToIdr(data.subtotal)}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Pajak
                    </Typography>
                    <Typography variant="body2">
                      {formatToIdr(data.tax)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Total
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.secondary.main,
                      }}
                    >
                      {formatToIdr(data.total)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            fontWeight: 500,
            textTransform: "none",
            borderRadius: br,
            px: 3,
          }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailDialog;
