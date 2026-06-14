/**
 * NotificationHandler - Global notification handler supporting snackbar and dialog variants.
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
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
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
import { useDevice } from "@hooks";

const MotionAlert = motion.create(Alert);

const NotificationHandler = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isMobile } = useDevice();

  const open = useSelector(selectNotificationOpen);
  const type = useSelector(selectNotificationType) || "info";
  const title = useSelector(selectNotificationTitle);
  const message = useSelector(selectNotificationMessage);
  const variant = useSelector(selectNotificationVariant);
  const autoHide = useSelector(selectNotificationAutoHide);

  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    if (open) setLocalOpen(true);
  }, [open]);

  const handleClose = useCallback(
    (event, reason) => {
      if (reason === "clickaway") return;
      setLocalOpen(false);
      setTimeout(() => dispatch(hideNotification()), 250);
    },
    [dispatch]
  );

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
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.shape.borderRadius}px`,
              overflow: "hidden",
            },
          },
        }}
      >
        {title && (
          <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                }}
              >
                {title}
              </Typography>
              <IconButton onClick={handleClose} size="small" sx={{ mr: -0.5 }}>
                <X size={18} strokeWidth={2} />
              </IconButton>
            </Stack>
          </DialogTitle>
        )}

        <Divider />

        <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 } }}>
          <DialogContentText
            color="text.primary"
            sx={{
              lineHeight: 1.7,
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
            }}
          >
            {message}
          </DialogContentText>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
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
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                "&:hover": { color: "text.primary", bgcolor: "transparent" },
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
                borderRadius: `${theme.shape.borderRadius}px`,
                px: 2.5,
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
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
        left: { xs: 16, sm: "auto" },
        maxWidth: { xs: "calc(100% - 32px)", sm: 400 },
      }}
    >
      <MotionAlert
        severity={type}
        variant="standard"
        initial={{ opacity: 0, x: 100, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        sx={{
          minWidth: { xs: 260, sm: 360 },
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          border: "1px solid",
          borderColor: alpha(
            theme.palette[type]?.main || theme.palette.primary.main,
            0.15
          ),
          bgcolor: "background.paper",
          color: "text.primary",
          alignItems: title ? "flex-start" : "center",
          "& .MuiAlert-icon": {
            color: theme.palette[type]?.main || theme.palette.primary.main,
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
