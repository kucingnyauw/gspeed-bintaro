/**
 * VehicleDetailDialog - Dialog detail untuk menampilkan informasi lengkap kendaraan.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} [props.vehicleId] - ID Kendaraan
 * @param {Object} [props.customer] - Data customer dengan kendaraan
 * @param {Object[]} [props.customer.vehicles] - Array kendaraan
 * @param {string} [props.customer.name] - Nama customer
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @returns {JSX.Element} Dialog detail kendaraan
 */
import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime } from "@shared/utils";
import { useVehicleDetailQuery } from "@views/vehicles/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={120} sx={{ minHeight: 100 }} />
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
  </Stack>
);

const VehicleDetailDialog = ({ open, vehicleId, customer, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const vehicles = customer?.vehicles || [];
  const [selectedId, setSelectedId] = useState(
    vehicleId || vehicles[0]?.id || ""
  );
  const [ordersExpanded, setOrdersExpanded] = useState(false);
  const br = `${theme.shape.borderRadius}px`;

  const { data: vehicle, isLoading } = useVehicleDetailQuery(
    selectedId,
    open && !!selectedId
  );

  useEffect(() => {
    if (open) {
      if (vehicleId) setSelectedId(vehicleId);
      else if (vehicles.length > 0) setSelectedId(vehicles[0].id);
    }
  }, [open, vehicleId]);

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
            Detail Kendaraan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        {/* Pilihan Kendaraan (jika lebih dari 1) */}
        {vehicles.length > 1 && (
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Pilih Kendaraan</InputLabel>
            <Select
              value={selectedId}
              label="Pilih Kendaraan"
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {v.plateNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {v.brand} {v.model}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {isLoading ? (
          <DetailSkeleton />
        ) : vehicle ? (
          <Stack sx={{ gap: 4 }}>
            {/* Informasi Kendaraan */}
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
                  Informasi Kendaraan
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  {[
                    {
                      label: "Plat Nomor",
                      value: vehicle.plateNumber,
                      bold: true,
                    },
                    { label: "Merek", value: vehicle.brand || "—" },
                    { label: "Model", value: vehicle.model || "—" },
                    {
                      label: "Tanggal Terdaftar",
                      value: formatDateTime(vehicle.createdAt),
                    },
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
              </Box>
            </Card>

            {/* Pemilik */}
            {vehicle.customer && (
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
                    Pemilik
                  </Typography>
                  <Stack sx={{ gap: 2.5 }}>
                    {[
                      {
                        label: "Nama",
                        value: vehicle.customer.name,
                        bold: true,
                      },
                      {
                        label: "Telepon",
                        value: vehicle.customer.phone || "—",
                      },
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
                </Box>
              </Card>
            )}

            {/* Riwayat Order */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
                overflow: "hidden",
              }}
            >
              <Box
                onClick={() => setOrdersExpanded(!ordersExpanded)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: { xs: 2.5, sm: 3 },
                  py: 2.5,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: theme.transitions.create("background-color", {
                    duration: theme.transitions.duration.shorter,
                  }),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  },
                }}
              >
                <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    Riwayat Order
                  </Typography>
                  <Chip
                    label={vehicle.orders?.length || 0}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500, fontSize: "0.6875rem", height: 22 }}
                  />
                </Stack>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  style={{
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: ordersExpanded
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    opacity: 0.5,
                  }}
                />
              </Box>

              <Collapse in={ordersExpanded} timeout="auto" unmountOnExit>
                <Divider />
                <Box sx={{ p: { xs: 2.5, sm: 3 }, pt: 2 }}>
                  {vehicle.orders?.length > 0 ? (
                    <Stack>
                      {vehicle.orders.map((order, index) => (
                        <Box key={order.id}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {order.orderNumber}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDateTime(order.createdAt)}
                            </Typography>
                          </Stack>
                          {index < vehicle.orders.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 5,
                        gap: 1.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        Belum ada riwayat order
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Kendaraan ini belum memiliki pesanan
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Card>
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: { xs: 6, sm: 8 },
              gap: 2,
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              Data tidak ditemukan
            </Typography>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
            >
              Kendaraan mungkin telah dihapus atau ID tidak valid
            </Typography>
          </Box>
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

export default VehicleDetailDialog;
