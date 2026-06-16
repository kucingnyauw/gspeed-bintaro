import { Box, Divider, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDevice } from "@hooks";
import INFO from "@data/Info.js";

const OnboardingFooter = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();

  /** Smooth scroll ke section */
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const productLinks = [
    { label: "Point of Sale", id: "products" },
    { label: "Manajemen Mekanik", id: "products" },
    { label: "Inventaris Sparepart", id: "products" },
    { label: "Pelanggan & Kendaraan", id: "products" },
    { label: "Laporan & Analitik", id: "products" },
  ];

  const resourceLinks = [
    { label: "Panduan Penggunaan", href: "https://gspeed.mintlify.app" },
    { label: "Status Layanan", href: "#" },
  ];

  const companyLinks = [
    { label: "Fitur", id: "products" },
    { label: "Keunggulan", id: "benefits" },
    { label: "Tampilan", id: "screenshots" },
    { label: "Teknologi", id: "tech-stack" },
  ];

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        py: { xs: 6, sm: 8, md: 10 },
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "center", sm: "flex-start" },
          maxWidth: 1200,
          mx: "auto",
          gap: { xs: 5, sm: 6, md: 8 },
        }}
      >
        {/** Brand */}
        <Stack
          sx={{
            alignItems: { xs: "center", sm: "flex-start" },
            gap: 2,
            maxWidth: 260,
          }}
        >
          <Box
            component="img"
            src={INFO.logoUrl}
            alt={INFO.name}
            sx={{
              height: 32,
              width: "auto",
              maxWidth: 120,
              objectFit: "contain",
              mb: 0.5,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.75,
              color: alpha(theme.palette.text.secondary, 0.65),
              fontWeight: 400,
              fontSize: "0.85rem",
            }}
          >
            Platform manajemen bengkel modern yang membantu mengelola operasional
            kasir, mekanik, inventaris, dan pelanggan dalam satu sistem terpadu.
          </Typography>
        </Stack>

        {/** Links */}
        <Stack
          direction="row"
          sx={{
            gap: { xs: 4, sm: 6, md: 10 },
            flexWrap: "wrap",
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          {/** Produk */}
          <Stack sx={{ gap: 1.5, alignItems: { xs: "center", sm: "flex-start" } }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme.palette.text.primary,
                fontSize: "0.7rem",
                mb: 0.5,
              }}
            >
              Modul
            </Typography>
            {productLinks.map((link) => (
              <Typography
                key={link.label}
                variant="body2"
                onClick={() => handleScrollTo(link.id)}
                sx={{
                  cursor: "pointer",
                  color: alpha(theme.palette.text.secondary, 0.6),
                  fontWeight: 400,
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: theme.palette.text.primary,
                  },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          {/** Resources */}
          <Stack sx={{ gap: 1.5, alignItems: { xs: "center", sm: "flex-start" } }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme.palette.text.primary,
                fontSize: "0.7rem",
                mb: 0.5,
              }}
            >
              Bantuan
            </Typography>
            {resourceLinks.map((link) => (
              <Typography
                key={link.label}
                variant="body2"
                component="a"
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                sx={{
                  cursor: "pointer",
                  color: alpha(theme.palette.text.secondary, 0.6),
                  fontWeight: 400,
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: theme.palette.text.primary,
                  },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          {/** Menjelajah */}
          <Stack sx={{ gap: 1.5, alignItems: { xs: "center", sm: "flex-start" } }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme.palette.text.primary,
                fontSize: "0.7rem",
                mb: 0.5,
              }}
            >
              Menjelajah
            </Typography>
            {companyLinks.map((link) => (
              <Typography
                key={link.label}
                variant="body2"
                onClick={() => handleScrollTo(link.id)}
                sx={{
                  cursor: "pointer",
                  color: alpha(theme.palette.text.secondary, 0.6),
                  fontWeight: 400,
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: theme.palette.text.primary,
                  },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ my: { xs: 4, sm: 6 }, maxWidth: 1200, mx: "auto" }} />

      {/** Bottom Bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1200,
          mx: "auto",
          gap: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: alpha(theme.palette.text.secondary, 0.5),
            fontWeight: 400,
            fontSize: "0.8rem",
          }}
        >
          &copy; {new Date().getFullYear()} {INFO.name}. All rights reserved.
        </Typography>
      </Stack>
    </Box>
  );
};

export default OnboardingFooter;