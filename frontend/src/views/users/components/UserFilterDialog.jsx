/**
 * UserFilterDialog - Dialog filter untuk data karyawan berdasarkan status keaktifan.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Status dialog terbuka/tutup
 * @param {Object} props.tempFilters - Object filter sementara
 * @param {string} [props.tempFilters.isActive] - Filter status keaktifan ("" | "true" | "false")
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter sementara
 * @param {Function} props.onApply - Handler terapkan filter
 * @param {Function} props.onReset - Handler reset filter ke default
 * @returns {JSX.Element} Dialog filter karyawan
 */
import { X } from "lucide-react";

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

/**
 * UserFilterDialog - Dialog untuk memfilter data karyawan berdasarkan status.
 *
 * Fitur:
 * - Filter status: Semua, Aktif, Nonaktif
 * - Placeholder Select yang menampilkan label dengan benar
 * - Tombol Reset untuk mengembalikan ke default
 * - Tombol Batal dan Terapkan
 *
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog
 * @param {Object} props.tempFilters - Filter sementara
 * @param {string} [props.tempFilters.isActive] - Status filter
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onFilterChange - Handler perubahan filter
 * @param {Function} props.onApply - Handler apply filter
 * @param {Function} props.onReset - Handler reset filter
 * @returns {JSX.Element} Dialog filter
 */
const UserFilterDialog = ({
  open,
  tempFilters,
  onClose,
  onFilterChange,
  onApply,
  onReset,
}) => {
  /**
   * Normalisasi nilai Select dari tempFilters.
   * Konversi string/boolean ke string Select yang valid.
   *
   * @type {string}
   */
  const selectValue = tempFilters.isActive ?? "";

  /**
   * Handler perubahan Select status.
   * Menyimpan nilai sebagai string ke tempFilters.
   *
   * @param {Object} event - Event perubahan Select
   * @param {string} event.target.value - Nilai yang dipilih
   */
  const handleChange = (event) => {
    const val = event.target.value;
    onFilterChange({
      ...tempFilters,
      isActive: val,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Filter Karyawan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={selectValue}
            label="Status"
            onChange={handleChange}
          >
            <MenuItem value="">
              <Typography color="text.secondary">Semua</Typography>
            </MenuItem>
            <MenuItem value="true">Aktif</MenuItem>
            <MenuItem value="false">Nonaktif</MenuItem>
          </Select>
        </FormControl>
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

export default UserFilterDialog;