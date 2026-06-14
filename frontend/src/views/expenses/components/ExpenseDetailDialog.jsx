/**
 * ExpenseDetailDialog - Dialog untuk menampilkan detail pengeluaran.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.expense - Data expense
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { Receipt, X } from "lucide-react";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, Skeleton, Stack, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { expenseCategoryColorMap, ExpenseCategory } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useExpenseDetailQuery } from "@views/expenses/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={140} sx={{ minHeight: 120 }} />
    <Skeleton variant="rounded" height={280} sx={{ minHeight: 240 }} />
  </Stack>
);

const ExpenseDetailDialog = ({ expense, onClose, open }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data: detailData, isLoading } = useExpenseDetailQuery(expense?.id, open);
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
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

      <DialogContent sx={{ pt: 2.5, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: { xs: 2.5, sm: 3 } }}>
            {/* Informasi Pengeluaran */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Informasi Pengeluaran
                </Typography>
                <Stack sx={{ gap: { xs: 1.5, sm: 2 } }}>
                  {[
                    { label: "Judul", value: detailData.title },
                    { label: "Jumlah", value: `-${formatToIdr(detailData.amount)}`, bold: true, color: "error.main" },
                    { label: "Kategori", value: <Chip color={expenseCategoryColorMap[detailData.category] || "default"} label={normalizeEnumText(ExpenseCategory[detailData.category] || detailData.category)} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} /> },
                    { label: "Tanggal", value: formatDateTime(detailData.date) },
                    ...(detailData.description ? [{ label: "Deskripsi", value: detailData.description, wrap: true }] : []),
                  ].map((item, i) => (
                    <Stack key={i} direction="row" sx={{ justifyContent: "space-between", alignItems: item.wrap ? "flex-start" : "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, mr: 2, minWidth: 70 }}>{item.label}</Typography>
                      {typeof item.value === "string" ? (
                        <Typography variant="body2" sx={{ fontWeight: item.bold ? 600 : 500, color: item.color || "text.primary", textAlign: item.wrap ? "right" : "left", maxWidth: item.wrap ? "65%" : "auto", lineHeight: 1.5 }}>
                          {item.value}
                        </Typography>
                      ) : item.value}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Bukti Pembayaran */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: br, overflow: "hidden" }}>
              <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: detailData.receipt?.url ? 2 : 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                  Bukti Pembayaran
                </Typography>
              </Box>
              {detailData.receipt?.url ? (
                <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 } }}>
                  <Box
                    component="img"
                    alt="Bukti Pembayaran"
                    src={detailData.receipt.url}
                    sx={{
                      display: "block", width: "100%",
                      height: { xs: 300, sm: 400, md: 480 },
                      objectFit: "cover", borderRadius: br,
                      bgcolor: alpha(theme.palette.divider, 0.1),
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  py: { xs: 6, sm: 8 }, gap: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.02),
                  mx: { xs: 2.5, sm: 3 }, mb: { xs: 2.5, sm: 3 }, borderRadius: br,
                  minHeight: { xs: 200, sm: 260 },
                }}>
                  <Box sx={{
                    width: { xs: 56, sm: 64 }, height: { xs: 56, sm: 64 },
                    borderRadius: "50%", bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Receipt size={isMobile ? 24 : 28} strokeWidth={1.5} style={{ opacity: 0.25 }} />
                  </Box>
                  <Stack sx={{ gap: 0.5, alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
                      Tidak ada bukti pembayaran
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Dokumen tidak dilampirkan pada pengeluaran ini
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Card>
          </Stack>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, px: 3 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDetailDialog;