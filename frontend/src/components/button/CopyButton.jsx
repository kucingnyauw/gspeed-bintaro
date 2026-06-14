/**
 * CopyButton - Button component that copies text to clipboard with snackbar notification.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.text - Text to copy to clipboard
 * @param {string} [props.successMessage="Berhasil disalin"] - Success snackbar message
 * @param {string} [props.size="small"] - Button size
 * @param {Object} [props.sx] - Additional styles
 * @returns {JSX.Element} Rendered copy button
 *
 * @example
 * <CopyButton text="ORD-20260509-2AD3" />
 * @example
 * <CopyButton text="08123456789" successMessage="Nomor telepon berhasil disalin" />
 */
import { useState, useCallback } from "react";
import { Copy, Check, X } from "lucide-react";
import { IconButton, Tooltip, Snackbar, Alert, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

const CopyButton = ({
  text,
  successMessage = "Teks berhasil disalin ke clipboard",
  size = "small",
  sx = {},
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setSnackbarOpen(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleCloseSnackbar = useCallback(() => setSnackbarOpen(false), []);

  return (
    <>
      <Tooltip title={copied ? "Tersalin!" : "Salin"}>
        <IconButton
          onClick={handleCopy}
          size={size}
          sx={{
            border: "1px solid",
            borderColor: copied
              ? alpha(theme.palette.success.main, 0.4)
              : alpha(theme.palette.divider, 0.8),
            color: copied
              ? theme.palette.success.main
              : theme.palette.text.secondary,
            bgcolor: copied
              ? alpha(theme.palette.success.main, 0.06)
              : "transparent",
            minWidth: 32,
            minHeight: 32,
            transition: theme.transitions.create(["all"], {
              duration: theme.transitions.duration.shorter,
            }),
            "&:hover": {
              bgcolor: copied
                ? alpha(theme.palette.success.main, 0.12)
                : alpha(theme.palette.secondary.main, 0.08),
              borderColor: copied
                ? theme.palette.success.main
                : theme.palette.secondary.main,
              color: copied
                ? theme.palette.success.main
                : theme.palette.secondary.main,
            },
            ...sx,
          }}
        >
          {copied ? (
            <Check size={14} strokeWidth={2} />
          ) : (
            <Copy size={14} strokeWidth={1.5} />
          )}
        </IconButton>
      </Tooltip>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="standard"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleCloseSnackbar}
              sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
            >
              <X size={14} strokeWidth={2} />
            </IconButton>
          }
          sx={{
            minWidth: { xs: 260, sm: 320 },
            borderRadius: `${theme.shape.borderRadius}px`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
            border: "1px solid",
            borderColor: alpha(theme.palette.success.main, 0.15),
            bgcolor: "background.paper",
            color: "text.primary",
            alignItems: "center",
            "& .MuiAlert-icon": {
              color: theme.palette.success.main,
              opacity: 0.9,
              alignItems: "center",
              pt: 0,
            },
            "& .MuiAlert-message": {
              flex: 1,
              fontWeight: 500,
              fontSize: "0.875rem",
            },
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CopyButton;
