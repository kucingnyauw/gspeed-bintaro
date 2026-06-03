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
    borderRadius: `${theme.shape.borderRadius}px`,
    transition: theme.transitions.create(
      ["background-color", "transform"],
      { duration: theme.transitions.duration.shorter }
    ),
    "&:active": {
      transform: "scale(0.95)",
    },
  };

  const numberBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 1.5,
    fontSize: "1.125rem",
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.palette.text.primary,
    bgcolor: "transparent",
    "&:hover": {
      bgcolor: theme.palette.action.hover,
    },
  };

  const operatorBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 1.5,
    fontSize: "1.25rem",
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.secondary.main,
    bgcolor: alpha(theme.palette.secondary.main, 0.06),
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.12),
    },
  };

  const functionBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 0.75,
    fontSize: "0.75rem",
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.secondary,
    bgcolor: "transparent",
    "&:hover": {
      bgcolor: theme.palette.action.hover,
      color: theme.palette.secondary.main,
    },
  };

  const memoryBtnSx = {
    ...baseBtnSx,
    flex: 1,
    py: 0.5,
    fontSize: "0.6875rem",
    fontWeight: theme.typography.fontWeightMedium,
    color: memory !== 0 ? theme.palette.secondary.main : theme.palette.text.disabled,
    bgcolor: "transparent",
    "&:hover": {
      bgcolor: theme.palette.action.hover,
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
        bgcolor: alpha(theme.palette.common.black, 0.3),
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "92vw", sm: 680 },
          maxWidth: 680,
          borderRadius: `${theme.shape.borderRadius * 1.5}px`,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[12],
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: theme.spacing(2.5),
            py: theme.spacing(1.5),
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: theme.palette.success.main,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: theme.typography.fontWeightBold,
                color: theme.palette.text.primary,
                fontSize: "0.8125rem",
              }}
            >
              Kalkulator
            </Typography>
            {memory !== 0 && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.125,
                  borderRadius: `${theme.shape.borderRadius / 2}px`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: theme.typography.fontWeightBold,
                    fontSize: "0.625rem",
                  }}
                >
                  M
                </Typography>
              </Box>
            )}
          </Stack>
          <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
            <Tooltip title={showScientific ? "Sembunyikan fungsi ilmiah" : "Tampilkan fungsi ilmiah"} arrow>
              <Button
                onClick={toggleScientific}
                sx={{
                  ...baseBtnSx,
                  px: 1.5,
                  py: 0.25,
                  fontSize: "0.75rem",
                  fontWeight: theme.typography.fontWeightBold,
                  color: showScientific ? theme.palette.secondary.main : theme.palette.text.secondary,
                  bgcolor: showScientific ? alpha(theme.palette.secondary.main, 0.08) : "transparent",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  },
                }}
              >
                fx
              </Button>
            </Tooltip>
            <Tooltip title="Tutup kalkulator" arrow>
              <IconButton
                onClick={onClose}
                size="small"
                aria-label="Tutup kalkulator"
                sx={{
                  width: 26,
                  height: 26,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.text.primary,
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <X size={15} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }}>
          <Box
            sx={{
              flex: 1,
              p: theme.spacing(2.5),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderRight: { sm: `1px solid ${theme.palette.divider}` },
              bgcolor: alpha(theme.palette.background.default, 0.3),
            }}
          >
            <Box
              sx={{
                p: theme.spacing(3),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 1,
                minHeight: 120,
              }}
            >
              {expression && (
                <Typography
                  sx={{
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    fontSize: "0.8125rem",
                    color: theme.palette.text.secondary,
                    opacity: 0.7,
                    lineHeight: 1.4,
                  }}
                >
                  {expression.replace(/\*/g, "×").replace(/\//g, "÷")}
                </Typography>
              )}
              <Typography
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  letterSpacing: "-0.01em",
                  color: display === "Error" ? theme.palette.error.main : theme.palette.text.primary,
                  wordBreak: "break-all",
                  fontSize: display.length > 10 ? "1.5rem" : "2rem",
                  lineHeight: 1.2,
                  fontFamily: "monospace",
                }}
              >
                {formatDisplay(display)}
              </Typography>
            </Box>

            <Stack direction="row" sx={{ gap: 0.5, mt: 2 }}>
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

            {showScientific && (
              <Box sx={{ mt: 1 }}>
                {scientificButtons.map((row, i) => (
                  <Stack direction="row" key={i} sx={{ gap: 0.5, mb: 0.5 }}>
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

          <Box
            sx={{
              flex: 1.6,
              p: theme.spacing(2.5),
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack direction="row" sx={{ gap: 1, mb: 1.5 }}>
              <Tooltip title="Hapus semua" arrow>
                <Button
                  onClick={handleClear}
                  sx={{
                    ...baseBtnSx,
                    flex: 1,
                    py: 1.25,
                    fontSize: "0.8125rem",
                    fontWeight: theme.typography.fontWeightBold,
                    color: theme.palette.error.main,
                    bgcolor: alpha(theme.palette.error.main, 0.06),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.12),
                    },
                  }}
                >
                  AC
                </Button>
              </Tooltip>
              <Tooltip title="Hapus satu karakter" arrow>
                <Button
                  onClick={handleDelete}
                  sx={{
                    ...baseBtnSx,
                    flex: 1,
                    py: 1.25,
                    fontSize: "0.8125rem",
                    fontWeight: theme.typography.fontWeightBold,
                    color: theme.palette.text.secondary,
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                    },
                  }}
                >
                  DEL
                </Button>
              </Tooltip>
            </Stack>

            <Stack direction="row" sx={{ flex: 1, gap: 1 }}>
              <Box sx={{ flex: 3 }}>
                <Stack spacing={0.75}>
                  {[
                    ["7", "8", "9"],
                    ["4", "5", "6"],
                    ["1", "2", "3"],
                    ["0", "00", "."],
                  ].map((row, i) => (
                    <Stack direction="row" key={i} sx={{ gap: 0.75 }}>
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
              <Stack sx={{ flex: 1 }} spacing={0.75}>
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
                <Tooltip title="Hitung hasil" arrow>
                  <Button
                    onClick={handleEquals}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      fontSize: "1.5rem",
                      fontWeight: theme.typography.fontWeightBold,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      textTransform: "none",
                      color: theme.palette.secondary.contrastText,
                      bgcolor: theme.palette.secondary.main,
                      transition: theme.transitions.create(
                        ["background-color", "transform"],
                        { duration: theme.transitions.duration.shorter }
                      ),
                      "&:hover": {
                        bgcolor: theme.palette.secondary.dark,
                      },
                      "&:active": {
                        transform: "scale(0.95)",
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