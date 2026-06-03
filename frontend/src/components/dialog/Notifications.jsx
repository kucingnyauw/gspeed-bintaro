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

const MotionAlert = motion.create(Alert);

const NotificationHandler = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const open = useSelector(selectNotificationOpen);
  const type = useSelector(selectNotificationType) || "info";
  const title = useSelector(selectNotificationTitle);
  const message = useSelector(selectNotificationMessage);
  const variant = useSelector(selectNotificationVariant);
  const autoHide = useSelector(selectNotificationAutoHide);

  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalOpen(true);
    }
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
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        {title && (
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1.5,
            }}
          >
            {title}
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: "text.secondary",
                mr: -1,
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                },
              }}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </DialogTitle>
        )}

        <DialogContent dividers={!!title} sx={{ py: 3 }}>
          <DialogContentText color="text.primary" sx={{ lineHeight: 1.6 }}>
            {message}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
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
              startIcon={<RotateCcw size={16} strokeWidth={1.5} />}
              sx={{
                color: "text.secondary",
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