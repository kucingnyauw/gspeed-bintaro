import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  Box,
  Card,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Skeleton,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";

import { getSettings, bulkUpdateSettings } from "@api/settingApi.js";
import { STALE_TIME } from "@shared/constant";
import { formatToIdr } from "@shared/utils";
import { showNotification } from "@store/notifications/notificationsSlice.js";

/**
 * Map label untuk setiap key settings dalam bahasa Indonesia.
 *
 * @type {Object<string, string>}
 */
const labelMap = {
  enable_ppn: "Aktifkan PPN",
  ppn_rate: "Tarif PPN (%)",
  enable_pph: "Aktifkan PPH",
  pph_rate: "Tarif PPH (%)",
  mechanic_max_tasks: "Maksimal Tugas Mekanik",
  shift_min_starting_cash: "Minimal Saldo Awal Shift",
  stock_low_threshold: "Batas Stok Rendah",
  daily_order_target: "Target Pesanan Harian",
  daily_revenue_target: "Target Pendapatan Harian",
  monthly_order_target: "Target Pesanan Bulanan",
  monthly_revenue_target: "Target Pendapatan Bulanan",
  monthly_profit_target: "Target Keuntungan Bulanan",
  yearly_revenue_target: "Target Pendapatan Tahunan",
};

/**
 * Map teks bantuan (helper text) untuk setiap key settings.
 *
 * @type {Object<string, string>}
 */
const helperMap = {
  enable_ppn: "Aktifkan/nonaktifkan Pajak Pertambahan Nilai (PPN)",
  ppn_rate: "Tarif PPN dalam persen (default: 11%)",
  enable_pph: "Aktifkan/nonaktifkan Pajak Penghasilan (PPH)",
  pph_rate: "Tarif PPH dalam persen (default: 0.5%)",
  mechanic_max_tasks: "Jumlah maksimal tugas yang bisa dikerjakan satu mekanik secara bersamaan",
  shift_min_starting_cash: "Saldo minimal yang harus disiapkan kasir saat membuka shift",
  stock_low_threshold: "Batas minimum stok sebelum produk dianggap stok rendah",
  daily_order_target: "Target jumlah pesanan per hari",
  daily_revenue_target: "Target pendapatan yang harus dicapai per hari",
  monthly_order_target: "Target jumlah pesanan per bulan",
  monthly_revenue_target: "Target pendapatan yang harus dicapai per bulan",
  monthly_profit_target: "Target keuntungan bersih per bulan",
  yearly_revenue_target: "Target pendapatan yang harus dicapai per tahun",
};

/**
 * Aturan validasi untuk setiap field settings.
 *
 * @type {Object<string, Object>}
 */
const validationRules = {
  ppn_rate: {
    required: "Wajib diisi",
    min: { value: 0, message: "Minimal 0" },
    max: { value: 100, message: "Maksimal 100" },
  },
  pph_rate: {
    required: "Wajib diisi",
    min: { value: 0, message: "Minimal 0" },
    max: { value: 100, message: "Maksimal 100" },
  },
  mechanic_max_tasks: {
    required: "Wajib diisi",
    min: { value: 1, message: "Minimal 1" },
  },
  shift_min_starting_cash: {
    required: "Wajib diisi",
    min: { value: 1000, message: "Minimal Rp 1.000" },
  },
  stock_low_threshold: {
    required: "Wajib diisi",
    min: { value: 1, message: "Minimal 1" },
  },
  daily_order_target: {
    required: "Wajib diisi",
    min: { value: 1, message: "Minimal 1" },
  },
  daily_revenue_target: {
    required: "Wajib diisi",
    min: { value: 1000, message: "Minimal Rp 1.000" },
  },
  monthly_order_target: {
    required: "Wajib diisi",
    min: { value: 1, message: "Minimal 1" },
  },
  monthly_revenue_target: {
    required: "Wajib diisi",
    min: { value: 1000, message: "Minimal Rp 1.000" },
  },
  monthly_profit_target: {
    required: "Wajib diisi",
    min: { value: 1000, message: "Minimal Rp 1.000" },
  },
  yearly_revenue_target: {
    required: "Wajib diisi",
    min: { value: 1000, message: "Minimal Rp 1.000" },
  },
};

/**
 * Daftar field yang menggunakan format mata uang (IDR).
 *
 * @type {string[]}
 */
const currencyFields = [
  "shift_min_starting_cash",
  "daily_revenue_target",
  "monthly_revenue_target",
  "monthly_profit_target",
  "yearly_revenue_target",
];

/**
 * Daftar field yang menggunakan format persentase.
 *
 * @type {string[]}
 */
const percentageFields = ["ppn_rate", "pph_rate"];

