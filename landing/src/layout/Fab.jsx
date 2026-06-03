import { Box, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import INFO from "@data/Info.js";

/**
 * Floating Action Button WhatsApp
 * @component
 * @returns {JSX.Element} Tombol WA mengambang dengan tooltip dan animasi
 */
const Fab = () => {
  const theme = useTheme();

  const handleClick = () => {
    const phoneNumber = INFO.phone.replace("+", "");
    const message = encodeURIComponent(
      `Halo ${INFO.name}, saya tertarik dengan jasa tuning Vespa. Apakah ada jadwal yang tersedia?`
    );
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: { xs: 20, md: 28 },
        right: { xs: 20, md: 28 },
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1.5,
      }}
    >
      {/* Tooltip Label */}
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
      >
        <Box
          sx={{
            border: `2px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            px: 2.5,
            py: 1,
            boxShadow: theme.shadows[3],
            display: { xs: "none", md: "block" },
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -8,
              right: 20,
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `8px solid ${theme.palette.background.paper}`,
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
            }}
          >
            Butuh info lebih lanjut?
          </Typography>
        </Box>
      </motion.div>

      {/* FAB Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: [
            "0px 0px 0px 0px rgba(37, 211, 102, 0.5)",
            "0px 0px 0px 12px rgba(37, 211, 102, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Box
          onClick={handleClick}
          component="button"
          aria-label="Chat via WhatsApp"
          sx={{
            border: `2px solid ${theme.palette.divider}`,
            bgcolor: "#25D366",
            color: "#FFFFFF",
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: theme.shadows[6],
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#1EBE57",
              transform: "translate(-2px, -2px)",
              boxShadow: theme.shadows[10],
            },
            p: 0,
            outline: "none",
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="30"
            height="30"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Fab;