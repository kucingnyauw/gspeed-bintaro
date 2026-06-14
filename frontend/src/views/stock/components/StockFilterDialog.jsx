/**
 * StockFilterDialog - Dialog filter untuk halaman mutasi stok.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter
 * @returns {JSX.Element}
 */
import { Calendar, X } from "lucide-react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, IconButton, InputLabel, MenuItem, Select,
  Stack, Typography, useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { StockMovementType, StockSourceType } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";
import { AsyncAutocomplete } from "@components";
import { getProducts } from "@api/productApi.js";
import { useDevice } from "@hooks";

const StockFilterDialog = ({ open, tempFilters, onClose, onFilterChange, onApply, onReset }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Filter Mutasi Stok
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        <Stack sx={{ gap: 3 }}>
          {/* Tipe */}
          <FormControl fullWidth size="medium">
            <InputLabel>Tipe</InputLabel>
            <Select value={tempFilters.type || ""} label="Tipe"
              onChange={(e) => onFilterChange({ ...tempFilters, type: e.target.value })}>
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(StockMovementType).map(([key, value]) => (
                <MenuItem key={key} value={value}>{normalizeEnumText(value)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sumber */}
          <FormControl fullWidth size="medium">
            <InputLabel>Sumber</InputLabel>
            <Select value={tempFilters.sourceType || ""} label="Sumber"
              onChange={(e) => onFilterChange({ ...tempFilters, sourceType: e.target.value })}>
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(StockSourceType).map(([key, value]) => (
                <MenuItem key={key} value={value}>{normalizeEnumText(value)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Produk - Filter hanya SPAREPART */}
          <AsyncAutocomplete
            value={tempFilters.product}
            onChange={(val) => onFilterChange({ ...tempFilters, product: val, productId: val?.id || "" })}
            queryKey={["products-filter-stock"]}
            fetchOptions={async (searchValue) => {
              const res = await getProducts({ page: 1, limit: 10, search: searchValue, type: "SPAREPART" });
              return res?.data || [];
            }}
            getOptionLabel={(o) => o?.name || ""}
            placeholder="Cari produk sparepart..."
            
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box key={key} component="li" {...rest}>
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {option.sku || "—"} · Stok: {option.stock ?? 0}
                    </Typography>
                  </Stack>
                </Box>
              );
            }}
          />

          {/* Dari Tanggal */}
          <DatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate}
            onChange={(val) => onFilterChange({ ...tempFilters, startDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{
              textField: { fullWidth: true, size: "medium" },
              field: { clearable: true },
            }}
          />

          {/* Sampai Tanggal */}
          <DatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate}
            onChange={(val) => onFilterChange({ ...tempFilters, endDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{
              textField: { fullWidth: true, size: "medium" },
              field: { clearable: true },
            }}
          />
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, justifyContent: "space-between" }}>
        <Button color="inherit" variant="outlined" onClick={onReset}
          sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose}
            sx={{ fontWeight: 500, textTransform: "none", borderRadius: br, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}>
            Batal
          </Button>
          <Button variant="contained" onClick={onApply}
            sx={{ fontWeight: 600, textTransform: "none", borderRadius: br, px: 2.5, fontSize: { xs: "0.8125rem", sm: "0.875rem" }, boxShadow: "none" }}>
            Terapkan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default StockFilterDialog;