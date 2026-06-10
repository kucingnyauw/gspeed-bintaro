/**
 * TaxCalculator - Dialog kalkulator pajak minimalis untuk menghitung PPN dan PPh.
 *
 * Fitur:
 * - Input jumlah dengan prefix "Rp" dan format IDR otomatis
 * - Input persentase pajak bebas (default 11%)
 * - Quick preset chips: PPN 11%, PPH 0.5%, 10%
 * - Perhitungan PPN (ditambahkan) dan PPh (dikurangkan)
 * - Tampilan hasil detail: Harga Dasar, Pajak, Total
 * - Result card dengan warna subtle (PPN: secondary, PPh: warning)
 * - Tombol Reset untuk mengosongkan input
 * - Font monospace untuk nilai uang
 * - Desain minimalis dengan spacing yang lega dan tinggi yang nyaman
 *
 * @param {Object} props - Properti komponen
 * @param {boolean} props.open - Status dialog terbuka/tutup
 * @param {Function} props.onClose - Handler untuk menutup dialog
 * @returns {JSX.Element|null} Komponen dialog kalkulator pajak
 */
import { X, Percent, Calculator } from "lucide-react";
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

  /** @type {string} */
  const displayAmount = amount ? formatInput(amount) : "";

  /** @type {boolean} */
  const canCalculate = amount && taxRate;

  /** @type {string} */
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
        bgcolor: alpha(theme.palette.common.black, 0.35),
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "100%", sm: 460 },
          maxWidth: 460,
          borderRadius: borderRadius,
          bgcolor: "background.paper",
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.12)}`,
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
            py: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: borderRadius,
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                color: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calculator size={20} strokeWidth={1.5} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: "0.9375rem" }}>
                Kalkulator Pajak
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PPN & PPh dengan persentase bebas
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Tutup kalkulator pajak"
            sx={{
              color: "text.secondary",
              borderRadius: borderRadius,
              "&:hover": {
                color: "text.primary",
                bgcolor: "action.hover",
              },
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        {/* BODY */}
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* INPUT AMOUNT */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                mb: 1.25,
                display: "block",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: "0.6875rem",
              }}
            >
              Jumlah
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
                        sx={{ fontWeight: 500, fontSize: "1rem" }}
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
                  bgcolor: alpha(theme.palette.secondary.main, 0.03),
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  letterSpacing: "-0.02em",
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: alpha(theme.palette.secondary.main, 0.2) },
                  "&.Mui-focused fieldset": {
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    borderWidth: 1,
                  },
                },
                "& .MuiOutlinedInput-input": { py: 2 },
              }}
            />
          </Box>

          {/* INPUT TAX RATE */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                mb: 1.25,
                display: "block",
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: "0.6875rem",
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
                        size={16}
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
                  bgcolor: alpha(theme.palette.secondary.main, 0.03),
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  letterSpacing: "-0.02em",
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: alpha(theme.palette.secondary.main, 0.2) },
                  "&.Mui-focused fieldset": {
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    borderWidth: 1,
                  },
                },
                "& .MuiOutlinedInput-input": { py: 2 },
              }}
            />
          </Box>

          {/* QUICK TAX RATE CHIPS */}
          <Stack direction="row" sx={{ gap: 1.25, flexWrap: "wrap" }}>
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
                  height: 32,
                  px: 0.5,
                  ...(taxRate === preset.value && {
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: "secondary.main",
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
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
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
                color: "text.secondary",
                borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: "transparent",
                "&:hover": {
                  borderColor: alpha(theme.palette.error.main, 0.3),
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
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
                bgcolor: "secondary.main",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "secondary.dark",
                  boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
                },
                "&:disabled": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  color: alpha(theme.palette.secondary.main, 0.4),
                  boxShadow: "none",
                },
              }}
            >
              PPN
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => calculate("PPh")}
              disabled={!canCalculate}
              sx={{
                borderRadius: borderRadius,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
                bgcolor: "warning.main",
                color: "warning.contrastText",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "warning.dark",
                  boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`,
                },
                "&:disabled": {
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: alpha(theme.palette.warning.main, 0.4),
                  boxShadow: "none",
                },
              }}
            >
              PPh
            </Button>
          </Stack>

          {/* RESULT */}
          {result && (
            <Box
              sx={{
                p: 3,
                borderRadius: borderRadius,
                bgcolor: alpha(
                  result.mode === "PPN" ? theme.palette.secondary.main : theme.palette.warning.main,
                  0.04
                ),
                border: `1px solid ${alpha(
                  result.mode === "PPN" ? theme.palette.secondary.main : theme.palette.warning.main,
                  0.1
                )}`,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Result Header */}
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontSize: "0.6875rem",
                    color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                  }}
                >
                  Hasil {result.mode}
                </Typography>
                <Chip
                  label={`${result.taxRate}%`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                    borderRadius: borderRadius,
                    color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                    borderColor: alpha(
                      result.mode === "PPN" ? theme.palette.secondary.main : theme.palette.warning.main,
                      0.2
                    ),
                  }}
                />
              </Stack>

              {/* Breakdown */}
              <Stack sx={{ gap: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
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

                <Divider sx={{ opacity: 0.4 }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Pajak {result.taxRate}%
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                  >
                    {result.mode === "PPN" ? "+ " : "− "}
                    {formatToIdr(result.taxAmount)}
                  </Typography>
                </Stack>

                <Divider sx={{ opacity: 0.4 }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Total
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: result.mode === "PPN" ? "secondary.main" : "warning.main",
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      letterSpacing: "-0.01em",
                      fontSize: "1.25rem",
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