/**
 * Daftar field dengan tipe data boolean (switch).
 *
 * @type {string[]}
 */
const booleanFields = ["enable_ppn", "enable_pph"];

/**
 * Urutan tampilan settings.
 *
 * @type {string[]}
 */
const settingsOrder = [
  "enable_ppn",
  "ppn_rate",
  "enable_pph",
  "pph_rate",
  "mechanic_max_tasks",
  "shift_min_starting_cash",
  "stock_low_threshold",
  "daily_order_target",
  "daily_revenue_target",
  "monthly_order_target",
  "monthly_revenue_target",
  "monthly_profit_target",
  "yearly_revenue_target",
];

/**
 * Komponen skeleton untuk tampilan loading halaman settings.
 *
 * @returns {JSX.Element} Tampilan skeleton loading
 */
const SettingsSkeleton = () => (
  <Box>
    <Card sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none", borderRadius: 1 }}>
      <Box sx={{ p: 3 }}>
        <Stack sx={{ gap: 1 }}>
          <Skeleton variant="rounded" height={36} width="40%" />
          <Skeleton variant="rounded" height={20} width="60%" />
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ p: 3 }}>
        <Stack sx={{ gap: 2 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ p: 3, display: "flex", justifyContent: "flex-end" }}>
        <Skeleton variant="rounded" height={36} width={160} />
      </Box>
    </Card>
  </Box>
);

/**
 * Halaman Pengaturan Sistem - Form untuk mengkonfigurasi parameter operasional bengkel.
 *
 * @component
 * @returns {JSX.Element} Halaman pengaturan sistem
 */
const Settings = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: STALE_TIME,
  });

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm();

  const bulkUpdate = useMutation({
    mutationFn: bulkUpdateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries();
      dispatch(
        showNotification({
          message: "Pengaturan sistem berhasil diperbarui",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      reset({}, { keepValues: true });
    },
    onError: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal memperbarui pengaturan sistem",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = bulkUpdate.isPending;

  /**
   * Settings yang diurutkan sesuai settingsOrder.
   * Field yang tidak ada di settingsOrder akan muncul di akhir.
   *
   * @type {Array<Object>}
   */
  const sortedSettings = settings
    ? [...settings].sort((a, b) => {
        const indexA = settingsOrder.indexOf(a.key);
        const indexB = settingsOrder.indexOf(b.key);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
    : [];

  useEffect(() => {
    if (settings?.length) {
      const defaults = {};
      settings.forEach((s) => {
        if (booleanFields.includes(s.key)) {
          defaults[s.key] = s.value === "true";
        } else {
          defaults[s.key] = s.value;
        }
      });
      reset(defaults);
    }
  }, [settings, reset]);

  const onSubmit = (formData) => {
    const payload = Object.entries(formData).map(([key, value]) => ({
      key,
      value: typeof value === "boolean" ? String(value) : String(value),
    }));
    if (payload.length > 0) bulkUpdate.mutate(payload);
  };

  if (isLoading) return <SettingsSkeleton />;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Card sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none", borderRadius: 1 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Pengaturan Sistem
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Konfigurasi parameter operasional bengkel
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ p: 3 }}>
          <Stack divider={<Divider />}>
            {sortedSettings.map((setting) => (
              <Stack
                key={setting.id}
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: 2,
                  py: 3,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {labelMap[setting.key] || setting.key}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {helperMap[setting.key] || ""}
                  </Typography>
                </Box>

                {booleanFields.includes(setting.key) ? (
                  <Controller
                    name={setting.key}
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            color="primary"
                            disabled={isSubmitting}
                          />
                        }
                        label={field.value ? "Aktif" : "Nonaktif"}
                        sx={{ flexShrink: 0, mr: 0 }}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    name={setting.key}
                    control={control}
                    rules={validationRules[setting.key] || {}}
                    render={({ field, fieldState }) => (
                      <TextField
                        size="small"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        disabled={isSubmitting}
                        value={
                          currencyFields.includes(setting.key)
                            ? field.value
                              ? formatToIdr(field.value)
                              : ""
                            : field.value ?? ""
                        }
                        onChange={(e) => {
                          if (currencyFields.includes(setting.key)) {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(raw ? Number(raw) : "");
                          } else if (percentageFields.includes(setting.key)) {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            field.onChange(raw);
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
                        sx={{ width: { xs: "100%", sm: 200 }, flexShrink: 0 }}
                        slotProps={{
                          input: {
                            endAdornment: percentageFields.includes(setting.key) ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                                %
                              </Typography>
                            ) : null,
                          },
                        }}
                      />
                    )}
                  />
                )}
              </Stack>
            ))}
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ p: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || isSubmitting}
            sx={{ fontWeight: 500, textTransform: "none" }}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default Settings;