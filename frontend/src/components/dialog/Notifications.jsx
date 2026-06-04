/**
 * NotificationHandler - Global notification handler supporting snackbar and dialog variants.
 *
 * @component
 * @returns {JSX.Element|null} Rendered notification or null
 */
import { useCallback, useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  Snackbar,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Stack,
  useTheme,
  Typography,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";

import { hideNotification } from "@store/notifications/notificationsSlice.js";
import {
  selectNotificationOpen,
  selectNotificationMessage,
  selectNotificationType,
  selectNotificationTitle,
  selectNotificationVariant,
  selectNotificationAutoHide,
} from "@store/notifications/notificationsSelector.js";

/**
 * MotionAlert - Alert component dengan animasi Framer Motion.
 * Menggunakan spring animation untuk transisi masuk/keluar.
 *
 * @type {React.ComponentType}
 */
const MotionAlert = motion.create(Alert);

/**
 * NotificationHandler - Komponen global untuk menampilkan notifikasi.
 *
 * Mendukung dua variant:
 * - `snackbar`: Notifikasi popup di bottom-right dengan animasi spring
 * - `dialog`: Modal dialog untuk pesan penting yang memerlukan perhatian
 *
 * Fitur:
 * - Animasi masuk/keluar dengan Framer Motion (snackbar)
 * - Auto-hide dengan durasi yang dapat dikonfigurasi
 * - Tombol "Segarkan" pada dialog untuk reload halaman
 * - Tampilan responsif untuk mobile dan desktop
 * - Warna dinamis berdasarkan tipe notifikasi (success/error/warning/info)
 *
 * @component
 * @returns {JSX.Element|null} Komponen notifikasi atau null jika tidak ada
 */
const NotificationHandler = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  /** @type {boolean} Status notifikasi dari Redux store */
  const open = useSelector(selectNotificationOpen);

  /** @type {string} Tipe notifikasi (success/error/warning/info) */
  const type = useSelector(selectNotificationType) || "info";

  /** @type {string} Judul notifikasi */
  const title = useSelector(selectNotificationTitle);

  /** @type {string} Pesan notifikasi */
  const message = useSelector(selectNotificationMessage);

  /** @type {string} Variant notifikasi (snackbar/dialog) */
  const variant = useSelector(selectNotificationVariant);

  /** @type {number} Durasi auto-hide dalam milidetik */
  const autoHide = useSelector(selectNotificationAutoHide);

  /**
   * State lokal untuk mengontrol animasi keluar.
   * Dipisahkan dari Redux state agar animasi bisa selesai sebelum unmount.
   * @type {[boolean, Function]}
   */
  const [localOpen, setLocalOpen] = useState(false);

  /**
   * Effect: Sinkronisasi Redux open state ke local state.
   * Memastikan animasi masuk terpicu saat notifikasi muncul.
   */
  useEffect(() => {
    if (open) {
      setLocalOpen(true);
    }
  }, [open]);

  /**
   * Handler untuk menutup notifikasi.
   * Menjalankan animasi keluar terlebih dahulu, lalu dispatch hideNotification.
   *
   * @param {Object} event - Event yang memicu penutupan
   * @param {string} reason - Alasan penutupan ("clickaway" untuk mencegah tutup saat klik luar)
   */
  const handleClose = useCallback(
    (event, reason) => {
      if (reason === "clickaway") return;
      setLocalOpen(false);
      setTimeout(() => dispatch(hideNotification()), 250);
    },
    [dispatch]
  );

  /**
   * Handler untuk tombol "Segarkan" pada dialog.
   * Menutup notifikasi lalu reload halaman.
   */
  const handleRefresh = () => {
    setLocalOpen(false);
    setTimeout(() => {
      dispatch(hideNotification());
      window.location.reload();
    }, 250);
  };

  if (!open && !localOpen) return null;

  if (variant === "dialog") {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        {title && (
          <DialogTitle sx={{ pb: 1.5 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{ mr: -0.5 }}
              >
                <X size={18} strokeWidth={2} />
              </IconButton>
            </Stack>
          </DialogTitle>
        )}

        <Divider />

        <DialogContent sx={{ py: 3 }}>
          <DialogContentText color="text.primary" sx={{ lineHeight: 1.7 }}>
            {message}
          </DialogContentText>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Stack
            direction="row"
            sx={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              color="inherit"
              onClick={handleRefresh}
              sx={{
                fontWeight: 500,
                textTransform: "none",
                color: "text.secondary",
                "&:hover": {
                  color: "text.primary",
                  bgcolor: "transparent",
                },
              }}
            >
              Segarkan
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleClose}
              color={type === "error" ? "error" : "primary"}
              sx={{
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Tutup
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Snackbar
      open={localOpen}
      autoHideDuration={autoHide}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      TransitionComponent={undefined}
      transitionDuration={0}
      sx={{
        right: { xs: 16, sm: 24 },
        bottom: { xs: 16, sm: 24 },
      }}
    >
      <MotionAlert
        severity={type}
        variant="standard"
        initial={{ opacity: 0, x: 100, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.96 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        sx={{
          minWidth: { xs: 280, sm: 360 },
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          border: "1px solid",
          borderColor: alpha(theme.palette[type].main, 0.15),
          bgcolor: theme.palette.background.paper,
          color: "text.primary",
          alignItems: title ? "flex-start" : "center",
          "& .MuiAlert-icon": {
            color: theme.palette[type].main,
            opacity: 0.9,
            alignItems: title ? "flex-start" : "center",
            pt: title ? 0.25 : 0,
          },
          "& .MuiAlert-message": {
            flex: 1,
            fontWeight: 400,
            fontSize: "0.875rem",
          },
        }}
      >
        {title && (
          <AlertTitle sx={{ mb: 0.5, fontWeight: 600, fontSize: "0.875rem" }}>
            {title}
          </AlertTitle>
        )}
        {message}
      </MotionAlert>
    </Snackbar>
  );
};

export default NotificationHandler;