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

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={140} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const ExpenseDetailDialog = ({ expense, onClose, open }) => {
  const theme = useTheme();
  const { data: detailData, isLoading } = useExpenseDetailQuery(expense?.id, open);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Pengeluaran
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: 3 }}>
            {/* Informasi Pengeluaran */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5 }}>
                  Informasi Pengeluaran
                </Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Judul</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{detailData.title}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
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
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                    <Typography variant="body2">{formatDateTime(detailData.date)}</Typography>
                  </Stack>
                  {detailData.description && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Deskripsi</Typography>
                      <Typography variant="body2" sx={{ maxWidth: "60%", textAlign: "right" }}>{detailData.description}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Card>

            {/* Bukti Pembayaran */}
            <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, boxShadow: "none", borderRadius: `${theme.shape.borderRadius}px` }}>
              <Box sx={{ p: 3, pb: detailData.receipt?.url ? 2 : 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Bukti Pembayaran
                </Typography>
              </Box>
              {detailData.receipt?.url ? (
                <Box sx={{ px: 3, pb: 3 }}>
                  <Box
                    component="img"
                    alt="Bukti Pembayaran"
                    src={detailData.receipt.url}
                    sx={{ display: "block", width: "100%", height: 280, objectFit: "cover", borderRadius: `${theme.shape.borderRadius}px` }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.02), mx: 3, mb: 3, borderRadius: `${theme.shape.borderRadius}px` }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(theme.palette.secondary.main, 0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Receipt size={24} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">Tidak ada bukti pembayaran</Typography>
                </Box>
              )}
            </Card>
          </Stack>
        ) : null}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDetailDialog;