import { Box, useTheme, alpha } from "@mui/material";
import { HEADER } from "@shared/constant";

const OnboardingWrapper = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        minWidth: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.default,
        pt: { xs: `${HEADER.MOBILE_HEIGHT}px`, sm: `${HEADER.DESKTOP_HEIGHT}px` },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/** Subtle background grid */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          backgroundImage: `linear-gradient(${alpha(theme.palette.divider, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.divider, 0.06)} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/** Top glow accent */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          width: "100%",
          minWidth: 0,
          maxWidth: "100vw",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, sm: 6, md: 8 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            maxWidth: 1200,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 10, sm: 14, md: 20 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default OnboardingWrapper;