import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

const TaskActionDialog = ({ dialog, isLoading, onClose, onConfirm }) => {
  const isStart = dialog.type === "start";

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isLoading ? undefined : onClose}
      open={dialog.open}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {isStart ? "Mulai Tugas" : "Selesaikan Tugas"}
          </Typography>
          <IconButton onClick={onClose} disabled={isLoading} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
          {isStart
            ? "Anda akan memulai pengerjaan tugas ini."
            : "Anda akan menyelesaikan pengerjaan tugas ini."}
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isLoading} onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={() => onConfirm(dialog.task)}
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isLoading ? "Memproses..." : isStart ? "Mulai" : "Selesaikan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskActionDialog;