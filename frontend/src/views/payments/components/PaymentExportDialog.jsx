import { useState } from "react";
import { Calendar, X } from "lucide-react";

import {
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
  Typography,
} from "@mui/material";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

import { PaymentMethod } from "@shared/constant";
import { exportToCsv, formatDateTime, formatToIdr } from "@shared/utils";
import { usePaymentsQuery } from "@views/payments/hooks";

const csvHeaders = [
  "No. Order",
  "Metode",
  "Dibayar",
  "Kembalian",
  "Status",
  "Kasir",
  "Customer",
  "Subtotal",
  "Pajak",
  "Total",
  "Tanggal",
];

const PaymentExportDialog = ({ open, onClose }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { refetch } = usePaymentsQuery({
    limit: 100,
    page: 1,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    method: method || undefined,
    status: status || undefined,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await refetch();
      const payments = result?.data?.data || [];
      const fileName = `Data-Pembayaran-${startDate ? startDate.toISOString().split("T")[0] : "all"}-${endDate ? endDate.toISOString().split("T")[0] : "all"}.csv`;

      exportToCsv({
        data: payments,
        fileName,
        headers: csvHeaders,
        mapRow: (row) => [
          row.order?.orderNumber || "—",
          PaymentMethod[row.method] || row.method,
          formatToIdr(row.amountPaid),
          formatToIdr(row.change),
          row.statusLabel,
          row.order?.cashier?.fullName || "—",
          row.order?.customer?.name || "—",
          formatToIdr(row.order?.subtotal || 0),
          formatToIdr(row.order?.tax || 0),
          formatToIdr(row.order?.total || 0),
          formatDateTime(row.createdAt),
        ],
      });
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setMethod("");
    setStatus("");
  };

  return (
    <Dialog open={open} onClose={isExporting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Export Pembayaran
          </Typography>
          <IconButton onClick={onClose} disabled={isExporting} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        <Stack sx={{ gap: 3 }}>
          <MobileDatePicker
            label="Dari Tanggal"
            value={startDate}
            onChange={setStartDate}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <MobileDatePicker
            label="Sampai Tanggal"
            value={endDate}
            onChange={setEndDate}
            slots={{ openPickerIcon: () => <Calendar size={16} strokeWidth={1.5} /> }}
            slotProps={{ textField: { fullWidth: true } }}
          />

          <FormControl fullWidth>
            <InputLabel>Metode</InputLabel>
            <Select value={method} label="Metode" onChange={(e) => setMethod(e.target.value)}>
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(PaymentMethod).map(([key, value]) => (
                <MenuItem key={key} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="PAID">Lunas</MenuItem>
              <MenuItem value="REFUNDED">Refund</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5, justifyContent: "space-between" }}>
        <Button color="inherit" variant="outlined" onClick={handleReset} disabled={isExporting}>
          Reset
        </Button>
        <Stack direction="row" sx={{ gap: 1.5 }}>
          <Button color="inherit" variant="outlined" disabled={isExporting} onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {isExporting ? "Mengexport..." : "Export CSV"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentExportDialog;