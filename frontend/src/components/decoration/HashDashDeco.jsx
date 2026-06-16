import { Box, useTheme, alpha } from "@mui/material";

const HashDashedDeco = ({ sx }) => {
  const theme = useTheme();
  const color = alpha(theme.palette.text.disabled, 0.15);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        width: 280,
        height: 280,
        zIndex: 0,
        pointerEvents: "none",
        maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black 25%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black 25%, transparent 75%)",
        ...sx,
      }}
    >
      {/* Vertical dashed lines */}
      <Box sx={{ position: "absolute", width: 0, height: "100%", left: "33%", borderLeft: `1px dashed ${color}` }} />
      <Box sx={{ position: "absolute", width: 0, height: "100%", left: "50%", borderLeft: `1px dashed ${color}` }} />
      <Box sx={{ position: "absolute", width: 0, height: "100%", left: "66%", borderLeft: `1px dashed ${color}` }} />

      {/* Horizontal dashed lines */}
      <Box sx={{ position: "absolute", height: 0, width: "100%", top: "33%", borderTop: `1px dashed ${color}` }} />
      <Box sx={{ position: "absolute", height: 0, width: "100%", top: "50%", borderTop: `1px dashed ${color}` }} />
      <Box sx={{ position: "absolute", height: 0, width: "100%", top: "66%", borderTop: `1px dashed ${color}` }} />

      {/* Center dot */}
      <Box
        sx={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: "50%",
          top: "calc(50% - 4px)",
          left: "calc(50% - 4px)",
          bgcolor: color,
          opacity: 0.6,
        }}
      />
    </Box>
  );
};

export default HashDashedDeco;