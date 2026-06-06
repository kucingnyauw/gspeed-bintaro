/**
 * TaxCalculator - Dialog kalkulator pajak untuk menghitung PPN dan PPh dengan persentase bebas.
 *
 * Fitur:
 * - Input jumlah dengan prefix "Rp" dan format IDR otomatis
 * - Input persentase pajak bebas (default 11%)
 * - Quick preset chips: PPN 11%, PPH 0.5%, 10%
 * - Perhitungan PPN (ditambahkan ke harga dasar)
 * - Perhitungan PPh (dikurangkan dari harga dasar)
 * - Tampilan hasil detail: Harga Dasar, Pajak, Total
 * - Result card dengan warna berbeda (PPN: secondary, PPh: warning)
 * - Tombol Reset untuk mengosongkan input
 * - Font monospace untuk nilai uang
 * - Animasi active scale pada tombol
 *
 * @param {Object} props - Properti komponen
 * @param {boolean} props.open - Status dialog terbuka/tutup
 * @param {Function} props.onClose - Handler untuk menutup dialog
 * @returns {JSX.Element|null} Komponen dialog kalkulator pajak
 */
import { X, Percent } from "lucide-react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
  Divider,
  InputAdornment,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTaxCalculator } from "../hooks/useTaxCalculator";

const TaxCalculator = ({ open, onClose }) => {
  const theme = useTheme();

  /**
   * Hook kalkulator pajak yang menyediakan state dan handler.
   */
  const {
    amount,
    taxRate,
    result,
    handleAmountChange,
    handleTaxRateChange,
    calculate,
    handleClear,
    formatInput,
    formatToIdr,
  } = useTaxCalculator();

  /** @type {string} Nilai amount yang sudah diformat */
  const displayAmount = amount ? formatInput(amount) : "";

  /** @type {boolean} Flag apakah tombol hitung bisa diklik */
  const canCalculate = amount && taxRate;

  /** @type {string} Nilai border radius dari theme */
  const borderRadius = `${theme.shape.borderRadius}px`;

  return (
    <Box
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Kalkulator Pajak"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal + 2,
        display: open ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: alpha(theme.palette.common.black, 0.45),
        backdropFilter: "blur(8px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "100%", sm: 480 },
          maxWidth: 480,
          borderRadius: borderRadius,
          bgcolor: "background.paper",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.2)}`,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.6),
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              Kalkulator Pajak
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hitung PPN & PPh dengan persentase bebas
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Tutup kalkulator pajak"
            sx={{
              color: "text.secondary",
              borderRadius: borderRadius,
              "&:hover": {
                color: "error.main",
                bgcolor: alpha(theme.palette.error.main, 0.08),
              },
            }}
          >
            <X size={20} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        {/* BODY */}
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* INPUT AMOUNT */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                mb: 1,
                display: "block",
                color: "text.secondary",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Jumlah (Rp)
            </Typography>
            <TextField
              fullWidth
              size="medium"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        color="text.disabled"
                        sx={{ fontWeight: 500 }}
                      >
                        Rp
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: borderRadius,
                  bgcolor: "background.default",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  letterSpacing: "-0.02em",
                  "& fieldset": { borderColor: "divider" },
                  "&:hover fieldset": { borderColor: "secondary.main" },
                  "&.Mui-focused fieldset": {
                    borderColor: "secondary.main",
                    borderWidth: 1,
                  },
                },
                "& .MuiOutlinedInput-input": { py: 1.75 },
              }}
            />
          </Box>

          {/* INPUT TAX RATE */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                mb: 1,
                display: "block",
                color: "text.secondary",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Persentase Pajak
            </Typography>
            <TextField
              fullWidth
              size="medium"
              value={taxRate}
              onChange={(e) => handleTaxRateChange(e.target.value)}
              placeholder="11"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Percent
                        size={18}
                        strokeWidth={1.5}
                        style={{ color: theme.palette.text.secondary }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: borderRadius,
                  bgcolor: "background.default",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  letterSpacing: "-0.02em",
                  "& fieldset": { borderColor: "divider" },
                  "&:hover fieldset": { borderColor: "secondary.main" },
                  "&.Mui-focused fieldset": {
                    borderColor: "secondary.main",
                    borderWidth: 1,
                  },
                },
                "& .MuiOutlinedInput-input": { py: 1.75 },
              }}
            />
          </Box>

          {/* QUICK TAX RATE CHIPS */}
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            {[
              { label: "PPN 11%", value: "11" },
              { label: "PPH 0.5%", value: "0.5" },
              { label: "10%", value: "10" },
            ].map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                size="small"
                variant={taxRate === preset.value ? "filled" : "outlined"}
                onClick={() => handleTaxRateChange(preset.value)}
                sx={{
                  borderRadius: borderRadius,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  ...(taxRate === preset.value && {
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    color: "secondary.main",
                    borderColor: "secondary.main",
                  }),
                }}
              />
            ))}
          </Stack>

          {/* ACTION BUTTONS */}
          <Stack direction="row" sx={{ gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClear}
              sx={{
                borderRadius: borderRadius,
                py: 1.25,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
                color: "text.secondary",
                borderColor: "divider",
                "&:hover": {
                  borderColor: alpha(theme.palette.error.main, 0.4),
                  color: "error.main",
                  bgcolor: alpha(theme.palette.error.main, 0.04),
                },
              }}
            >
              Reset
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => calculate("PPN")}
              disabled={!canCalculate}
              sx={{
                borderRadius: borderRadius,
                py: 1.25,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.875rem",
                bgcolor: "secondary.main",
                boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.3)}`,
                "&:hover": {
                  bgcolor: "secondary.dark",
                  boxShadow: `0 6px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
                },
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                  boxShadow: "none",
                },
              }}
            >
              Hitung PPN
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => calculate("PPh")}
              disabled={!canCalculate}
              sx={{
                borderRadius: borderRadius,
                py: 1.25,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.875rem",
                bgcolor: "warning.main",
                color: "warning.contrastText",
                boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.3)}`,
                "&:hover": {
                  bgcolor: "warning.dark",
                  boxShadow: `0 6px 20px ${alpha(theme.palette.warning.main, 0.4)}`,
                },
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                  boxShadow: "none",
                },
              }}
            >
              Hitung PPh
            </Button>
          </Stack>

          {/* RESULT */}
          {result && (
            <Box
              sx={{
                p: 3,
                borderRadius: borderRadius,
                bgcolor:
                  result.mode === "PPN"
                    ? alpha(theme.palette.secondary.main, 0.04)
                    : alpha(theme.palette.warning.main, 0.04),
                border: `1px solid ${
                  result.mode === "PPN"
                    ? alpha(theme.palette.secondary.main, 0.15)
                    : alpha(theme.palette.warning.main, 0.15)
                }`,
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
            >
              {/* Result Header */}
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                  }}
                >
                  Hasil {result.mode}
                </Typography>
                <Chip
                  label={`Pajak ${result.taxRate}%`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                    borderRadius: borderRadius,
                    color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                    borderColor:
                      result.mode === "PPN"
                        ? alpha(theme.palette.secondary.main, 0.3)
                        : alpha(theme.palette.warning.main, 0.3),
                  }}
                />
              </Stack>

              {/* Breakdown */}
              <Stack sx={{ gap: 2 }}>
                {/* Base Amount */}
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Harga Dasar
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                  >
                    {formatToIdr(result.baseAmount)}
                  </Typography>
                </Stack>

                <Divider />

                {/* Tax Amount */}
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Pajak ({result.taxRate}%)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                  >
                    + {formatToIdr(result.taxAmount)}
                  </Typography>
                </Stack>

                <Divider />

                {/* Total */}
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {result.mode === "PPN" ? "Total + PPN" : "Total - PPh"}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {formatToIdr(result.totalAfterTax)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TaxCalculator;