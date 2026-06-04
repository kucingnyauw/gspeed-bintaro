import { Box, Button, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { X } from "lucide-react";
import { useCalculator } from "../hooks";

const scientificButtons = [
  [
    { label: "sin", func: "sin", tooltip: "Sinus (derajat)" },
    { label: "cos", func: "cos", tooltip: "Cosinus (derajat)" },
    { label: "tan", func: "tan", tooltip: "Tangen (derajat)" },
  ],
  [
    { label: "log", func: "log", tooltip: "Logaritma basis 10" },
    { label: "ln", func: "ln", tooltip: "Logaritma natural" },
    { label: "√", func: "sqrt", tooltip: "Akar kuadrat" },
  ],
  [
    { label: "x²", func: "square", tooltip: "Pangkat 2" },
    { label: "x³", func: "cube", tooltip: "Pangkat 3" },
    { label: "xⁿ", func: "power", tooltip: "Pangkat n" },
  ],
  [
    { label: "n!", func: "factorial", tooltip: "Faktorial" },
    { label: "1/x", func: "inverse", tooltip: "Kebalikan (1/x)" },
    { label: "|x|", func: "abs", tooltip: "Nilai mutlak" },
  ],
  [
    { label: "π", func: "pi", tooltip: "Pi (3.14159...)" },
    { label: "e", func: "e", tooltip: "Euler (2.71828...)" },
    { label: "%", func: "percent", tooltip: "Persen" },
  ],
];

const memoryButtons = [
  { label: "MC", action: "MC", tooltip: "Hapus memori" },
  { label: "MR", action: "MR", tooltip: "Panggil memori" },
  { label: "M+", action: "M+", tooltip: "Tambah ke memori" },
  { label: "M-", action: "M-", tooltip: "Kurang dari memori" },
];

const operatorButtons = [
  { label: "÷", op: "÷", tooltip: "Bagi" },
  { label: "×", op: "×", tooltip: "Kali" },
  { label: "−", op: "-", tooltip: "Kurang" },
  { label: "+", op: "+", tooltip: "Tambah" },
];

/**
 * Calculator - Dialog kalkulator dengan mode ilmiah, memori, dan tampilan responsif.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 */
const Calculator = ({ open, onClose }) => {
  const theme = useTheme();
  const {
    display,
    expression,
    memory,
    showScientific,
    handleNumber,
    handleOperator,
    handleFunction,
    handleMemory,
    handleClear,
    handleDelete,
    handleEquals,
    toggleScientific,
    formatDisplay,
  } = useCalculator();

  const baseBtnSx = {
    minWidth: 0,
    textTransform: "none",
    borderRadius: 2,
    transition: theme.transitions.create(
      ["background-color", "transform", "box-shadow"],
      { duration: theme.transitions.duration.shorter }
    ),
    "&:active": {
      transform: "scale(0.94)",
    },
  };

  const numberBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 1.75,
    fontSize: "1.25rem",
    fontWeight: 500,
    color: "text.primary",
    bgcolor: "background.paper",
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
    "&:hover": {
      bgcolor: "action.hover",
      borderColor: alpha(theme.palette.secondary.main, 0.3),
      boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.06)}`,
    },
  };

  const operatorBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 1.75,
    fontSize: "1.35rem",
    fontWeight: 600,
    color: "secondary.main",
    bgcolor: alpha(theme.palette.secondary.main, 0.06),
    border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.14),
      borderColor: alpha(theme.palette.secondary.main, 0.3),
      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
    },
  };

  const functionBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 1,
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "text.secondary",
    bgcolor: "transparent",
    border: `1px solid transparent`,
    "&:hover": {
      bgcolor: "action.hover",
      color: "secondary.main",
      borderColor: alpha(theme.palette.secondary.main, 0.2),
    },
  };

  const memoryBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 0.75,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: memory !== 0 ? "secondary.main" : "text.disabled",
    bgcolor: memory !== 0 ? alpha(theme.palette.secondary.main, 0.04) : "transparent",
    border: `1px solid ${memory !== 0 ? alpha(theme.palette.secondary.main, 0.15) : "transparent"}`,
    "&:hover": {
      bgcolor: memory !== 0 ? alpha(theme.palette.secondary.main, 0.1) : "action.hover",
    },
  };

  return (
    <Box
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Kalkulator"
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
          width: { xs: "100%", sm: 720 },
          maxWidth: 720,
          borderRadius: 3,
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
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "success.main",
                boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              Kalkulator
            </Typography>
            {memory !== 0 && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "secondary.main",
                    fontWeight: 700,
                    fontSize: "0.6875rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  M
                </Typography>
              </Box>
            )}
          </Stack>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
            <Tooltip
              title={showScientific ? "Sembunyikan ilmiah" : "Tampilkan ilmiah"}
              arrow
            >
              <Button
                onClick={toggleScientific}
                sx={{
                  ...baseBtnSx,
                  px: 2,
                  py: 0.5,
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: showScientific ? "secondary.main" : "text.secondary",
                  bgcolor: showScientific
                    ? alpha(theme.palette.secondary.main, 0.08)
                    : "transparent",
                  border: `1px solid ${
                    showScientific
                      ? alpha(theme.palette.secondary.main, 0.2)
                      : "transparent"
                  }`,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.14),
                  },
                }}
              >
                fx
              </Button>
            </Tooltip>
            <Tooltip title="Tutup" arrow>
              <IconButton
                onClick={onClose}
                size="small"
                aria-label="Tutup kalkulator"
                sx={{
                  color: "text.secondary",
                  borderRadius: 2,
                  "&:hover": {
                    color: "error.main",
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                }}
              >
                <X size={18} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* BODY */}
        <Stack direction={{ xs: "column", sm: "row" }}>
          {/* LEFT PANEL — Display + Memory + Scientific */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRight: { sm: `1px solid ${theme.palette.divider}` },
              bgcolor: alpha(theme.palette.background.default, 0.4),
            }}
          >
            {/* DISPLAY */}
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: `inset 0 2px 6px ${alpha(theme.palette.common.black, 0.04)}`,
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 1.5,
                minHeight: 130,
              }}
            >
              {expression && (
                <Typography
                  sx={{
                    wordBreak: "break-all",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    opacity: 0.65,
                    lineHeight: 1.4,
                    letterSpacing: "0.02em",
                  }}
                >
                  {expression.replace(/\*/g, "×").replace(/\//g, "÷")}
                </Typography>
              )}
              <Typography
                sx={{
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: display === "Error" ? "error.main" : "text.primary",
                  wordBreak: "break-all",
                  fontSize: display.length > 10 ? "1.75rem" : "2.5rem",
                  lineHeight: 1.15,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
              >
                {formatDisplay(display)}
              </Typography>
            </Box>

            {/* MEMORY BUTTONS */}
            <Stack direction="row" sx={{ gap: 1 }}>
              {memoryButtons.map((btn) => (
                <Tooltip key={btn.action} title={btn.tooltip} arrow>
                  <Button
                    onClick={() => handleMemory(btn.action)}
                    disabled={btn.action === "MR" && memory === 0}
                    sx={memoryBtnSx}
                  >
                    {btn.label}
                  </Button>
                </Tooltip>
              ))}
            </Stack>

            {/* SCIENTIFIC BUTTONS */}
            {showScientific && (
              <Box>
                {scientificButtons.map((row, i) => (
                  <Stack direction="row" key={i} sx={{ gap: 1, mb: 1 }}>
                    {row.map((btn) => (
                      <Tooltip key={btn.func} title={btn.tooltip} arrow>
                        <Button
                          onClick={() => handleFunction(btn.func)}
                          sx={functionBtnSx}
                        >
                          {btn.label}
                        </Button>
                      </Tooltip>
                    ))}
                  </Stack>
                ))}
              </Box>
            )}
          </Box>

          {/* RIGHT PANEL — Keypad */}
          <Box
            sx={{
              flex: 1.6,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* AC & DEL */}
            <Stack direction="row" sx={{ gap: 1.5 }}>
              <Tooltip title="Hapus semua (AC)" arrow>
                <Button
                  onClick={handleClear}
                  sx={{
                    ...baseBtnSx,
                    flex: 1,
                    py: 1.5,
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "error.main",
                    bgcolor: alpha(theme.palette.error.main, 0.06),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.14),
                      borderColor: alpha(theme.palette.error.main, 0.3),
                    },
                  }}
                >
                  AC
                </Button>
              </Tooltip>
              <Tooltip title="Hapus (DEL)" arrow>
                <Button
                  onClick={handleDelete}
                  sx={{
                    ...baseBtnSx,
                    flex: 1,
                    py: 1.5,
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "text.secondary",
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.12),
                      color: "secondary.main",
                      borderColor: alpha(theme.palette.secondary.main, 0.25),
                    },
                  }}
                >
                  DEL
                </Button>
              </Tooltip>
            </Stack>

            {/* NUMBER PAD + OPERATORS */}
            <Stack direction="row" sx={{ flex: 1, gap: 1.5 }}>
              {/* NUMBERS */}
              <Box sx={{ flex: 3 }}>
                <Stack spacing={1}>
                  {[
                    ["7", "8", "9"],
                    ["4", "5", "6"],
                    ["1", "2", "3"],
                    ["0", "00", "."],
                  ].map((row, i) => (
                    <Stack direction="row" key={i} sx={{ gap: 1 }}>
                      {row.map((btn) => (
                        <Button
                          key={btn}
                          onClick={() => handleNumber(btn)}
                          sx={numberBtnSx}
                        >
                          {btn}
                        </Button>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {/* OPERATORS + EQUALS */}
              <Stack sx={{ flex: 1 }} spacing={1}>
                {operatorButtons.map((item) => (
                  <Tooltip key={item.op} title={item.tooltip} arrow>
                    <Button
                      onClick={() => handleOperator(item.op)}
                      sx={operatorBtnSx}
                    >
                      {item.label}
                    </Button>
                  </Tooltip>
                ))}
                <Tooltip title="Hitung (=)" arrow>
                  <Button
                    onClick={handleEquals}
                    sx={{
                      flex: 1,
                      py: 1.75,
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: "none",
                      color: "secondary.contrastText",
                      bgcolor: "secondary.main",
                      boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.35)}`,
                      transition: theme.transitions.create(
                        ["background-color", "transform", "box-shadow"],
                        { duration: theme.transitions.duration.shorter }
                      ),
                      "&:hover": {
                        bgcolor: "secondary.dark",
                        boxShadow: `0 6px 20px ${alpha(theme.palette.secondary.main, 0.45)}`,
                      },
                      "&:active": {
                        transform: "scale(0.94)",
                      },
                    }}
                  >
                    =
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Calculator;