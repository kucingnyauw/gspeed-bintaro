/**
 * ExpenseDetailDialog - Dialog untuk menampilkan detail pengeluaran.
 *
 * Menampilkan:
 * - Bukti pembayaran (gambar besar di atas, atau empty state)
 * - Informasi pengeluaran (judul, jumlah, kategori, tanggal, deskripsi)
 *
 * @component
 * @param {Object} props
 * @param {Object} props.expense - Data expense
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element} Dialog detail pengeluaran
 */
import { Receipt, X } from "lucide-react";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { expenseCategoryColorMap, ExpenseCategory } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useExpenseDetailQuery } from "@views/expenses/hooks";
import { useDevice } from "@hooks";

/**
 * DetailSkeleton - Skeleton loading untuk konten detail.
 *
 * @returns {JSX.Element} Skeleton placeholder
 */
const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={360} />
    <Skeleton variant="rounded" height={140} />
  </Stack>
);

const ExpenseDetailDialog = ({ expense, onClose, open }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();

  /**
   * Fetch detail pengeluaran. Hanya fetch jika dialog terbuka & ada ID.
   */
  const { data: detailData, isLoading } = useExpenseDetailQuery(expense?.id, open);

  /** @type {string} */
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : br,
            overflow: "hidden",
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Detail Pengeluaran
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: 3 }}>
            {/* Bukti Pembayaran - Posisi pertama, tinggi besar */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
                overflow: "hidden",
              }}
            >
              {detailData.receipt?.url ? (
                <Box
                  component="img"
                  alt="Bukti Pembayaran"
                  src={detailData.receipt.url}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: { xs: 320, sm: 420, md: 500 },
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: { xs: 8, sm: 10 },
                    gap: 2.5,
                    bgcolor: alpha(theme.palette.secondary.main, 0.02),
                    minHeight: { xs: 280, sm: 360 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 64, sm: 72 },
                      height: { xs: 64, sm: 72 },
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Receipt size={isMobile ? 28 : 32} strokeWidth={1.5} style={{ opacity: 0.2 }} />
                  </Box>
                  <Stack sx={{ gap: 0.5, alignItems: "center", textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Tidak ada bukti pembayaran
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Dokumen tidak dilampirkan pada pengeluaran ini
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Card>

            {/* Informasi Pengeluaran */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5, fontSize: "0.875rem" }}>
                  Informasi Pengeluaran
                </Typography>

                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Judul</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.title}</Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Jumlah</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
                      -{formatToIdr(detailData.amount)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Kategori</Typography>
                    <Chip
                      color={expenseCategoryColorMap[detailData.category] || "default"}
                      label={normalizeEnumText(ExpenseCategory[detailData.category] || detailData.category)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                    />
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDateTime(detailData.date)}</Typography>
                  </Stack>

                  {detailData.description && (
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, mr: 2 }}>Deskripsi</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right", lineHeight: 1.5 }}>
                        {detailData.description}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Card>
          </Stack>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, px: 3 }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDetailDialog;