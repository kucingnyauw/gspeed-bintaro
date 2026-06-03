import { Calendar, X } from "lucide-react";

import {
  Box,
  Button,
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
  Typography,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { StockMovementType, StockSourceType } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";
import { AsyncAutocomplete } from "@components";
import { getProducts } from "@api/productApi.js";

const StockFilterDialog = ({
  open,
  tempFilters,
  onClose,
  onFilterChange,
  onApply,
  onReset,
}) => {

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Filter Mutasi Stok
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Stack sx={{ gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Tipe</InputLabel>
            <Select
              value={tempFilters.type || ""}
              label="Tipe"
              onChange={(e) => onFilterChange({ ...tempFilters, type: e.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(StockMovementType).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Sumber</InputLabel>
            <Select
              value={tempFilters.sourceType || ""}
              label="Sumber"
              onChange={(e) => onFilterChange({ ...tempFilters, sourceType: e.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(StockSourceType).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <AsyncAutocomplete
            value={tempFilters.product}
            onChange={(val) =>
              onFilterChange({
                ...tempFilters,
                product: val,
                productId: val?.id || "",
              })
            }
            queryKey={["products-filter-stock"]}
            fetchOptions={async (searchValue) => {
              const res = await getProducts({
                page: 1,
                limit: 10,
                search: searchValue,
              });
              return res?.data || [];
            }}
            getOptionLabel={(o) => o?.name || ""}
            placeholder="Cari produk..."
            minSearch={2}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box key={key} component="li" {...rest}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {option.sku || "—"} • Stok: {option.stock ?? 0}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          <DatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate}
            onChange={(val) => onFilterChange({ ...tempFilters, startDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <DatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate}
            onChange={(val) => onFilterChange({ ...tempFilters, endDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5, justifyContent: "space-between" }}>
        <Button color="inherit" variant="outlined" onClick={onReset}>
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            Batal
          </Button>
          <Button variant="contained" onClick={onApply}>
            Terapkan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default StockFilterDialog;