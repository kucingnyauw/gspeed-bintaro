import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Upload, X } from "lucide-react";
import { Controller } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
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
import { alpha, useTheme } from "@mui/material/styles";

import { ExpenseCategory } from "@shared/constant";
import { formatToIdr, normalizeEnumText } from "@shared/utils";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useExpenseForm,
} from "@views/expenses/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const ExpenseFormDialog = ({ mode, onClose, open, selectedExpense }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useExpenseForm();

  const receiptValue = watch("receipt");

  const createMutation = useCreateExpenseMutation({
    onSuccess: (data) => {
      dispatch(showNotification({ message: `Pengeluaran "${data?.title || "baru"}" berhasil dicatat`, type: "success", title: "Berhasil", variant: "snackbar", autoHide: 3000 }));
      onClose?.();
    },
    onError: (error) => {
      dispatch(showNotification({ message: error?.message || "Gagal mencatat pengeluaran", type: "error", title: "Error", variant: "snackbar", autoHide: 5000 }));
    },
  });

  const updateMutation = useUpdateExpenseMutation({
    onSuccess: (data) => {
      dispatch(showNotification({ message: `Pengeluaran "${data?.title || "baru"}" berhasil diperbarui`, type: "success", title: "Berhasil", variant: "snackbar", autoHide: 3000 }));
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(showNotification({ message: error?.message || "Gagal memperbarui pengeluaran", type: "error", title: "Error", variant: "snackbar", autoHide: 5000 }));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const displayImage = receiptValue instanceof File ? previewUrl : receiptValue;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (open && !isSubmitting) {
      if (mode === "update" && selectedExpense) {
        const existingUrl = selectedExpense.receipt?.url || null;
        setPreviewUrl(null);
        reset({
          title: selectedExpense.title || "",
          amount: selectedExpense.amount || "",
          category: selectedExpense.category || "OTHER",
          description: selectedExpense.description || "",
          receipt: existingUrl,
        });
      } else {
        setPreviewUrl(null);
        reset({ title: "", amount: "", category: "OTHER", description: "", receipt: null });
      }
    }
  }, [open, mode, selectedExpense, reset, isSubmitting]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    reset();
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose?.();
  }, [reset, onClose, isSubmitting]);

  const onSubmit = useCallback(
    (formData) => {
      if (isSubmitting) return;
      if (mode === "create") {
        createMutation.mutate(formData);
      } else if (selectedExpense?.id) {
        updateMutation.mutate({ id: selectedExpense.id, formData });
      }
    },
    [mode, selectedExpense, createMutation, updateMutation, isSubmitting]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setPreviewUrl(URL.createObjectURL(file));
        setValue("receipt", file, { shouldDirty: true });
      }
    },
    [setValue]
  );

  const handleClearReceipt = useCallback(() => {
    setValue("receipt", null, { shouldDirty: true });
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setValue]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={isSubmitting ? undefined : handleClose} open={open}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {mode === "create" ? "Catat Pengeluaran" : "Edit Pengeluaran"}
          </Typography>
          <IconButton onClick={handleClose} disabled={isSubmitting} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack sx={{ gap: 3 }}>
          {/* Receipt Upload - di awal */}
          <Controller
            control={control}
            name="receipt"
            render={({ fieldState }) => (
              <>
                {displayImage ? (
                  <Box sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, borderRadius: `${theme.shape.borderRadius}px`, p: 1, position: "relative" }}>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={(e) => { e.stopPropagation(); handleClearReceipt(); }}
                      disabled={isSubmitting}
                      sx={{ position: "absolute", right: 8, top: 8, fontWeight: 500, textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Hapus Gambar
                    </Button>
                    <Box component="img" alt="Preview" src={displayImage} sx={{ display: "block", height: 200, objectFit: "cover", width: "100%", borderRadius: `${theme.shape.borderRadius}px` }} />
                  </Box>
                ) : (
                  <Box
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    sx={{
                      height: 180,
                      border: "2px dashed",
                      borderColor: fieldState.error ? "error.main" : alpha(theme.palette.divider, 0.6),
                      borderRadius: `${theme.shape.borderRadius}px`,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.5,
                      bgcolor: fieldState.error ? alpha(theme.palette.error.main, 0.04) : alpha(theme.palette.secondary.main, 0.03),
                      transition: theme.transitions.create(["border-color", "background-color"]),
                      "&:hover": {
                        borderColor: isSubmitting ? undefined : theme.palette.secondary.main,
                        bgcolor: isSubmitting ? undefined : alpha(theme.palette.secondary.main, 0.06),
                      },
                    }}
                  >
                    <Box sx={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.paper", border: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                      <Upload size={20} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                    </Box>
                    <Stack sx={{ alignItems: "center", gap: 0.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Unggah Bukti Pembayaran</Typography>
                      <Typography variant="caption" color="text.secondary">JPG, PNG, WEBP (Max. 5MB)</Typography>
                    </Stack>
                  </Box>
                )}
                {fieldState.error && (
                  <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: "block" }}>{fieldState.error.message}</Typography>
                )}
              </>
            )}
          />

          <Controller
            control={control}
            name="title"
            rules={{ required: "Judul wajib diisi" }}
            render={({ field, fieldState }) => (
              <TextField {...field} fullWidth autoFocus label="Judul" error={!!fieldState.error} helperText={fieldState.error?.message} placeholder="Masukkan judul pengeluaran" disabled={isSubmitting} />
            )}
          />

          <Stack direction="row" sx={{ gap: 2 }}>
            <Controller
              control={control}
              name="amount"
              rules={{ required: "Jumlah wajib diisi", min: { value: 1, message: "Minimal Rp 1" } }}
              render={({ field, fieldState }) => (
                <TextField {...field} fullWidth label="Jumlah" placeholder="Rp 0" error={!!fieldState.error} helperText={fieldState.error?.message} value={field.value ? formatToIdr(field.value) : ""} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ""); field.onChange(raw ? Number(raw) : ""); }} disabled={isSubmitting} />
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <FormControl fullWidth disabled={isSubmitting}>
                  <InputLabel>Kategori</InputLabel>
                  <Select {...field} label="Kategori">
                    {Object.entries(ExpenseCategory).map(([key, value]) => (
                      <MenuItem key={key} value={value}>{normalizeEnumText(value)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField {...field} fullWidth label="Deskripsi" placeholder="Deskripsi (opsional)" multiline rows={3} disabled={isSubmitting} />
            )}
          />

          <input accept="image/*" hidden onChange={handleFileChange} ref={fileInputRef} type="file" disabled={isSubmitting} />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button color="inherit" variant="outlined" disabled={isSubmitting} onClick={handleClose}>Batal</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting || (mode === "update" && !isDirty)} startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : null}>
          {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseFormDialog;