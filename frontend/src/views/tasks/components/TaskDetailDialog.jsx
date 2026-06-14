/**
 * TaskDetailDialog - Dialog untuk menampilkan detail tugas per order.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {string} props.orderId - ID order
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
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

import { formatToIdr, formatDateTime, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { useTasksByOrderQuery } from "@views/tasks/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={120} sx={{ minHeight: 100 }} />
    <Skeleton variant="rounded" height={200} sx={{ minHeight: 180 }} />
  </Stack>
);

const TaskDetailDialog = ({ open, orderId, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data, isLoading } = useTasksByOrderQuery(orderId, open);
  const [expandedServices, setExpandedServices] = useState({});
  const br = `${theme.shape.borderRadius}px`;

  const toggleService = (orderItemId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [orderItemId]: !prev[orderItemId],
    }));
  };

  const getAssignmentStatusColor = (status) => {
    if (status === "COMPLETED") return "success";
    if (status === "IN_PROGRESS") return "info";
    return "warning";
  };

  const getAssignmentStatusLabel = (status) => {
    if (status === "COMPLETED") return "Selesai";
    if (status === "IN_PROGRESS") return "Dikerjakan";
    return "Menunggu";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
            Detail Tugas
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
        ) : data ? (
          <Stack sx={{ gap: 4 }}>
            {/* Order Header */}
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
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: { xs: "0.9375rem", sm: "1rem" },
                      }}
                    >
                      {data.orderNumber}
                    </Typography>
                    <Chip
                      label={normalizeEnumText(
                        OrderStatus[data.status] || data.status
                      )}
                      color={statusColorMap[data.status] || "default"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.secondary.main,
                      fontSize: { xs: "1.125rem", sm: "1.25rem" },
                    }}
                  >
                    {formatToIdr(data.total || 0)}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack sx={{ gap: 2.5 }}>
                  {[
                    {
                      label: "Pelanggan",
                      value: data.customer?.name || "—",
                      bold: true,
                    },
                    ...(data.vehicle
                      ? [
                          {
                            label: "Kendaraan",
                            value: `${data.vehicle.plateNumber} · ${
                              data.vehicle.brand
                            } ${data.vehicle.model || ""}`,
                          },
                        ]
                      : []),
                    {
                      label: "Dibuat",
                      value: data.createdAt
                        ? formatDateTime(data.createdAt)
                        : "—",
                    },
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
                        sx={{
                          fontWeight: item.bold ? 500 : 400,
                          maxWidth: "65%",
                          textAlign: "right",
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Services */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  }}
                >
                  Layanan ({data.services?.length || 0})
                </Typography>
              </Box>

              {data.services?.map((service, index) => {
                const isExpanded = expandedServices[service.orderItemId];
                const assignments = service.assignments || [];

                return (
                  <Box key={service.orderItemId}>
                    {index > 0 && <Divider />}
                    <Box
                      onClick={() => toggleService(service.orderItemId)}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        px: { xs: 2.5, sm: 3 },
                        py: 3,
                        transition: theme.transitions.create(
                          "background-color",
                          { duration: theme.transitions.duration.shorter }
                        ),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.secondary.main, 0.03),
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          gap: 2,
                          flex: 1,
                          alignItems: "center",
                          minWidth: 0,
                        }}
                      >
                        <Avatar
                          src={service.product?.image || ""}
                          variant="rounded"
                          sx={{
                            width: { xs: 36, sm: 40 },
                            height: { xs: 36, sm: 40 },
                            borderRadius: br,
                            flexShrink: 0,
                            bgcolor: !service.product?.image
                              ? alpha(theme.palette.secondary.main, 0.08)
                              : "transparent",
                            color: !service.product?.image
                              ? theme.palette.secondary.main
                              : "transparent",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {!service.product?.image &&
                            service.serviceName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 0.5 }}
                            noWrap
                          >
                            {service.serviceName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.quantity} ×{" "}
                            {formatToIdr(service.unitPrice)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{
                          alignItems: "center",
                          gap: 1.5,
                          flexShrink: 0,
                          ml: 2,
                        }}
                      >
                        {assignments.length > 0 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                          >
                            {assignments.length} mekanik
                          </Typography>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={16} strokeWidth={1.5} />
                        ) : (
                          <ChevronDown size={16} strokeWidth={1.5} />
                        )}
                      </Stack>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box
                        sx={{
                          px: { xs: 2.5, sm: 3 },
                          py: 3,
                          bgcolor: alpha(theme.palette.secondary.main, 0.02),
                        }}
                      >
                        {assignments.length > 0 ? (
                          <Stack sx={{ gap: 2 }}>
                            {assignments.map((a) => (
                              <Stack
                                key={a.id}
                                direction="row"
                                sx={{
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Stack
                                  direction="row"
                                  sx={{ alignItems: "center", gap: 1.5 }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      bgcolor: alpha(
                                        theme.palette.secondary.main,
                                        0.1
                                      ),
                                      color: theme.palette.secondary.main,
                                    }}
                                  >
                                    {a.mechanic?.fullName
                                      ?.charAt(0)
                                      ?.toUpperCase() || "?"}
                                  </Avatar>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {a.mechanic?.fullName || "—"}
                                  </Typography>
                                </Stack>
                                <Chip
                                  label={getAssignmentStatusLabel(a.status)}
                                  color={getAssignmentStatusColor(a.status)}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: "0.75rem",
                                    height: 24,
                                  }}
                                />
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.disabled"
                            sx={{ fontStyle: "italic" }}
                          >
                            Belum ada mekanik ditugaskan
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}

              {(!data.services || data.services.length === 0) && (
                <Box sx={{ p: { xs: 2.5, sm: 3 }, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tidak ada layanan
                  </Typography>
                </Box>
              )}
            </Card>
          </Stack>
        ) : null}
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

export default TaskDetailDialog;
