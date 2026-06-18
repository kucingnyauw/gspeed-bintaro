/**
 * AppLoading - Full-screen loading overlay yang menutupi seluruh halaman.
 * Digunakan saat initial bootstrap atau auth check berlangsung.
 * Background solid memastikan halaman di baliknya tidak terlihat.
 *
 * @component
 * @returns {JSX.Element} Full-screen backdrop dengan animasi loading dots
 */
import { Box, Backdrop, useTheme } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

const pulse = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const AppLoading = () => {
  const theme = useTheme();

  const dotStyle = {
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: "50%",
    backgroundColor: "secondary.main",
    animation: `${pulse} 1.4s ease-in-out infinite`,
    mx: 0.5,
  };

  return (
    <Backdrop
      open={true}
      sx={{
        zIndex: theme.zIndex.modal + 10,
        bgcolor: "background.default",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box component="span" sx={dotStyle} />
        <Box
          component="span"
          sx={{
            ...dotStyle,
            animationDelay: "0.2s",
          }}
        />
        <Box
          component="span"
          sx={{
            ...dotStyle,
            animationDelay: "0.4s",
          }}
        />
      </Box>
    </Backdrop>
  );
};

export default AppLoading;