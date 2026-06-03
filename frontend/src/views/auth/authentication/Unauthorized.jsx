/**
 * Unauthorized - Halaman untuk pengguna yang tidak memiliki akses.
 *
 * @component
 * @returns {JSX.Element} Rendered unauthorized page
 */
import { ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AuthWrapper from "@views/auth/authWrapper/AuthWrapper.jsx";
import AuthCardWrapper from "@views/auth/authWrapper/AuthCardWrapper.jsx";

const Unauthorized = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AuthWrapper>
      <AuthCardWrapper>
        <Stack
          spacing={6}
          sx={{
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              color: "warning.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldOff size={36} strokeWidth={1.5} />
          </Box>

          <Stack direction="column" spacing={1}>
            <Typography variant="h5">Akses Dibatasi</Typography>

            <Typography variant="body2" color="textDisabled">
              Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
              Silakan hubungi administrator jika Anda merasa ini adalah
              kesalahan.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={2}
          
          >
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button variant="contained" onClick={() => navigate("/dashboard")}>
              Ke Dashboard
            </Button>
          </Stack>
        </Stack>
      </AuthCardWrapper>
    </AuthWrapper>
  );
};

export default Unauthorized;
