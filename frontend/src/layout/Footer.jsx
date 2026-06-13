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
import { Box, Divider, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import INFO from "@/data/Info.js";

const Footer = () => {
  const theme = useTheme();

  /** @type {number} Tahun saat ini untuk copyright */
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        flexShrink: 0,


      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "center", sm: "center" },
          gap: { xs: 0.5, sm: 0 },
          p : 4
        }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontWeight: 400 }}
        >
          &copy; {currentYear} {INFO.name}. All rights reserved.
        </Typography>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontWeight: 400 }}
        >
          Powered by G-Speed Technology
        </Typography>
      </Stack>
    </Box>
  );
};

export default Footer;