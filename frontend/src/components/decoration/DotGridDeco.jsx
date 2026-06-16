import { Box, useTheme, alpha } from "@mui/material";

const DotGridDeco = ({ sx }) => {
  const theme = useTheme();
  const dotColor = alpha(theme.palette.text.disabled, 0.15);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        width: 320,
        height: 320,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: "20px 20px",
        maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 70%)",
        ...sx,
      }}
    />
  );
};

export default DotGridDeco;