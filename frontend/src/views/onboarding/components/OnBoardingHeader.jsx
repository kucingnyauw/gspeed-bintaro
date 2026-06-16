import { Box, Stack, Button, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDevice } from "@hooks";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HEADER } from "@shared/constant";
import INFO from "@data/Info.js";

const OnboardingHeader = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const navigate = useNavigate();
  const br = `${theme.shape.borderRadius}px`;

  const headerHeight = isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT;

  /** Navigasi ke dashboard */
  const handleDashboard = () => navigate("/dashboard", { replace: true });

  /** Smooth scroll ke section */
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { label: "Fitur", id: "products" },
    { label: "Keunggulan", id: "benefits" },
    { label: "Tampilan", id: "screenshots" },
    { label: "Teknologi", id: "tech-stack" },
  ];

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        zIndex: theme.zIndex.appBar,
        bgcolor: alpha(theme.palette.background.default, 0.75),
        backdropFilter: "saturate(180%) blur(20px)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        {/** Logo - Left */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleScrollTo("hero")}
          sx={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Box
            component="img"
            src={INFO.logoUrl}
            alt={INFO.name}
            sx={{
              height: { xs: 26, sm: 30 },
              width: "auto",
              maxWidth: { xs: 100, sm: 120 },
              objectFit: "contain",
            }}
          />
        </Box>

        {/** Navigation - Center */}
        {!isMobile && (
          <Stack
            direction="row"
            sx={{
              gap: 0.5,
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="text"
                size="small"
                onClick={() => handleScrollTo(item.id)}
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.65),
                  fontWeight: 500,
                  fontSize: "0.8125rem",
                  letterSpacing: "-0.01em",
                  textTransform: "none",
                  px: 2,
                  py: 0.75,
                  borderRadius: br,
                  minWidth: "auto",
                  position: "relative",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: theme.palette.text.primary,
                    bgcolor: "transparent",
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 4,
                    left: "50%",
                    transform: "translateX(-50%) scaleX(0)",
                    width: "60%",
                    height: 2,
                    borderRadius: 1,
                    bgcolor: theme.palette.primary.main,
                    transition: "transform 0.25s ease",
                  },
                  "&:hover::after": {
                    transform: "translateX(-50%) scaleX(1)",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        )}

        {/** CTA Button - Right */}
        <Button
          variant="contained"
          size="small"
          onClick={handleDashboard}
          sx={{
            fontWeight: 500,
            fontSize: "0.8125rem",
            letterSpacing: "-0.01em",
            textTransform: "none",
            px: { xs: 2.5, sm: 3 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: br,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              bgcolor: alpha(theme.palette.primary.main, 0.88),
            },
            transition: "all 0.2s ease",
          }}
        >
          Mulai Sekarang
        </Button>
      </Box>
    </Box>
  );
};

export default OnboardingHeader;