/**
 * ShiftFilterDialog - Dialog filter untuk halaman shift.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {Object} props.tempFilters - Nilai filter sementara
 * @param {boolean} [props.hideCashier=false] - Sembunyikan filter kasir
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter
 * @returns {JSX.Element}
 */
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
  useTheme,
} from "@mui/material";

import { getEmployees } from "@api/userApi.js";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { AsyncAutocomplete } from "@components";

const ShiftFilterDialog = ({
  hideCashier = false,
  onApply,
  onClose,
  onFilterChange,
  onReset,
  open,
  tempFilters,
}) => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Dialog 
      fullWidth 
      maxWidth="xs" 
      onClose={onClose} 
      open={open}
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}
    >
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
            Filter Shift
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        <Stack sx={{ gap: 3 }}>
          <FormControl fullWidth size="medium">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={tempFilters.status || ""}
              onChange={(e) => onFilterChange({ ...tempFilters, status: e.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="OPEN">Aktif</MenuItem>
              <MenuItem value="CLOSED">Tutup</MenuItem>
            </Select>
          </FormControl>

          {!hideCashier && (
            <AsyncAutocomplete
              value={tempFilters.cashier}
              onChange={(val) => onFilterChange({ 
                ...tempFilters, 
                cashier: val, 
                cashierId: val?.id || "" 
              })}
              queryKey={["employees-filter-shift"]}
              fetchOptions={async (searchValue) => {
                const res = await getEmployees({ 
                  page: 1, 
                  limit: 10, 
                  search: searchValue, 
                  role: "CASHIER" 
                });
                return res?.data || [];
              }}
              getOptionLabel={(o) => o?.fullName || ""}
              placeholder="Cari kasir..."
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box key={key} component="li" {...rest}>
                    <Stack>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} · {option.isActive ? "Aktif" : "Nonaktif"}
                      </Typography>
                    </Stack>
                  </Box>
                );
              }}
            />
          )}

          <MobileDatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate}
            onChange={(val) => onFilterChange({ ...tempFilters, startDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{
              textField: { fullWidth: true, size: "medium" },
              field: { clearable: true },
            }}
          />

          <MobileDatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate}
            onChange={(val) => onFilterChange({ ...tempFilters, endDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{
              textField: { fullWidth: true, size: "medium" },
              field: { clearable: true },
            }}
          />

          <FormControl fullWidth size="medium">
            <InputLabel>Urut Berdasarkan</InputLabel>
            <Select
              label="Urut Berdasarkan"
              value={tempFilters.sortBy || "openedAt"}
              onChange={(e) => onFilterChange({ ...tempFilters, sortBy: e.target.value })}
            >
              <MenuItem value="openedAt">Waktu Buka</MenuItem>
              <MenuItem value="closedAt">Waktu Tutup</MenuItem>
              <MenuItem value="cashSales">Penjualan Tunai</MenuItem>
              <MenuItem value="discrepancy">Selisih</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="medium">
            <InputLabel>Urutan</InputLabel>
            <Select
              label="Urutan"
              value={tempFilters.sortOrder || "desc"}
              onChange={(e) => onFilterChange({ ...tempFilters, sortOrder: e.target.value })}
            >
              <MenuItem value="desc">Terbaru</MenuItem>
              <MenuItem value="asc">Terlama</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, justifyContent: "space-between" }}>
        <Button 
          color="inherit" 
          variant="outlined" 
          onClick={onReset}
          sx={{ 
            fontWeight: 500, 
            textTransform: "none", 
            borderRadius: br, 
            fontSize: { xs: "0.8125rem", sm: "0.875rem" } 
          }}
        >
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button 
            color="inherit" 
            variant="outlined" 
            onClick={onClose}
            sx={{ 
              fontWeight: 500, 
              textTransform: "none", 
              borderRadius: br, 
              fontSize: { xs: "0.8125rem", sm: "0.875rem" } 
            }}
          >
            Batal
          </Button>
          <Button 
            variant="contained" 
            onClick={onApply}
            sx={{ 
              fontWeight: 600, 
              textTransform: "none", 
              borderRadius: br, 
              px: 2.5, 
              fontSize: { xs: "0.8125rem", sm: "0.875rem" }, 
              boxShadow: "none" 
            }}
          >
            Terapkan
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftFilterDialog;