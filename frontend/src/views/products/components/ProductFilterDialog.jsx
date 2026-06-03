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

const ProductFilterDialog = ({
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
            <Select
              label="Tipe"
              value={tempFilters.type || ""}
              onChange={(e) => onFilterChange({ ...tempFilters, type: e.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="SPAREPART">Sparepart</MenuItem>
              <MenuItem value="SERVICE">Servis</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={tempFilters.isActive || ""}
              onChange={(e) => onFilterChange({ ...tempFilters, isActive: e.target.value })}
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="true">Aktif</MenuItem>
              <MenuItem value="false">Nonaktif</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Harga Minimal"
            type="number"
            value={tempFilters.minPrice || ""}
            onChange={(e) => onFilterChange({ ...tempFilters, minPrice: e.target.value })}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            fullWidth
            label="Harga Maksimal"
            type="number"
            value={tempFilters.maxPrice || ""}
            onChange={(e) => onFilterChange({ ...tempFilters, maxPrice: e.target.value })}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            fullWidth
            label="Stok di Bawah"
            type="number"
            value={tempFilters.lowStockThreshold || ""}
            onChange={(e) => onFilterChange({ ...tempFilters, lowStockThreshold: e.target.value })}
            placeholder="Threshold stok rendah"
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <FormControl fullWidth>
            <InputLabel>Urutkan</InputLabel>
            <Select
              label="Urutkan"
              value={tempFilters.sortBy || ""}
              onChange={(e) => onFilterChange({ ...tempFilters, sortBy: e.target.value })}
            >
              <MenuItem value="createdAt">Terbaru</MenuItem>
              <MenuItem value="name">Nama</MenuItem>
              <MenuItem value="price">Harga</MenuItem>
              <MenuItem value="stock">Stok</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Arah</InputLabel>
            <Select
              label="Arah"
              value={tempFilters.sortOrder || ""}
              onChange={(e) => onFilterChange({ ...tempFilters, sortOrder: e.target.value })}
            >
              <MenuItem value="desc">Turun</MenuItem>
              <MenuItem value="asc">Naik</MenuItem>
            </Select>
          </FormControl>
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

export default ProductFilterDialog;