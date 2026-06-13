/**
 * ErrorBoundary - Komponen pembatas error untuk React Router dengan fallback UI yang informatif.
 *
 * Fitur:
 * - Menangkap error dari React Router menggunakan useRouteError()
 * - Menampilkan pesan error yang user-friendly
 * - Menampilkan detail error hanya di development mode (menggunakan isDev dari config)
 * - Tombol "Kembali" untuk navigasi ke halaman sebelumnya
 * - Tombol "Muat Ulang" untuk reload halaman
 * - Ikon AlertTriangle sebagai indikator visual error
 * - Stack trace ditampilkan dengan font monospace di dev mode
 * - Animasi fade-in untuk transisi yang halus
 * - Responsive layout untuk mobile dan desktop
 *
 * @component
 * @returns {JSX.Element} Rendered error boundary route
 */
import { useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { isDev } from "@config/env.js";

/**
 * Keyframe animasi fade-in dari bawah.
 *
 * @type {Object}
 */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * Keyframe animasi pulse untuk ikon error.
 *
 * @type {Object}
 */
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

/**
 * ErrorBoundary - Menampilkan halaman error dengan informasi yang membantu user.
 *
 * @component
 * @returns {JSX.Element}
 */
const ErrorBoundary = () => {
  const theme = useTheme();

  /**
   * Object error dari React Router.
   *
   * @type {Object}
   */
  const error = useRouteError();

  /**
   * Pesan error yang akan ditampilkan ke user.
   *
   * @type {string}
   */
  const errorMessage =
    error?.statusText || error?.message || "Terjadi kesalahan yang tidak terduga";

  /**
   * HTTP status code dari error.
   *
   * @type {number|undefined}
   */
  const statusCode = error?.status;

  /** @type {string} */
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4 },
        bgcolor: "background.default",
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: "100%",
          borderRadius: br,
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`,
          overflow: "hidden",
          animation: `${fadeInUp} 0.4s ${theme.transitions.easing.easeOut}`,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Error Icon & Title */}
          <Stack
            sx={{
              alignItems: "center",
              pt: { xs: 4, sm: 5 },
              pb: { xs: 3, sm: 4 },
              px: { xs: 3, sm: 4 },
            }}
          >
            <Box
              sx={{
                width: { xs: 64, sm: 72 },
                height: { xs: 64, sm: 72 },
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.error.main, 0.08),
                color: "error.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: { xs: 2.5, sm: 3 },
                animation: `${pulse} 3s ease-in-out infinite`,
              }}
            >
              <AlertTriangle size={32} strokeWidth={1.5} />
            </Box>

            {statusCode && (
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: alpha(theme.palette.error.main, 0.12),
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  mb: 0.5,
                  fontSize: { xs: "3rem", sm: "3.75rem" },
                }}
              >
                {statusCode}
              </Typography>
            )}

            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 1,
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
              }}
            >
              Terjadi Kesalahan
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: "center",
                maxWidth: 360,
                lineHeight: 1.6,
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
              }}
            >
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman
              atau kembali ke halaman sebelumnya.
            </Typography>
          </Stack>

          <Divider />

          {/* Dev Error Detail */}
          {isDev && error && (
            <>
              <Box sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "error.main",
                    mb: 1.5,
                    display: "block",
                  }}
                >
                  Detail Error
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: br,
                    bgcolor: alpha(theme.palette.error.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                    maxHeight: 240,
                    overflow: "auto",
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                      bgcolor: alpha(theme.palette.divider, 0.5),
                      borderRadius: 10,
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: "0.6875rem",
                      fontWeight: 400,
                      color: "error.main",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      lineHeight: 1.6,
                    }}
                  >
                    {errorMessage}
                    {error?.stack && (
                      <>
                        {"\n\n"}
                        <Box
                          component="span"
                          sx={{ color: "text.secondary", opacity: 0.7 }}
                        >
                          {error.stack.slice(0, 800)}
                        </Box>
                      </>
                    )}
                  </Typography>
                </Box>
              </Box>
              <Divider />
            </>
          )}

          {/* Action Buttons */}
          <Box sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{ gap: 1.5 }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={() => window.history.back()}
                sx={{
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: br,
                  py: 1.25,
                  color: "text.secondary",
                  borderColor: alpha(theme.palette.divider, 0.8),
                  "&:hover": {
                    borderColor: theme.palette.text.primary,
                    color: "text.primary",
                    bgcolor: "transparent",
                  },
                }}
              >
                Kembali
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: br,
                  py: 1.25,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                }}
              >
                Muat Ulang Halaman
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErrorBoundary;