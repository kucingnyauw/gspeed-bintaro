import { Box, Typography, Link, Container, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import INFO from "@data/Info.js";


const footerLinks = {
  perusahaan: [
    { label: "Tentang Kami", href: "/about" },
    { label: "Produk", href: "/products" },
    { label: "Lacak Pesanan", href: "/track" },
    { label: "Kontak", href: `https://wa.me/${INFO.phone?.replace("+", "") || ""}` },
  ],
  support: [
    { label: "FAQ", href: "#" },
    { label: "Syarat & Ketentuan", href: "/terms" },
    { label: "Kebijakan Privasi", href: "/privacy" },
  ],
};

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { label: "IG", href: INFO.socialMedia?.instagram || "#" },
    { label: "WA", href: `https://wa.me/${INFO.phone?.replace("+", "") || ""}` },
    { label: "FB", href: INFO.socialMedia?.facebook || "#" },
  ];

  const hoverStyles = {
    position: "relative",
    textDecoration: "none",
    width: "fit-content",
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: -2,
      left: 0,
      width: 0,
      height: "2px",
      bgcolor: "primary.main",
      transition: `width ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
    },
    "&:hover::after": {
      width: "100%",
    },
    "&:hover": {
      color: "primary.main",
    },
  };

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `2px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        mt: { xs: theme.spacing(12), md: theme.spacing(16) },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            py: { xs: theme.spacing(8), md: theme.spacing(10) },
            display: "flex",
            flexDirection: "column",
            gap: { xs: theme.spacing(8), md: theme.spacing(10) },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "2fr 1fr 1fr",
              },
              gap: { xs: theme.spacing(6), md: theme.spacing(8) },
            }}
          >
            {/* Brand Info */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(3) }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
                <Box
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    width: 56,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    boxShadow: `4px 4px 0px ${theme.palette.divider}`,
                    p: theme.spacing(1),
                  }}
                >
                  <Box
                    component="img"
                    src={INFO.logoUrl}
                    alt={INFO.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                  }}
                >
                  {INFO.name || "G-Speed"}
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{ color: theme.palette.text.secondary, lineHeight: 2, maxWidth: 400 }}
              >
                Spesialis tuning dan upgrade performa Vespa modern. Dari CVT harian hingga racikan balap — semua berbasis data dyno, dikerjakan oleh mekanik berpengalaman.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(1.5), mt: theme.spacing(1) }}>
                <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold, display: "flex", alignItems: "center", gap: theme.spacing(1.5) }}>
                  <Box component="span" sx={{ fontSize: theme.typography.body1.fontSize }}>📍</Box>
                  {INFO.address || "Alamat bengkel"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold, display: "flex", alignItems: "center", gap: theme.spacing(1.5) }}>
                  <Box component="span" sx={{ fontSize: theme.typography.body1.fontSize }}>📞</Box>
                  {INFO.phone || "Nomor telepon"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold, display: "flex", alignItems: "center", gap: theme.spacing(1.5) }}>
                  <Box component="span" sx={{ fontSize: theme.typography.body1.fontSize }}>✉️</Box>
                  {INFO.email || "Email kontak"}
                </Typography>
              </Box>
            </Box>

            {/* Perusahaan */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(3) }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Menu
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2) }}>
                {footerLinks.perusahaan.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    underline="none"
                    color="text.secondary"
                    variant="body2"
                    sx={hoverStyles}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Support */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(3) }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Support
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2) }}>
                {footerLinks.support.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    underline="none"
                    color="text.secondary"
                    variant="body2"
                    sx={hoverStyles}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderTop: `2px solid ${theme.palette.divider}` }} />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: theme.spacing(4),
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: { xs: "center", sm: "left" } }}>
              © {currentYear} {INFO.name || "G-Speed"}. All rights reserved. Dibangun dengan{' '}
              <Box component="span" sx={{ color: theme.palette.error.main }}>
                ❤
              </Box>{' '}
              untuk pecinta Vespa.
            </Typography>

            <Box sx={{ display: "flex", gap: theme.spacing(2) }}>
              {socialLinks.map((social) => (
                <motion.div
                  key={social.label}
                  whileHover={{ scale: 1.15, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{
                      border: `2px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.text.secondary,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: theme.typography.fontWeightBold,
                      fontSize: theme.typography.caption.fontSize,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                      boxShadow: `3px 3px 0px ${theme.palette.divider}`,
                      "&:hover": {
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        borderColor: theme.palette.primary.main,
                        boxShadow: `5px 5px 0px ${theme.palette.divider}`,
                        transform: "translate(-2px, -2px)",
                      },
                    }}
                  >
                    {social.label}
                  </Link>
                </motion.div>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;