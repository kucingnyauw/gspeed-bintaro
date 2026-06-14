/**
 * StockOutDialog - Dialog untuk mencatat stok keluar.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { useCallback } from "react";
import { Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { getProducts } from "@api/productApi.js";
import { ProductType, StockSourceType } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";
import { useRecordStockOutMutation, useStockForm } from "@views/stock/hooks";
import { AsyncAutocomplete } from "@components";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const StockOutDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { control, handleSubmit, setValue, reset } = useStockForm();
  const br = `${theme.shape.borderRadius}px`;

  const recordMutation = useRecordStockOutMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Stok keluar berhasil dicatat",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      reset();
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal mencatat stok keluar",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = recordMutation.isPending;

  const onSubmit = useCallback(
    (formData) => {
      recordMutation.mutate({
        productId: formData.product?.id || formData.productId,
        quantity: Number(formData.quantity),
        note: formData.note || undefined,
        sourceType: formData.sourceType,
      });
    },
    [recordMutation]
  );

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isSubmitting ? undefined : handleClose}
      open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}
    >
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}
          >
            Stok Keluar
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={isSubmitting}
            size="small"
            sx={{ mr: -0.5 }}
          >
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        <Stack sx={{ gap: 3 }}>
          <Controller
            name="product"
            control={control}
            rules={{ required: "Produk wajib dipilih" }}
            render={({ field, fieldState }) => (
              <AsyncAutocomplete
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  setValue("productId", val?.id || "");
                }}
                queryKey={["products-stock-out"]}
                fetchOptions={async (searchValue) => {
                  const res = await getProducts({
                    page: 1,
                    limit: 10,
                    search: searchValue,
                    type: ProductType.SPAREPART,
                  });
                  return res?.data || [];
                }}
                getOptionLabel={(o) => o?.name || ""}
                placeholder="Cari produk sparepart..."
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <Box key={key} component="li" {...rest}>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {option.sku || "—"} · Stok: {option.stock ?? 0}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                }}
              />
            )}
          />

          <Controller
            name="quantity"
            control={control}
            rules={{
              required: "Jumlah wajib diisi",
              min: { value: 1, message: "Minimal 1" },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                size="medium"
                label="Jumlah"
                type="number"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={isSubmitting}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            )}
          />

          <Controller
            name="sourceType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="medium" disabled={isSubmitting}>
                <InputLabel>Sumber</InputLabel>
                <Select {...field} label="Sumber">
                  {Object.entries(StockSourceType)
                    .filter(([key]) => !["PURCHASE", "RETURN"].includes(key))
                    .map(([key, value]) => (
                      <MenuItem key={key} value={value}>
                        {normalizeEnumText(value)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="medium"
                label="Catatan"
                placeholder="Catatan (opsional)"
                multiline
                rows={3}
                disabled={isSubmitting}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          justifyContent: "space-between",
        }}
      >
        <Button
          color="inherit"
          variant="outlined"
          disabled={isSubmitting}
          onClick={handleClose}
          sx={{
            fontWeight: 500,
            textTransform: "none",
            borderRadius: br,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          }}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            fontWeight: 600,
            textTransform: "none",
            borderRadius: br,
            px: 2.5,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            boxShadow: "none",
          }}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockOutDialog;
