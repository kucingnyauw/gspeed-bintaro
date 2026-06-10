import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircle,
  Clock,
  DollarSign,
  RotateCcw,
  Wrench,
  AlertCircle,
} from "lucide-react";

import { formatDate, formatToIdr, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { DoughnutChart, SummaryCard, AppTable } from "@components";

/**
 * Komponen SVG untuk menampilkan ilustrasi mekanik saat data kosong.
 * @returns {JSX.Element} Ilustrasi SVG mekanik
 */
const EmptyMechanicSVG = () => (
  <Box
    component="svg"
    viewBox="0 0 200 120"
    sx={{ width: 120, height: 72, opacity: 0.15, color: "text.secondary" }}
  >
    <circle
      cx="70"
      cy="50"
      r="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M50 90L70 70L90 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="120"
      y="35"
      width="50"
      height="30"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="130"
      y1="50"
      x2="160"
      y2="50"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle
      cx="135"
      cy="65"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="155"
      cy="65"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </Box>
);

/**
 * Komponen untuk menampilkan pesan ketika data kosong.
 * @param {Object} props - Properti komponen
 * @param {string} props.title - Judul pesan
 * @param {string} props.description - Deskripsi pesan
 * @param {React.ReactNode} props.children - Konten ilustrasi atau elemen tambahan
 * @returns {JSX.Element} Tampilan status kosong
 */
const EmptyState = ({ title, description, children }) => (
  <Stack
    sx={{
      alignItems: "center",
      justifyContent: "center",
      py: 8,
      gap: 3,
      textAlign: "center",
      flexGrow: 1,
    }}
  >
    {children}
    <Stack sx={{ gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  </Stack>
);

/**
 * Dashboard Mekanik - Menampilkan ringkasan tugas, progress, dan daftar tugas menunggu untuk mekanik.
 * @param {Object} props - Properti komponen
 * @param {Object} props.data - Data dashboard mekanik
 * @param {Object} [props.data.overallStats] - Statistik keseluruhan tugas
 * @param {number} props.data.overallStats.completed - Jumlah tugas selesai
 * @param {number} props.data.overallStats.pending - Jumlah tugas menunggu
 * @param {number} props.data.overallStats.total - Total seluruh tugas
 * @param {number} props.data.overallStats.completionRate - Tingkat penyelesaian dalam persen
 * @param {Array} [props.data.pendingTasks] - Daftar tugas yang menunggu
 * @param {string} props.data.pendingTasks[].assignmentId - ID penugasan
 * @param {string} props.data.pendingTasks[].orderItemId - ID item pesanan
 * @param {string} props.data.pendingTasks[].orderId - ID pesanan
 * @param {string} props.data.pendingTasks[].orderNumber - Nomor pesanan
 * @param {string} props.data.pendingTasks[].plateNumber - Nomor plat kendaraan
 * @param {string} props.data.pendingTasks[].serviceName - Nama layanan
 * @param {string} props.data.pendingTasks[].status - Status tugas
 * @param {Object} [props.data.todayTasks] - Statistik tugas hari ini
 * @param {number} props.data.todayTasks.completed - Jumlah tugas selesai hari ini
 * @param {number} props.data.todayTasks.earnings - Pendapatan hari ini
 * @param {number} props.data.todayTasks.pending - Jumlah tugas menunggu hari ini
 * @param {boolean} [props.isLoading] - Status loading data
 * @param {Function} [props.refetch] - Fungsi untuk memuat ulang data
 * @returns {JSX.Element} Komponen dashboard mekanik
 */
const MechanicDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

  /**
   * Data untuk DoughnutChart progress tugas.
   * @type {{ datasets: Array<{ data: number[], backgroundColor: string[], borderWidth: number }>, labels: string[] }}
   */
  const taskChartData = useMemo(() => {
    if (!data?.overallStats) return { datasets: [], labels: [] };

    return {
      datasets: [
        {
          data: [
            data.overallStats.completed || 0,
            data.overallStats.pending || 0,
          ],
          backgroundColor: [
            theme.palette.secondary.main,
            alpha(theme.palette.secondary.main, 0.2),
          ],
          borderWidth: 0,
        },
      ],
      labels: ["Selesai", "Pending"],
    };
  }, [data, theme]);

  /**
   * Flag yang menunjukkan apakah terdapat data untuk ditampilkan.
   * @type {boolean}
   */
  const hasData = useMemo(() => {
    return data?.overallStats?.total > 0 || data?.pendingTasks?.length > 0;
  }, [data]);

  /** @type {string[]} */
  const tableHeaders = ["Layanan", "No. Order", "Kendaraan", "Status"];

  /**
   * Merender satu baris tabel untuk tugas yang diberikan.
   * @param {Object} task - Data tugas
   * @param {string} task.serviceName - Nama layanan
   * @param {string} task.orderNumber - Nomor pesanan
   * @param {string} [task.plateNumber] - Nomor plat kendaraan
   * @param {string} task.status - Status tugas
   * @returns {JSX.Element[]} Elemen sel tabel
   */
  const renderRow = (task) => {
    return [
      <Typography key="service" variant="body2" sx={{ fontWeight: 500 }}>
        {task.serviceName}
      </Typography>,
      <Typography
        key="order"
        variant="body2"
        color="text.secondary"
        sx={{ fontFamily: "monospace" }}
      >
        {task.orderNumber}
      </Typography>,
      <Typography key="plate" variant="body2" color="text.secondary">
        {task.plateNumber || "—"}
      </Typography>,
      <Chip
        key="status"
        label={normalizeEnumText(OrderStatus[task.status] || task.status)}
        color={statusColorMap[task.status] || "default"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
      />,
    ];
  };

  if (isLoading) {
    return (
      <Stack sx={{ gap: 4 }}>
        <Card sx={{ p: 3, boxShadow: "none" }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Box>
              <Skeleton width={280} height={36} />
              <Skeleton width={180} height={20} sx={{ mt: 1 }} />
            </Box>
            <Stack direction="row" sx={{ gap: 1 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="circular" width={40} height={40} />
            </Stack>
          </Stack>
        </Card>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
            gap: 4,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Card key={i} sx={{ p: 2.5, boxShadow: "none" }}>
              <Stack sx={{ gap: 1.5 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={32} />
                <Skeleton width="50%" height={14} />
              </Stack>
            </Card>
          ))}
        </Box>
        <Card sx={{ p: 3, minHeight: 420, boxShadow: "none" }}>
          <Skeleton width={180} height={28} />
          <Skeleton width={240} height={16} sx={{ mt: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Skeleton variant="circular" width={250} height={250} />
          </Box>
        </Card>
        <Card sx={{ p: 3, minHeight: 420, boxShadow: "none" }}>
          <Skeleton width={180} height={28} />
          <Skeleton width={240} height={16} sx={{ mt: 1 }} />
          <Skeleton
            variant="rounded"
            width="100%"
            height={300}
            sx={{ mt: 2 }}
          />
        </Card>
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: 4 }}>
      {/* Header Card */}
      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,

          borderRadius: `${theme.shape.borderRadius}px`,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}
              >
                Dashboard Mekanik
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Pantau tugas dan performa Anda hari ini
              </Typography>
            </Box>
            <Tooltip title="Refresh data" placement="bottom">
              <IconButton
                onClick={() => refetch?.()}
                size="small"
                sx={{
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.6),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    color: theme.palette.secondary.main,
                  },
                }}
              >
                <RotateCcw size={16} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Card>

      {/* Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: 4,
        }}
      >
        <SummaryCard
          color="secondary"
          icon={Clock}
          subtitle={`${data?.todayTasks?.completed || 0} selesai hari ini`}
          title="Tugas Menunggu"
          value={data?.todayTasks?.pending || 0}
          index={0}
        />
        <SummaryCard
          color="secondary"
          icon={Wrench}
          subtitle="Keseluruhan tugas"
          title="Total Tugas"
          value={data?.overallStats?.total || 0}
          index={1}
        />
        <SummaryCard
          color="secondary"
          icon={DollarSign}
          subtitle="Pendapatan hari ini"
          title="Pendapatan"
          value={formatToIdr(data?.todayTasks?.earnings || 0)}
          index={2}
        />
      </Box>

      {/* Task Progress */}
      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: "none",
          borderRadius: `${theme.shape.borderRadius}px`,
        }}
      >
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Progress Tugas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Perbandingan tugas selesai & pending
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          {hasData && data?.overallStats?.total > 0 ? (
            <Stack
              direction={{ xs: "column", md: "row" }}
              sx={{ alignItems: "center", gap: 4 }}
            >
              <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <Box sx={{ width: "100%", maxWidth: 240 }}>
                  <DoughnutChart
                    datasets={taskChartData.datasets}
                    height={220}
                    labels={taskChartData.labels}
                    legend={true}
                  />
                </Box>
              </Box>
              <Stack
                sx={{ gap: 2, minWidth: 200, maxWidth: 280, width: "100%" }}
              >
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                    border: `1px solid ${alpha(
                      theme.palette.secondary.main,
                      0.12
                    )}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Tugas Selesai
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    {data.overallStats.completed || 0}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    border: `1px solid ${alpha(
                      theme.palette.secondary.main,
                      0.08
                    )}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Tugas Pending
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: alpha(theme.palette.secondary.main, 0.6),
                    }}
                  >
                    {data.overallStats.pending || 0}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    border: `1px solid ${alpha(
                      theme.palette.secondary.main,
                      0.12
                    )}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Tingkat Penyelesaian
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    {data.overallStats.completionRate || 0}%
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <EmptyState
              title="Belum Ada Data Tugas"
              description="Data tugas akan muncul di sini setelah Anda mulai mengerjakan"
            >
              <EmptyMechanicSVG />
            </EmptyState>
          )}
        </Box>
      </Card>

      {/* Pending Tasks Table */}
      <AppTable
        title="Tugas Menunggu"
        subtitle={`${data?.pendingTasks?.length || 0} tugas perlu diselesaikan`}
        headers={tableHeaders}
        data={data?.pendingTasks || []}
        renderRow={renderRow}
        count={1}
        page={1}
        isLoading={isLoading}
        emptyStateMessage="Tidak ada tugas yang menunggu"
        enableMultiSelect={false}
        hideRowsPerPage
      />
    </Stack>
  );
};

MechanicDashboard.propTypes = {
  data: PropTypes.shape({
    overallStats: PropTypes.shape({
      completed: PropTypes.number,
      pending: PropTypes.number,
      total: PropTypes.number,
      completionRate: PropTypes.number,
    }),
    pendingTasks: PropTypes.arrayOf(
      PropTypes.shape({
        assignmentId: PropTypes.string,
        orderItemId: PropTypes.string,
        orderId: PropTypes.string,
        orderNumber: PropTypes.string,
        plateNumber: PropTypes.string,
        serviceName: PropTypes.string,
        status: PropTypes.string,
      })
    ),
    todayTasks: PropTypes.shape({
      completed: PropTypes.number,
      earnings: PropTypes.number,
      pending: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default MechanicDashboard;
