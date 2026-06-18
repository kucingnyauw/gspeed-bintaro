/**
 * PosPagination - Komponen pagination + rows per page untuk halaman POS.
 * Dibungkus Card dengan styling konsisten seperti PosHeader.
 *
 * @component
 * @param {Object} props
 * @param {number} props.page - Halaman saat ini
 * @param {number} props.totalPages - Total halaman
 * @param {number} props.totalItems - Total item
 * @param {number} props.itemsPerPage - Item per halaman
 * @param {number[]} [props.rowsPerPageOptions=[10, 20, 50]] - Opsi rows per page
 * @param {Function} props.onPageChange - Handler ganti halaman
 * @param {Function} props.onRowsPerPageChange - Handler ganti rows per page
 * @param {boolean} [props.isLoading=false] - Status loading
 * @returns {JSX.Element}
 */
import {
  Box,
  Card,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDevice } from "@hooks";

const PosPagination = ({
  page = 1,
  totalPages = 0,
  totalItems = 0,
  itemsPerPage = 10,
  rowsPerPageOptions = [10, 20, 50],
  onPageChange,
  onRowsPerPageChange,
  isLoading = false,
}) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Card>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 2, sm: 3 },
          flexWrap: "wrap",
          px: 2.5,
          py: 2,
        }}
      >
        {/* Rows per page */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          {!isMobile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ whiteSpace: "nowrap", fontWeight: 500 }}
            >
              Baris per halaman
            </Typography>
          )}
          <TextField
            select
            size="small"
            value={itemsPerPage}
            onChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}
            slotProps={{ select: { native: true } }}
            sx={{
              minWidth: 80,
              "& .MuiOutlinedInput-root": {
                borderRadius: br,
                bgcolor: alpha(theme.palette.secondary.main, 0.03),
                "& fieldset": {
                  borderColor: alpha(theme.palette.divider, 0.4),
                },
                "&:hover fieldset": {
                  borderColor: alpha(theme.palette.secondary.main, 0.2),
                },
                "&.Mui-focused fieldset": {
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  borderWidth: 1,
                },
              },
              "& .MuiNativeSelect-select": {
                py: 1,
                pl: 1.5,
                pr: 3,
                fontSize: "0.875rem",
              },
            }}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
        </Stack>

        {/* Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {isLoading ? (
            <Skeleton
              height={36}
              variant="rounded"
              width={isMobile ? 200 : 260}
              sx={{ borderRadius: br }}
            />
          ) : (
            <Pagination
              count={totalPages || 1}
              page={page}
              onChange={(event, value) => onPageChange?.(value)}
              showFirstButton={!isMobile}
              showLastButton={!isMobile}
              shape="rounded"
              size={isMobile ? "medium" : "small"}
              siblingCount={isMobile ? 0 : 1}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontSize: "0.875rem",
                  minWidth: { xs: 30, sm: 32 },
                  height: { xs: 30, sm: 32 },
                  borderRadius: br,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  bgcolor: "background.paper",
                  color: "text.secondary",
                  transition: theme.transitions.create(
                    ["background-color", "border-color", "color", "box-shadow"],
                    { duration: theme.transitions.duration.shorter }
                  ),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    color: theme.palette.secondary.main,
                  },
                  "&.Mui-selected": {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    borderColor: theme.palette.secondary.main,
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${alpha(
                      theme.palette.secondary.main,
                      0.3
                    )}`,
                    "&:hover": { bgcolor: theme.palette.secondary.dark },
                  },
                },
                "& .MuiPaginationItem-ellipsis": {
                  border: "none",
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "transparent" },
                },
                "& .MuiPagination-ul": { gap: { xs: 0.5, sm: 0.5 } },
              }}
            />
          )}
        </Box>
      </Stack>
    </Card>
  );
};

export default PosPagination;
