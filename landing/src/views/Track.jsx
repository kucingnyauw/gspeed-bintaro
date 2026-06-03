import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  useTheme,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import {
  Search,
  Clock,
  CheckCircle,
  Wrench,
  User,
  MapPin,
  Receipt,
  Calendar,
  X,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { trackOrder } from "@api/orderService.js";
import boxImage from "@assets/box.png";

const statusSteps = [
  { label: "Draft", value: "DRAFT", icon: <Receipt size={18} /> },
  { label: "Antrian", value: "QUEUED", icon: <Clock size={18} /> },
  { label: "Proses", value: "IN_PROGRESS", icon: <Wrench size={18} /> },
  { label: "Selesai", value: "COMPLETED", icon: <CheckCircle size={18} /> },
  { label: "Ditutup", value: "CLOSED", icon: <Package size={18} /> },
];

const getStatusColor = (status, theme) => {
  const colors = {
    DRAFT: theme.palette.grey[500],
    QUEUED: theme.palette.info.main,
    IN_PROGRESS: theme.palette.warning.main,
    COMPLETED: theme.palette.success.main,
    CLOSED: theme.palette.primary.main,
  };
  return colors[status] || theme.palette.grey[500];
};

const getStatusLabel = (status) => {
  const labels = {
    DRAFT: "Draft",
    QUEUED: "Antrian",
    IN_PROGRESS: "Diproses",
    COMPLETED: "Selesai",
    CLOSED: "Ditutup",
  };
  return labels[status] || status;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Tracks = () => {
  const theme = useTheme();
  const [orderNumber, setOrderNumber] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const {
    data: orderData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["trackOrder", searchInput],
    queryFn: () => trackOrder(searchInput),
    enabled: !!searchInput,
    retry: false,
    select: (response) => response.data?.data || response.data,
  });

  const handleTrackOrder = () => {
    if (!orderNumber.trim()) return;
    setSearchInput(orderNumber.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleTrackOrder();
    }
  };

  useEffect(() => {
    if (isError && searchInput) {
      setErrorDialogOpen(true);
    }
  }, [isError, searchInput]);

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
  };

  const getActiveStep = (status) => {
    const stepIndex = statusSteps.findIndex((step) => step.value === status);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "Gagal melacak pesanan. Periksa nomor order Anda.";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(4),
      }}
    >
      {/* Tracking Header */}
      <Box
        sx={{
          border: `2px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1.2fr 0.8fr",
          },
          minHeight: { xs: "auto", sm: 400, md: 480 },
          overflow: "hidden",
          position: "relative",
          boxShadow: theme.shadows[4],
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: theme.palette.primary.main,
            zIndex: 1,
          },
        }}
      >
        {/* Left: Search Form */}
        <Box
          sx={{
            p: { xs: theme.spacing(3), sm: theme.spacing(5), md: theme.spacing(6) },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: theme.spacing(3),
          }}
        >
          <Box>
            <Chip
              label="Lacak Pesanan"
              size="small"
              sx={{
                mb: theme.spacing(1),
                bgcolor: theme.palette.primary.light,
                color: theme.palette.text.primary,
                fontWeight: theme.typography.fontWeightBold,
                borderRadius: theme.shape.borderRadius,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: theme.typography.fontWeightBold,
                fontSize: { xs: theme.typography.h4.fontSize, sm: theme.typography.h3.fontSize },
                color: theme.palette.text.primary,
                mb: theme.spacing(1),
              }}
            >
              Lacak Status Servis
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Masukkan nomor order untuk melihat status servis Vespa Anda secara real-time
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 450, width: "100%" }}>
            <TextField
              fullWidth
              placeholder="Masukkan nomor pesanan"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              variant="outlined"
              size="medium"
              error={isError}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleTrackOrder}
                        disabled={isLoading || !orderNumber.trim()}
                        sx={{
                          borderRadius: theme.shape.borderRadius,
                          px: theme.spacing(2),
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Lacak"
                        )}
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: theme.spacing(1), alignItems: "center" }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: theme.palette.success.main,
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.4 },
                  "100%": { opacity: 1 },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Status real-time • Update otomatis
            </Typography>
          </Box>
        </Box>

        {/* Right: Illustration with Box Image */}
        <Box
          sx={{
            position: "relative",
            bgcolor: theme.palette.grey[100],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: 250, sm: 350, md: "auto" },
            clipPath: {
              xs: "none",
              md: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: theme.spacing(2),
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              component="img"
              src={boxImage}
              alt="Tracking Box"
              sx={{
                width: { xs: 180, sm: 220, md: 260 },
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0px 8px 24px rgba(0,0,0,0.12))",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              G-Speed Tracking
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Dialog */}
      <Dialog
        open={errorDialogOpen}
        onClose={handleCloseErrorDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: theme.shape.borderRadius,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: theme.typography.fontWeightBold,
          }}
        >
          Gagal Melacak Pesanan
          <IconButton
            onClick={handleCloseErrorDialog}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.8 }}>
            {errorMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: theme.spacing(2), gap: theme.spacing(1) }}>
          <Button
            onClick={handleCloseErrorDialog}
            variant="outlined"
            sx={{ borderRadius: theme.shape.borderRadius }}
          >
            Tutup
          </Button>
          <Button
            onClick={() => {
              handleCloseErrorDialog();
              setTimeout(() => {
                const input = document.querySelector('input[type="text"]');
                if (input) input.focus();
              }, 100);
            }}
            variant="contained"
            color="primary"
            sx={{ borderRadius: theme.shape.borderRadius }}
          >
            Coba Lagi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading State */}
      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Order Details */}
      <AnimatePresence>
        {orderData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(3),
              }}
            >
              {/* Order Summary Card */}
              <Box
                sx={{
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  p: { xs: theme.spacing(3), sm: theme.spacing(4) },
                  boxShadow: theme.shadows[3],
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 4,
                    height: "100%",
                    bgcolor: getStatusColor(orderData.currentStatus, theme),
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: theme.spacing(2),
                    mb: theme.spacing(3),
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      Nomor Order
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: theme.typography.fontWeightBold }}
                    >
                      {orderData.orderNumber}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(orderData.currentStatus)}
                    sx={{
                      bgcolor: getStatusColor(orderData.currentStatus, theme),
                      color: theme.palette.primary.contrastText,
                      fontWeight: theme.typography.fontWeightBold,
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                </Box>

                <Stepper
                  activeStep={getActiveStep(orderData.currentStatus)}
                  alternativeLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: theme.typography.caption.fontSize,
                      mt: theme.spacing(1),
                    },
                    "& .MuiStepIcon-root.Mui-active": {
                      color: getStatusColor(orderData.currentStatus, theme),
                    },
                    "& .MuiStepIcon-root.Mui-completed": {
                      color: getStatusColor(orderData.currentStatus, theme),
                    },
                  }}
                >
                  {statusSteps.map((step) => (
                    <Step key={step.value}>
                      <StepLabel>{step.label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Timeline */}
              <Box
                sx={{
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  p: { xs: theme.spacing(3), sm: theme.spacing(4) },
                  boxShadow: theme.shadows[3],
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(1.5),
                    mb: theme.spacing(3),
                    pb: theme.spacing(2),
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}
                >
                  <Clock size={20} color={theme.palette.primary.main} />
                  <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                    Timeline Pesanan
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {orderData.timeline?.map((event, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        gap: theme.spacing(2),
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor:
                              index === orderData.timeline.length - 1
                                ? theme.palette.primary.main
                                : theme.palette.grey[300],
                            border: `3px solid ${
                              index === orderData.timeline.length - 1
                                ? theme.palette.primary.light
                                : theme.palette.background.paper
                            }`,
                            zIndex: 1,
                            boxShadow:
                              index === orderData.timeline.length - 1
                                ? `0 0 0 4px ${theme.palette.primary.light}40`
                                : "none",
                          }}
                        />
                        {index < orderData.timeline.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              flex: 1,
                              bgcolor: theme.palette.divider,
                              minHeight: 40,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ pb: theme.spacing(3), flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: theme.typography.fontWeightBold }}
                        >
                          {getStatusLabel(event.status)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {event.note}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary, display: "block", mt: theme.spacing(0.5) }}
                        >
                          {formatDate(event.changedAt)} • Oleh {event.changedBy}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Customer & Vehicle Info */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: theme.spacing(3),
                }}
              >
                {/* Customer Info */}
                <Box
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[3],
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: theme.spacing(1.5),
                      px: theme.spacing(3),
                      py: theme.spacing(2),
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    <User size={20} color={theme.palette.info.main} />
                    <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                      Data Pelanggan
                    </Typography>
                  </Box>
                  <Box sx={{ p: theme.spacing(3) }}>
                    <Stack spacing={theme.spacing(2)}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Nama
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                          {orderData.customer?.name}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Telepon
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                          {orderData.customer?.phone}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Box>

                {/* Vehicle Info */}
                <Box
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[3],
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: theme.spacing(1.5),
                      px: theme.spacing(3),
                      py: theme.spacing(2),
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    <MapPin size={20} color={theme.palette.warning.main} />
                    <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                      Data Kendaraan
                    </Typography>
                  </Box>
                  <Box sx={{ p: theme.spacing(3) }}>
                    <Stack spacing={theme.spacing(2)}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Brand & Model
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                          {orderData.vehicle?.brand} {orderData.vehicle?.model}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Plat Nomor
                        </Typography>
                        <Chip
                          label={orderData.vehicle?.plateNumber}
                          size="small"
                          sx={{
                            fontWeight: theme.typography.fontWeightBold,
                            bgcolor: theme.palette.warning.light,
                            borderRadius: theme.shape.borderRadius,
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Box>
                </Box>
              </Box>

              {/* Items Table */}
              <Box
                sx={{
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  overflow: "hidden",
                  boxShadow: theme.shadows[3],
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(1.5),
                    px: theme.spacing(3),
                    py: theme.spacing(2),
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}
                >
                  <Package size={20} color={theme.palette.primary.main} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                      Item Pesanan
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {orderData.items?.length || 0} item
                    </Typography>
                  </Box>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: theme.typography.fontWeightBold }}>Produk</TableCell>
                        <TableCell sx={{ fontWeight: theme.typography.fontWeightBold }}>Tipe</TableCell>
                        <TableCell align="center" sx={{ fontWeight: theme.typography.fontWeightBold }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: theme.typography.fontWeightBold }}>Harga</TableCell>
                        <TableCell align="right" sx={{ fontWeight: theme.typography.fontWeightBold }}>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderData.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                              {item.productName}
                            </Typography>
                            {item.assignments?.length > 0 && (
                              <Box sx={{ mt: theme.spacing(1) }}>
                                {item.assignments.map((assignment) => (
                                  <Box
                                    key={assignment.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: theme.spacing(1),
                                      mt: theme.spacing(0.5),
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        fontSize: theme.typography.caption.fontSize,
                                        bgcolor: theme.palette.primary.light,
                                      }}
                                    >
                                      {assignment.mechanic?.fullName?.charAt(0)}
                                    </Avatar>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                      {assignment.mechanic?.fullName}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.product?.type === "SERVICE" ? "Service" : "Sparepart"}
                              size="small"
                              sx={{
                                fontSize: theme.typography.caption.fontSize,
                                bgcolor:
                                  item.product?.type === "SERVICE"
                                    ? theme.palette.info.light
                                    : theme.palette.warning.light,
                                borderRadius: theme.shape.borderRadius,
                                fontWeight: theme.typography.fontWeightBold,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: theme.typography.fontWeightBold, color: theme.palette.primary.main }}>
                              {formatCurrency(item.subtotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Payment & Cashier Info */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: theme.spacing(3),
                }}
              >
                {/* Payment Info */}
                <Box
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[3],
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: theme.spacing(1.5),
                      px: theme.spacing(3),
                      py: theme.spacing(2),
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Receipt size={20} color={theme.palette.success.main} />
                    <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                      Pembayaran
                    </Typography>
                  </Box>
                  <Box sx={{ p: theme.spacing(3) }}>
                    <Stack spacing={theme.spacing(2)}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Metode
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                          {orderData.payment?.method}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Status
                        </Typography>
                        <Chip
                          label={orderData.payment?.status === "PAID" ? "Lunas" : "Pending"}
                          size="small"
                          color={orderData.payment?.status === "PAID" ? "success" : "warning"}
                          sx={{ borderRadius: theme.shape.borderRadius }}
                        />
                      </Stack>
                      <Divider />
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Total Bayar
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: theme.typography.fontWeightBold,
                            color: theme.palette.primary.main,
                          }}
                        >
                          {formatCurrency(orderData.payment?.amountPaid || orderData.total)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Box>

                {/* Cashier Info */}
                <Box
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: theme.shadows[3],
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: theme.spacing(1.5),
                      px: theme.spacing(3),
                      py: theme.spacing(2),
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }}
                  >
                    <User size={20} color={theme.palette.secondary.main} />
                    <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                      Kasir
                    </Typography>
                  </Box>
                  <Box sx={{ p: theme.spacing(3) }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: theme.palette.primary.main,
                          fontSize: theme.typography.h5.fontSize,
                          fontWeight: theme.typography.fontWeightBold,
                        }}
                      >
                        {orderData.cashier?.fullName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                          {orderData.cashier?.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Kasir
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Date Info */}
              <Box
                sx={{
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: theme.shadows[3],
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(1.5),
                    px: theme.spacing(3),
                    py: theme.spacing(2),
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}
                >
                  <Calendar size={20} />
                  <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                    Informasi Waktu
                  </Typography>
                </Box>
                <Box sx={{ p: theme.spacing(3) }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: theme.spacing(3),
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: theme.spacing(0.5) }}>
                        Tanggal Dibuat
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                        {formatDate(orderData.createdAt)}
                      </Typography>
                    </Box>
                    {orderData.completedAt && (
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: theme.spacing(0.5) }}>
                          Tanggal Selesai
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                          {formatDate(orderData.completedAt)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Tracks;