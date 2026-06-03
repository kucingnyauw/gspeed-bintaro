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

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { ExpenseCategory } from "@shared/constant";
import { normalizeEnumText } from "@shared/utils";

const ExpenseFilterDialog = ({
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
            Filter Pengeluaran
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
            <InputLabel>Kategori</InputLabel>
            <Select
              value={tempFilters.category || ""}
              label="Kategori"
              onChange={(e) => onFilterChange({ ...tempFilters, category: e.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(ExpenseCategory).map(([key, value]) => (
                <MenuItem key={key} value={value}>{normalizeEnumText(value)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Dari Tanggal"
            value={tempFilters.startDate || null}
            onChange={(val) => onFilterChange({ ...tempFilters, startDate: val })}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <DatePicker
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
        <Button color="inherit" variant="outlined" onClick={onReset}>Reset</Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose}>Batal</Button>
          <Button variant="contained" onClick={onApply}>Terapkan</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseFilterDialog;