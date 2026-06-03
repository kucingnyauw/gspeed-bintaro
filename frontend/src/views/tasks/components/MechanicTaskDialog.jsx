import { useState } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useDispatch } from "react-redux";

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

import { formatDateTime, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import {
  useMechanicTasks,
  useUnassignMechanicMutation,
} from "@views/tasks/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const EmptyTaskSvg = ({ opacity = 0.12 }) => (
  <Box
    component="svg"
    viewBox="0 0 120 120"
    sx={{
      width: 100,
      height: 100,
      opacity,
      color: "text.secondary",
    }}
  >
    <rect x="30" y="20" width="60" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
    <rect x="42" y="12" width="36" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="60" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M42 48 L52 58 L68 42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="42" y1="72" x2="78" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="42" y1="82" x2="62" y2="82" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
  </Box>
);

const OrderCard = ({ order, isUnassigning, onUnassign }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasServices = order.services?.length > 0;

  const handleUnassignConfirm = () => {
    onUnassign(order.orderId);
    setConfirmOpen(false);
  };

  const getServiceStatusColor = (taskStatus) => {
    if (taskStatus === "COMPLETED") return "success";
    if (taskStatus === "IN_PROGRESS") return "info";
    return "default";
  };

  return (
    <>
      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: "none",
          borderRadius: `${theme.shape.borderRadius}px`,
          opacity: isUnassigning ? 0.5 : 1,
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.shorter,
          }),
          pointerEvents: isUnassigning ? "none" : "auto",
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
            <Box
              onClick={() => hasServices && setExpanded(!expanded)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flex: 1,
                minWidth: 0,
                cursor: hasServices ? "pointer" : "default",
              }}
            >
              {hasServices && (
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  style={{
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    opacity: 0.5,
                  }}
                />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {order.orderNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {order.customer?.name || "—"} · {order.vehicle?.plateNumber || "—"}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flexShrink: 0 }}>
              <Chip
                label={normalizeEnumText(OrderStatus[order.status] || order.status)}
                color={statusColorMap[order.status] || "default"}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                disabled={isUnassigning}
                aria-label="Hapus Penugasan"
                sx={{
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.8),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  color: theme.palette.text.secondary,
                  transition: theme.transitions.create(
                    ["background-color", "border-color", "color"],
                    { duration: theme.transitions.duration.shorter }
                  ),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.06),
                    borderColor: alpha(theme.palette.error.main, 0.4),
                    color: theme.palette.error.main,
                  },
                }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </IconButton>
            </Stack>
          </Stack>

          {hasServices && (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 2 }} />
              <Stack sx={{ gap: 1 }}>
                {order.services.map((service) => (
                  <Stack
                    key={service.assignmentId}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      pl: 3,
                      borderLeft: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      py: 1,
                    }}
                  >
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {service.name}
                      </Typography>
                      <Chip
                        label={service.taskStatusLabel || service.taskStatus || "Pending"}
                        color={getServiceStatusColor(service.taskStatus)}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 22 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {service.startAt ? formatDateTime(service.startAt) : "Belum dimulai"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          )}
        </Box>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              Hapus Penugasan
            </Typography>
            <IconButton onClick={() => setConfirmOpen(false)} size="small" sx={{ mr: -0.5 }}>
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, pb: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
            Anda akan menghapus penugasan mekanik dari pesanan{" "}
            <strong>{order.orderNumber}</strong>.
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button color="inherit" variant="outlined" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleUnassignConfirm}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const LoadingSkeleton = () => (
  <Stack sx={{ gap: 2.5 }}>
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rounded" height={72} />
    ))}
  </Stack>
);

const MechanicTaskDialog = ({ open, mechanic, onClose }) => {
  const dispatch = useDispatch();
  const { data: tasks, isLoading } = useMechanicTasks(mechanic?.id, open);

  const unassignMutation = useUnassignMechanicMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Penugasan mekanik berhasil dihapus",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal menghapus penugasan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleUnassign = (orderId) => {
    unassignMutation.mutate(orderId);
  };

  return (
    <Dialog
      open={open}
      onClose={unassignMutation.isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Tugas {mechanic?.fullName}
          </Typography>
          <IconButton onClick={onClose} disabled={unassignMutation.isPending} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : tasks?.length > 0 ? (
          <Stack sx={{ gap: 2.5 }}>
            {tasks.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                isUnassigning={unassignMutation.isPending}
                onUnassign={handleUnassign}
              />
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 2,
            }}
          >
            <EmptyTaskSvg />
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Tidak ada tugas aktif
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Mekanik belum memiliki pesanan yang ditugaskan
            </Typography>
          </Box>
        )}
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

export default MechanicTaskDialog;