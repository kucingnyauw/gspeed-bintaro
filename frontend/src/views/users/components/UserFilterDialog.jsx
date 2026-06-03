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

const UserFilterDialog = ({
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
            Filter Karyawan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={tempFilters.isActive || ""}
            label="Status"
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({ ...tempFilters, isActive: val === "" ? "" : val === "true" });
            }}
          >
            <MenuItem value="">Semua</MenuItem>
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