/**
 * PosHeader - Header untuk halaman POS dengan view mode toggle (kiri), search + filter + refresh (kanan).
 *
 * @component
 * @param {Object} props
 * @param {string} props.viewMode - Mode tampilan ("grid" | "table")
 * @param {Function} props.onViewModeChange - Handler ubah mode tampilan
 * @param {string} props.searchVal - Nilai pencarian
 * @param {Function} props.onSearchChange - Handler perubahan pencarian
 * @param {Function} props.onOpenFilter - Handler buka filter
 * @param {Function} props.onRefresh - Handler refresh data
 * @returns {JSX.Element}
 */
import {
  Box,
  Card,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LayoutGrid, List, ListFilter, RotateCcw, Search, X } from "lucide-react";

const PosHeader = ({
  viewMode = "grid",
  onViewModeChange,
  searchVal = "",
  onSearchChange,
  onOpenFilter,
  onRefresh,
}) => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Card
    
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          px: 2.5,
          py: 2,
        }}
      >
        {/* Left: View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          size="small"
          onChange={(e, value) => value && onViewModeChange?.(value)}
          sx={{
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              borderRadius: br,
              px: 2,
              py: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.8125rem",
              transition: theme.transitions.create(
                ["background-color", "border-color", "color"],
                { duration: theme.transitions.duration.shorter }
              ),
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                color: "secondary.main",
                borderColor: alpha(theme.palette.secondary.main, 0.25),
              },
              "&:hover": {
                bgcolor: alpha(theme.palette.secondary.main, 0.04),
              },
            },
          }}
        >
          <ToggleButton value="grid">
            <LayoutGrid size={15} strokeWidth={1.5} style={{ marginRight: 6 }} />
            Grid
          </ToggleButton>
          <ToggleButton value="table">
            <List size={15} strokeWidth={1.5} style={{ marginRight: 6 }} />
            Tabel
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Right: Search + Filter + Refresh */}
        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
          {/* Search */}
          <TextField
            size="small"
            value={searchVal}
            onChange={onSearchChange}
            placeholder="Cari produk..."
            sx={{
              minWidth: 200,
              maxWidth: 280,
              "& .MuiOutlinedInput-root": {
                borderRadius: br,
                bgcolor: alpha(theme.palette.secondary.main, 0.03),
                "& fieldset": { borderColor: alpha(theme.palette.divider, 0.4) },
                "&:hover fieldset": { borderColor: alpha(theme.palette.secondary.main, 0.2) },
                "&.Mui-focused fieldset": {
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  borderWidth: 1,
                },
              },
              "& .MuiOutlinedInput-input": {
                py: 1,
                fontSize: "0.875rem",
                "&::placeholder": { color: "text.disabled", opacity: 0.7 },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 24,
                        borderRadius: br,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        color: "secondary.main",
                      }}
                    >
                      <Search size={14} strokeWidth={1.5} />
                    </Box>
                  </InputAdornment>
                ),
                endAdornment: searchVal ? (
                  <InputAdornment position="end">
                    <Tooltip title="Hapus pencarian">
                      <Box
                        component="span"
                        onClick={() => onSearchChange?.({ target: { value: "" } })}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          cursor: "pointer",
                          color: "text.secondary",
                          transition: theme.transitions.create(
                            ["background-color", "color"],
                            { duration: theme.transitions.duration.shorter }
                          ),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            color: "error.main",
                          },
                        }}
                      >
                        <X size={14} strokeWidth={1.5} />
                      </Box>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          {/* Filter */}
          <Tooltip title="Filter produk" placement="bottom" arrow>
            <Stack
              component="span"
              onClick={onOpenFilter}
              aria-label="Filter produk"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: br,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                color: "text.secondary",
                cursor: "pointer",
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  color: "secondary.main",
                },
              }}
            >
              <ListFilter size={15} strokeWidth={1.5} />
            </Stack>
          </Tooltip>

          {/* Refresh */}
          <Tooltip title="Refresh data" placement="bottom" arrow>
            <Stack
              component="span"
              onClick={onRefresh}
              aria-label="Refresh data"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: br,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                color: "text.secondary",
                cursor: "pointer",
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  color: "secondary.main",
                },
              }}
            >
              <RotateCcw size={15} strokeWidth={1.5} />
            </Stack>
          </Tooltip>
        </Stack>
      </Stack>
    </Card>
  );
};

export default PosHeader;