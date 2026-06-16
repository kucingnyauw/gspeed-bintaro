import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Controller } from "react-hook-form";
import { Banknote, Clock, Download, QrCode, X } from "lucide-react";
import LottieModule from "lottie-react";

import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PaymentMethod } from "@shared/constant";
import { formatToIdr, downloadFromUrl } from "@shared/utils";
import { useCreatePaymentMutation, usePaymentForm } from "@views/orders/hooks";
import { useSocket } from "@/hooks/useSocket.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import { useDevice } from "@hooks";
import successAnimation from "@assets/lottie/success.json";
import errorAnimation from "@assets/lottie/error.json";

const Lottie = LottieModule.default || LottieModule;

const MethodCard = ({
  selected,
  method,
  icon: Icon,
  title,
  subtitle,
  onClick,
}) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const isSelected = selected === method;

  return (
    <Card
      onClick={() => onClick(method)}
      sx={{
        cursor: "pointer",
        border: `1px solid ${
          isSelected
            ? theme.palette.secondary.main
            : alpha(theme.palette.divider, 0.6)
        }`,
        borderRadius: `${theme.shape.borderRadius}px`,
        bgcolor: isSelected
          ? alpha(theme.palette.secondary.main, 0.06)
          : "transparent",
        boxShadow: "none",
        transition: theme.transitions.create(
          ["border-color", "background-color"],
          { duration: theme.transitions.duration.shorter }
        ),
        "&:hover": {
          borderColor: isSelected
            ? theme.palette.secondary.main
            : alpha(theme.palette.secondary.main, 0.4),
          bgcolor: isSelected
            ? alpha(theme.palette.secondary.main, 0.08)
            : alpha(theme.palette.secondary.main, 0.03),
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          py: { xs: 2, sm: 2.5 },
          px: 1,
          gap: { xs: 0.75, sm: 1 },
        }}
      >
        <Box
          sx={{
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            borderRadius: `${theme.shape.borderRadius}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isSelected
              ? alpha(theme.palette.secondary.main, 0.12)
              : alpha(theme.palette.secondary.main, 0.05),
            color: isSelected
              ? theme.palette.secondary.main
              : theme.palette.text.secondary,
            transition: theme.transitions.create(["background-color", "color"]),
          }}
        >
          <Icon size={isMobile ? 20 : 22} strokeWidth={1.5} />
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.625rem", sm: "0.75rem" } }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

const useCountdown = (expiryTimeFormatted) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryTimeFormatted) return;

    const parseExpiry = (formatted) => {
      const parts = formatted.split(", ");
      if (parts.length !== 2) return null;
      const dateParts = parts[0].split("/");
      const timeParts = parts[1].split(" ")[0].split(".");
      if (dateParts.length !== 3 || timeParts.length !== 3) return null;
      return new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1]),
        parseInt(timeParts[2])
      );
    };

    const expiryDate = parseExpiry(expiryTimeFormatted);
    if (!expiryDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = expiryDate - now;
      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds });
      setIsExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiryTimeFormatted]);

  return { timeLeft, isExpired };
};

const OrderPaymentDialog = ({ data, onClose, open }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isMobile } = useDevice();
  const [step, setStep] = useState("payment");
  const [qrisData, setQrisData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const br = `${theme.shape.borderRadius}px`;

  const { timeLeft, isExpired } = useCountdown(qrisData?.expiryTimeFormatted);

  const createPayment = useCreatePaymentMutation({
    onFailed: (error) => {
      setIsProcessing(false);
      dispatch(
        showNotification({
          message: error.message || "Gagal memproses pembayaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });
  const socketRef = useSocket();

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = usePaymentForm();

  const isSubmitting = createPayment.isPending || isProcessing;
  const selectedMethod = watch("method");
  const amountPaidValue = watch("amountPaid");
  const changeAmount = amountPaidValue - (data?.total || 0);

  useEffect(() => {
    if (open) {
      setStep("payment");
      setQrisData(null);
      setPaymentSuccess(false);
      setPaymentFailed(false);
      setIsProcessing(false);
      setValue("method", "QRIS");
      setValue("amountPaid", 0);
    }
  }, [open, setValue]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !data?.id || step !== "qris") return;
    const handler = (payload) => {
      if (payload.orderId === data.id) {
        if (payload.status === "PAID") {
          setPaymentSuccess(true);
          dispatch(
            showNotification({
              message: `Pembayaran #${data.orderNumber} berhasil!`,
              type: "success",
              title: "Lunas",
              variant: "snackbar",
              autoHide: 5000,
            })
          );
        } else if (payload.status === "FAILED") {
          setPaymentFailed(true);
        }
      }
    };
    socket.on("payment:status", handler);
    return () => {
      socket.off("payment:status", handler);
    };
  }, [socketRef, data?.id, step, data?.orderNumber, dispatch]);

  useEffect(() => {
    if (isExpired && step === "qris" && !paymentSuccess && !paymentFailed) {
      setPaymentFailed(true);
      dispatch(
        showNotification({
          message: "Waktu pembayaran telah habis.",
          type: "error",
          title: "Kadaluarsa",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    }
  }, [isExpired, step, paymentSuccess, paymentFailed, dispatch]);

  const handleMethodChange = (method) => {
    setValue("method", method);
    setValue("amountPaid", 0);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setStep("payment");
    setQrisData(null);
    setPaymentSuccess(false);
    setPaymentFailed(false);
    setIsProcessing(false);
    onClose?.();
  };

  const onSubmit = (formData) => {
    if (!data) return;
    setIsProcessing(true);
    const payload = { method: formData.method, orderId: data.id };
    if (formData.method === PaymentMethod.CASH)
      payload.amountPaid = Number(formData.amountPaid);
    createPayment.mutate(payload, {
      onSuccess: (response) => {
        setIsProcessing(false);
        if (formData.method === PaymentMethod.QRIS) {
          setQrisData(response.data || response);
          setStep("qris");
        } else {
          dispatch(
            showNotification({
              message: `Pembayaran tunai #${data.orderNumber} berhasil!`,
              type: "success",
              title: "Lunas",
              variant: "snackbar",
              autoHide: 5000,
            })
          );
          handleClose();
        }
      },
      onError: () => {
        setIsProcessing(false);
        setPaymentFailed(true);
      },
    });
  };

  const handleDownloadQr = useCallback(() => {
    if (!qrisData?.qrCodeUrl) return;
    downloadFromUrl(
      qrisData.qrCodeUrl,
      `QRIS-${data?.orderNumber || "payment"}.png`
    );
  }, [qrisData, data]);

  const formatCountdown = () => {
    if (!timeLeft) return "00:00";
    return `${String(timeLeft.minutes).padStart(2, "0")}:${String(
      timeLeft.seconds
    ).padStart(2, "0")}`;
  };

  const renderPaymentStep = () => (
    <>
      <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        <Stack sx={{ gap: 3 }}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
              borderRadius: br,
            }}
          >
            <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                Total Tagihan
              </Typography>
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.secondary.main,
                  display: "block",
                  mt: 0.5,
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                {formatToIdr(data?.total || 0)}
              </Typography>
              <Divider sx={{ my: 2.5 }} />
              <Stack sx={{ gap: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    No. Order
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {data?.orderNumber || "—"}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Pelanggan
                  </Typography>
                  <Typography variant="body2">
                    {data?.customer?.name || "—"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Card>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 2,
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
              }}
            >
              Metode Pembayaran
            </Typography>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <MethodCard
                    selected={field.value}
                    method={PaymentMethod.QRIS}
                    icon={QrCode}
                    title="QRIS"
                    subtitle="Scan kode QR"
                    onClick={handleMethodChange}
                  />
                  <MethodCard
                    selected={field.value}
                    method={PaymentMethod.CASH}
                    icon={Banknote}
                    title="Tunai"
                    subtitle="Uang tunai"
                    onClick={handleMethodChange}
                  />
                </Box>
              )}
            />
          </Box>

          {selectedMethod === PaymentMethod.CASH && (
            <Stack sx={{ gap: 2 }}>
              <Controller
                control={control}
                name="amountPaid"
                rules={{
                  required: "Jumlah dibayar wajib diisi",
                  min: { value: 1, message: "Minimal Rp 1" },
                  validate: (value) => {
                    if (!value || isNaN(value))
                      return "Masukkan angka yang valid";
                    if (Number(value) < (data?.total || 0))
                      return "Jumlah kurang dari total tagihan";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    autoFocus
                    fullWidth
                    label="Jumlah Dibayar"
                    placeholder="Rp 0"
                    error={!!errors.amountPaid}
                    helperText={errors.amountPaid?.message}
                    value={field.value ? formatToIdr(field.value) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      field.onChange(raw ? Number(raw) : "");
                    }}
                  />
                )}
              />
              {amountPaidValue > 0 && (
                <Card
                  sx={{
                    border: `1px solid ${
                      changeAmount >= 0
                        ? alpha(theme.palette.success.main, 0.3)
                        : alpha(theme.palette.error.main, 0.3)
                    }`,
                    bgcolor:
                      changeAmount >= 0
                        ? alpha(theme.palette.success.main, 0.04)
                        : alpha(theme.palette.error.main, 0.04),
                    boxShadow: "none",
                    borderRadius: br,
                  }}
                >
                  <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Kembalian
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            changeAmount >= 0 ? "success.main" : "error.main",
                        }}
                      >
                        {formatToIdr(changeAmount)}
                      </Typography>
                    </Stack>
                  </Box>
                </Card>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          justifyContent: "space-between",
        }}
      >
        <Button
          color="inherit"
          variant="outlined"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            fontWeight: 500,
            textTransform: "none",
            borderRadius: br,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{
            fontWeight: 600,
            textTransform: "none",
            borderRadius: br,
            px: 2.5,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            boxShadow: "none",
          }}
        >
          {isSubmitting ? "Memproses..." : "Bayar"}
        </Button>
      </DialogActions>
    </>
  );

  const renderQrisStep = () => (
    <>
      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        <Stack sx={{ alignItems: "center", gap: { xs: 3, sm: 4 } }}>
          {paymentSuccess ? (
            <>
              <Box
                sx={{
                  width: { xs: 120, sm: 140 },
                  height: { xs: 120, sm: 140 },
                }}
              >
                <Lottie
                  animationData={successAnimation}
                  loop={false}
                  autoplay
                />
              </Box>
              <Stack sx={{ alignItems: "center", gap: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                  }}
                >
                  Pembayaran Berhasil
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Pembayaran untuk pesanan ini telah diterima
                </Typography>
              </Stack>
            </>
          ) : paymentFailed ? (
            <>
              <Box
                sx={{
                  width: { xs: 120, sm: 140 },
                  height: { xs: 120, sm: 140 },
                }}
              >
                <Lottie animationData={errorAnimation} loop={false} autoplay />
              </Box>
              <Stack sx={{ alignItems: "center", gap: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "error.main",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                  }}
                >
                  Pembayaran Gagal
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Silakan coba lagi atau gunakan metode lain
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Stack sx={{ alignItems: "center", gap: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                  }}
                >
                  Scan QR Code
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Gunakan aplikasi pembayaran yang mendukung QRIS
                </Typography>
              </Stack>

              {isExpired ? (
                <Stack sx={{ alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "error.main",
                      fontSize: { xs: "1rem", sm: "1.125rem" },
                    }}
                  >
                    Waktu Habis
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Batas waktu pembayaran telah berakhir
                  </Typography>
                </Stack>
              ) : (
                <>
                  {qrisData?.qrCodeUrl ? (
                    <Box
                      component="img"
                      src={qrisData.qrCodeUrl}
                      alt="QR Code"
                      sx={{
                        width: "100%",
                        maxWidth: { xs: 220, sm: 260 },
                        aspectRatio: "1/1",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: br,
                        p: 2,
                      }}
                    />
                  ) : (
                    <Typography color="error" variant="body2">
                      Gagal memuat QR code
                    </Typography>
                  )}

                  <Stack sx={{ alignItems: "center", gap: 0.5 }}>
                    <Stack
                      direction="row"
                      sx={{ alignItems: "center", gap: 1 }}
                    >
                      <Clock size={16} strokeWidth={1.5} />
                      <Typography
                        variant="h5"
                        component="span"
                        sx={{
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color:
                            timeLeft?.minutes < 1
                              ? "error.main"
                              : "text.primary",
                          fontSize: { xs: "1.25rem", sm: "1.5rem" },
                        }}
                      >
                        {formatCountdown()}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Berlaku hingga {qrisData?.expiryTimeFormatted || ""}
                    </Typography>
                  </Stack>

                  <Chip
                    label={`Total: ${formatToIdr(
                      qrisData?.amount || data?.total || 0
                    )}`}
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </>
              )}
            </>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          justifyContent: "space-between",
        }}
      >
        {!paymentSuccess &&
          !paymentFailed &&
          !isExpired &&
          qrisData?.qrCodeUrl && (
            <Button
              color="inherit"
              variant="outlined"
              onClick={handleDownloadQr}
              startIcon={<Download size={14} strokeWidth={1.5} />}
              sx={{
                fontWeight: 500,
                textTransform: "none",
                borderRadius: br,
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
              }}
            >
              Download QR
            </Button>
          )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            fontWeight: 600,
            textTransform: "none",
            borderRadius: br,
            px: 2.5,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            boxShadow: "none",
          }}
        >
          {paymentSuccess ? "Selesai" : "Kembali"}
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}
          >
            {step === "qris" ? "Pembayaran QRIS" : "Pembayaran"}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={isSubmitting}
            size="small"
            sx={{ mr: -0.5 }}
          >
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      {step === "qris" ? renderQrisStep() : renderPaymentStep()}
    </Dialog>
  );
};

export default OrderPaymentDialog;
