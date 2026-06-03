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
  TextField,
  Typography,
} from "@mui/material";

const PosProductFilterDialog = ({
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
            Filter Produk
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
            <Select label="Tipe" onChange={(e) => onFilterChange({ ...tempFilters, type: e.target.value })} value={tempFilters.type || ""}>
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="SPAREPART">Sparepart</MenuItem>
              <MenuItem value="SERVICE">Servis</MenuItem>
            </Select>
          </FormControl>

          <TextField fullWidth label="Harga Minimal" onChange={(e) => onFilterChange({ ...tempFilters, minPrice: e.target.value })} type="number" value={tempFilters.minPrice || ""} slotProps={{ htmlInput: { min: 0 } }} />

          <TextField fullWidth label="Harga Maksimal" onChange={(e) => onFilterChange({ ...tempFilters, maxPrice: e.target.value })} type="number" value={tempFilters.maxPrice || ""} slotProps={{ htmlInput: { min: 0 } }} />

          <FormControl fullWidth>
            <InputLabel>Urutkan</InputLabel>
            <Select label="Urutkan" onChange={(e) => onFilterChange({ ...tempFilters, sortBy: e.target.value })} value={tempFilters.sortBy || ""}>
              <MenuItem value="createdAt">Terbaru</MenuItem>
              <MenuItem value="name">Nama</MenuItem>
              <MenuItem value="price">Harga</MenuItem>
              <MenuItem value="stock">Stok</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Arah</InputLabel>
            <Select label="Arah" onChange={(e) => onFilterChange({ ...tempFilters, sortOrder: e.target.value })} value={tempFilters.sortOrder || ""}>
              <MenuItem value="desc">Turun</MenuItem>
              <MenuItem value="asc">Naik</MenuItem>
            </Select>
          </FormControl>
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

export default PosProductFilterDialog;