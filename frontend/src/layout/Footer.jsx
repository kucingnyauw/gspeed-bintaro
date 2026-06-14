/**
 * Footer - Application footer component.
 *
 * Menampilkan copyright dan informasi hak cipta.
 * Menggunakan data dari INFO config untuk nama aplikasi.
 * Tahun copyright selalu diperbarui otomatis.
 *
 * @component
 * @returns {JSX.Element} Rendered footer
 */
import { Box, Stack, Typography, useTheme } from "@mui/material";
import INFO from "@/data/Info.js";

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ flexShrink: 0, mt: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "center", sm: "center" },
          gap: { xs: 1, sm: 0 },
          px: { xs: 2.5, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            fontWeight: 400,
            fontSize: { xs: "0.6875rem", sm: "0.75rem" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          &copy; {currentYear} {INFO.name}. All rights reserved.
        </Typography>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            fontWeight: 400,
            fontSize: { xs: "0.6875rem", sm: "0.75rem" },
            textAlign: { xs: "center", sm: "right" },
          }}
        >
          Powered by G-Speed Technology
        </Typography>
      </Stack>
    </Box>
  );
};

export default Footer;