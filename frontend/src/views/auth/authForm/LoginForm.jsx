/**
 * Form component for email-based passwordless login.
 *
 * @component
 * @param {Object} props
 * @param {function} props.onEmailSubmit - Callback fired with the submitted email.
 * @param {boolean} props.isLoading - Whether the form is in a loading/submitting state.
 */
import { Controller, useForm } from "react-hook-form";
import { Stack, Typography, Button, TextField, Box, CircularProgress, Divider, useTheme } from "@mui/material";
import INFO from "@data/Info.js";

const LoginForm = ({ onEmailSubmit, isLoading }) => {
  const theme = useTheme();

  const { handleSubmit, control, formState: { errors, isValid } } = useForm({
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const submit = (data) => {
    if (isLoading) return;
    onEmailSubmit?.(data.email);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(submit)}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: isLoading ? "none" : "auto",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 0.2s ease",
        gap: { xs: 3, sm: 4 },
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src={INFO.logoUrl}
        alt={INFO.name}
        sx={{
          height: { xs: 40, sm: 48 },
          width: "auto",
          maxWidth: { xs: 120, sm: 140 },
          objectFit: "contain",
        }}
      />

      {/* Title & Subtitle */}
      <Stack sx={{ gap: { xs: 0.5, sm: 1 }, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "-0.01em", fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
          Selamat Datang
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
          Masukkan email Anda untuk masuk ke akun
        </Typography>
      </Stack>

      {/* Email Field */}
      <Box sx={{ width: "100%" }}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email wajib diisi",
            pattern: {
              value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
              message: "Format email tidak valid",
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              autoFocus
              label="Alamat Email"
              type="email"
              disabled={isLoading}
              error={!!errors.email}
              helperText={errors.email?.message}
              placeholder="anda@example.com"
            />
          )}
        />
      </Box>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isValid || isLoading}
        size="large"
        sx={{
          py: 1.75,
          fontWeight: 600,
          textTransform: "none",
          fontSize: { xs: "0.9375rem", sm: "1rem" },
          minHeight: 52,
        }}
      >
        {isLoading ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          "Lanjutkan dengan Email"
        )}
      </Button>

      {/* Divider */}
      <Divider sx={{ width: "100%" }}>
        <Typography variant="caption" color="text.disabled" sx={{ px: 1.5 }}>
          INFO
        </Typography>
      </Divider>

      {/* Info Text */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textAlign: "center",
          lineHeight: 1.8,
          fontSize: { xs: "0.6875rem", sm: "0.75rem" },
        }}
      >
        Kami akan mengirimkan tautan login ke email Anda.
        <br />
        Tidak perlu password!
      </Typography>
    </Box>
  );
};

export default LoginForm;