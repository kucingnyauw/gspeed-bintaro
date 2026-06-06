/**
 * OrderFilterDialog - Dialog filter untuk data pesanan.
 *
 * Fitur:
 * - Filter berdasarkan status pesanan
 * - Pencarian pelanggan dengan AsyncAutocomplete (debounced)
 * - Filter rentang tanggal (Dari/Sampai)
 * - Tombol Reset, Batal, dan Terapkan
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka/tutup
 * @param {Object} props.tempFilters - Object filter sementara
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter ke default
 * @returns {JSX.Element} Dialog filter pesanan
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
} from "@mui/material";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { getCustomers } from "@api/customerApi.js";
import { AsyncAutocomplete } from "@components";
import { OrderStatus } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils/utils.js";

const OrderFilterDialog = ({
  onApply,
  onClose,
  onFilterChange,
  onReset,
  open,
  tempFilters,
}) => {
  /**
   * Handler perubahan customer.
   *
   * @param {Object|null} val - Customer yang dipilih
   */
  const handleCustomerChange = (val) => {
    onFilterChange({ ...tempFilters, customer: val });
  };

  /**
   * Handler perubahan status.
   *
   * @param {Object} e - Event change Select
   */
  const handleStatusChange = (e) => {
    onFilterChange({ ...tempFilters, status: e.target.value });
  };

  /**
   * Handler perubahan tanggal mulai.
   *
   * @param {Date|null} val - Tanggal yang dipilih
   */
  const handleStartDateChange = (val) => {
    onFilterChange({ ...tempFilters, startDate: val });
  };

  /**
   * Handler perubahan tanggal akhir.
   *
   * @param {Date|null} val - Tanggal yang dipilih
   */
  const handleEndDateChange = (val) => {
    onFilterChange({ ...tempFilters, endDate: val });
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Filter Pesanan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Stack sx={{ gap: 3 }}>
          {/* Status Filter */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={tempFilters.status || ""}
              onChange={handleStatusChange}
              label="Status"
            >
              <MenuItem value="">Semua Status</MenuItem>
              {Object.entries(OrderStatus).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {normalizeEnumText(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Customer Search */}
          <AsyncAutocomplete
            value={tempFilters.customer || null}
            onChange={handleCustomerChange}
            queryKey={["customers-filter"]}
            fetchOptions={async (search) => {
              const res = await getCustomers({
                page: 1,
                limit: 10,
                search: search || "",
              });
              return res?.data || [];
            }}
            getOptionLabel={(o) => o?.name || ""}
            placeholder="Cari pelanggan..."
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {option.phone || "Tanpa nomor telepon"}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          {/* Start Date */}
          <MobileDatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate || null}
            onChange={handleStartDateChange}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          {/* End Date */}
          <MobileDatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate || null}
            onChange={handleEndDateChange}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
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

export default OrderFilterDialog;