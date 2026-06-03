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

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={180} />
  </Stack>
);

const TaskDetailDialog = ({ open, orderId, onClose }) => {
  const theme = useTheme();
  const { data, isLoading } = useTasksByOrderQuery(orderId, open);
  const [expandedServices, setExpandedServices] = useState({});

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Tugas
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 } }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : data ? (
          <Stack sx={{ gap: 3 }}>
            {/* Order Header */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {data.orderNumber}
                    </Typography>
                    <Chip
                      label={normalizeEnumText(OrderStatus[data.status] || data.status)}
                      color={statusColorMap[data.status] || "default"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                  </Box>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                    {formatToIdr(data.total || 0)}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{data.customer?.name || "—"}</Typography>
                  </Stack>
                  {data.vehicle && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Kendaraan</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {data.vehicle.plateNumber} · {data.vehicle.brand} {data.vehicle.model || ""}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Dibuat</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.createdAt ? formatDateTime(data.createdAt) : "—"}
                    </Typography>
                  </Stack>
                  {data.startedAt && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Dimulai</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(data.startedAt)}</Typography>
                    </Stack>
                  )}
                  {data.completedAt && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Selesai</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(data.completedAt)}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Card>

            {/* Services */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3, pb:  4 }}>
                <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600 }}>
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
                        px: 3,
                        py: 3,
                        transition: theme.transitions.create("background-color", {
                          duration: theme.transitions.duration.shorter,
                        }),
                        "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.03) },
                      }}
                    >
                      <Stack direction="row" sx={{ gap: 2, flex: 1, alignItems: "center" }}>
                        <Avatar
                          src={service.product?.image || ""}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: `${theme.shape.borderRadius}px`,
                            bgcolor: !service.product?.image ? alpha(theme.palette.secondary.main, 0.08) : "transparent",
                            color: !service.product?.image ? theme.palette.secondary.main : "transparent",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {!service.product?.image && service.serviceName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                            {service.serviceName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.quantity} × {formatToIdr(service.unitPrice)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                        {assignments.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {assignments.length} mekanik
                          </Typography>
                        )}
                        {isExpanded ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
                      </Stack>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box sx={{ px: 3, py: 2.5, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                        {assignments.length > 0 ? (
                          <Stack sx={{ gap: 1.5 }}>
                            {assignments.map((a) => (
                              <Stack key={a.id} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                      color: theme.palette.secondary.main,
                                    }}
                                  >
                                    {a.mechanic?.fullName?.charAt(0)?.toUpperCase() || "?"}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {a.mechanic?.fullName || "—"}
                                  </Typography>
                                </Stack>
                                <Chip
                                  label={getAssignmentStatusLabel(a.status)}
                                  color={getAssignmentStatusColor(a.status)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                                />
                              </Stack>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            Belum ada mekanik ditugaskan
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}

              {(!data.services || data.services.length === 0) && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">Tidak ada layanan</Typography>
                </Box>
              )}
            </Card>
          </Stack>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} size="medium" sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog;