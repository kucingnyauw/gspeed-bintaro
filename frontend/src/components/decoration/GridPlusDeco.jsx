import { Box, useTheme, alpha } from "@mui/material";

const GridPlusDeco = ({ sx }) => {
  const theme = useTheme();
  const color = alpha(theme.palette.divider, 0.4);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        width: 360,
        height: 360,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black 20%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black 20%, transparent 70%)",
        ...sx,
      }}
    />
  );
};

export default GridPlusDeco;