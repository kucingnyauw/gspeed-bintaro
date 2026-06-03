import { Calendar, X } from "lucide-react";

import {
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

import { PaymentMethod, PaymentStatus } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";

const PaymentFilterDialog = ({
  onApply,
  onClose,
  onFilterChange,
  onReset,
  open,
  tempFilters,
}) => {

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Filter Pembayaran
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
            <InputLabel>Status</InputLabel>
            <Select
              value={tempFilters.status || ""}
              label="Status"
              onChange={(e) => onFilterChange({ ...tempFilters, status: e.target.value })}
            >
              <MenuItem value="">Semua Status</MenuItem>
              {Object.entries(PaymentStatus).map(([key, value]) => (
                <MenuItem key={key} value={value}>{normalizeEnumText(value)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Metode</InputLabel>
            <Select
              value={tempFilters.method || ""}
              label="Metode"
              onChange={(e) => onFilterChange({ ...tempFilters, method: e.target.value })}
            >
              <MenuItem value="">Semua Metode</MenuItem>
              {Object.entries(PaymentMethod).map(([key, value]) => (
                <MenuItem key={key} value={value}>{normalizeEnumText(value)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <MobileDatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate || null}
            onChange={(val) => onFilterChange({ ...tempFilters, startDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <MobileDatePicker
            label="Sampai Tanggal"
            value={tempFilters.endDate || null}
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

export default PaymentFilterDialog;