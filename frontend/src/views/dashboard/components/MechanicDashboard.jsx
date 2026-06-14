/**
 * MechanicDashboard - Komponen dashboard mekanik untuk menampilkan ringkasan tugas,
 * progress, dan daftar tugas menunggu.
 *
 * @component
 * @param {Object} props - Properti komponen
 * @param {Object} props.data - Data dashboard mekanik
 * @param {boolean} [props.isLoading] - Status loading data
 * @param {Function} [props.refetch] - Fungsi untuk memuat ulang data
 * @returns {JSX.Element} Komponen dashboard mekanik
 */
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
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BarChart3, Clock, DollarSign, RotateCcw, Wrench } from "lucide-react";

import { formatToIdr, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { DoughnutChart, SummaryCard, AppTable } from "@components";
import { useDevice } from "@hooks";

const EmptyMechanicSVG = () => (
  <Box
    component="svg"
    viewBox="0 0 200 120"
    sx={{
      width: { xs: 100, sm: 120 },
      height: { xs: 60, sm: 72 },
      opacity: 0.15,
      color: "text.secondary",
    }}
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

const EmptyState = ({ title, description, children }) => {
  const { isMobile } = useDevice();
  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 0 },
        gap: { xs: 2, sm: 3 },
        textAlign: "center",
        flexGrow: 1,
        minHeight: { xs: 200, sm: 260, md: 300 },
      }}
    >
      {children}
      <Stack sx={{ gap: { xs: 0.5, sm: 1 } }}>
        <Typography
          variant={isMobile ? "subtitle2" : "body2"}
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Stack>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const sectionIconSx = (theme) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  borderRadius: `${theme.shape.borderRadius}px`,
  bgcolor: alpha(theme.palette.secondary.main, 0.08),
  color: theme.palette.secondary.main,
  flexShrink: 0,
});

const iconBtnSx = (theme) => ({
  border: "1px solid",
  borderColor: alpha(theme.palette.divider, 0.8),
  borderRadius: `${theme.shape.borderRadius}px`,
  color: "text.secondary",
  minWidth: 38,
  minHeight: 38,
  p: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: theme.transitions.create(
    ["background-color", "border-color", "color"],
    { duration: theme.transitions.duration.shorter }
  ),
  "&:hover": {
    bgcolor: alpha(theme.palette.secondary.main, 0.08),
    borderColor: alpha(theme.palette.secondary.main, 0.4),
    color: theme.palette.secondary.main,
  },
});

// ==================== SKELETONS ====================

const HeaderSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card sx={{ borderRadius: br }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack sx={{ gap: { xs: 1.5, sm: 0 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton
                variant="text"
                width={isMobile ? 160 : 200}
                height={isMobile ? 28 : 32}
                sx={{ minWidth: 120 }}
              />
              <Skeleton
                variant="text"
                width={isMobile ? 220 : 280}
                height={isMobile ? 16 : 20}
                sx={{ mt: 0.5, minWidth: 140 }}
              />
            </Box>
            {!isMobile && (
              <Skeleton
                variant="rounded"
                width={38}
                height={38}
                sx={{ borderRadius: br, flexShrink: 0, ml: 2 }}
              />
            )}
          </Stack>
          {isMobile && (
            <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
              <Skeleton
                variant="rounded"
                width={38}
                height={38}
                sx={{ borderRadius: br, flexShrink: 0 }}
              />
            </Stack>
          )}
        </Stack>
      </Box>
    </Card>
  );
};

const SummaryCardSkeleton = () => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card
      sx={{ borderRadius: br, height: "100%", minHeight: { xs: 100, sm: 120 } }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="50%" height={14} />
      </Box>
    </Card>
  );
};

const ProgressSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card sx={{ borderRadius: br }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton
              variant="text"
              width={isMobile ? 120 : 140}
              height={28}
              sx={{ minWidth: 100 }}
            />
            <Skeleton
              variant="text"
              width={isMobile ? 180 : 220}
              height={16}
              sx={{ mt: 0.5, minWidth: 120 }}
            />
          </Box>
          <Skeleton
            variant="rounded"
            width={38}
            height={38}
            sx={{ borderRadius: br, ml: 2, flexShrink: 0 }}
          />
        </Stack>
      </Box>
   
      <Box
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Skeleton
            variant="circular"
            width={isMobile ? 160 : 220}
            height={isMobile ? 160 : 220}
          />
        </Box>
        <Stack
          sx={{
            gap: { xs: 1.5, sm: 2 },
            minWidth: { xs: "100%", md: 200 },
            maxWidth: { xs: "100%", md: 280 },
            width: "100%",
          }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width="100%"
              height={isMobile ? 48 : 56}
              sx={{ borderRadius: br }}
            />
          ))}
        </Stack>
      </Box>
    </Card>
  );
};

const TableSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card sx={{ borderRadius: br }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <Skeleton
          variant="text"
          width={isMobile ? 120 : 140}
          height={28}
          sx={{ minWidth: 100 }}
        />
        <Skeleton
          variant="text"
          width={isMobile ? 160 : 200}
          height={16}
          sx={{ mt: 0.5, minWidth: 120 }}
        />
      </Box>
   
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={isMobile ? 250 : 300}
          sx={{ borderRadius: br }}
        />
      </Box>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

const MechanicDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useDevice();

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
            alpha(theme.palette.secondary.main, 0.15),
          ],
          borderWidth: 0,
        },
      ],
      labels: ["Selesai", "Pending"],
    };
  }, [data, theme]);

  const hasData = useMemo(
    () => data?.overallStats?.total > 0 || data?.pendingTasks?.length > 0,
    [data]
  );

  const tableHeaders = ["Layanan", "No. Order", "Kendaraan", "Status"];

  const renderRow = (task) => [
    <Typography key="service" variant="body2" sx={{ fontWeight: 500 }} noWrap>
      {task.serviceName}
    </Typography>,
    <Typography
      key="order"
      variant="body2"
      color="text.secondary"
      sx={{ fontFamily: "monospace" }}
      noWrap
    >
      {task.orderNumber}
    </Typography>,
    <Typography key="plate" variant="body2" color="text.secondary" noWrap>
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

  if (isLoading) {
    return (
      <Stack sx={{ gap: { xs: 2, sm: 3, md: 4 } }}>
        <HeaderSkeleton />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {[1, 2, 3].map((i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </Box>
        <ProgressSkeleton />
        <TableSkeleton />
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: { xs: 2, sm: 3, md: 4 } }}>
      <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Stack sx={{ gap: { xs: 1.5, sm: 0 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  color="text.primary"
                  sx={{
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    wordBreak: "break-word",
                  }}
                >
                  Dashboard Mekanik
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Pantau tugas dan performa Anda hari ini
                </Typography>
              </Box>
              {!isMobile && (
                <Tooltip title="Refresh data" placement="bottom">
                  <IconButton
                    onClick={() => refetch?.()}
                    size="medium"
                    aria-label="Refresh data"
                    sx={{ ...iconBtnSx(theme), ml: 2, flexShrink: 0 }}
                  >
                    <RotateCcw size={18} strokeWidth={2} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {isMobile && (
              <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                <Tooltip title="Refresh data" placement="bottom">
                  <IconButton
                    onClick={() => refetch?.()}
                    size="small"
                    aria-label="Refresh data"
                    sx={iconBtnSx(theme)}
                  >
                    <RotateCcw size={16} strokeWidth={2} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Box>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: { xs: 2, sm: 2.5, md: 3 },
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

      <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                color="text.primary"
                sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                Progress Tugas
              </Typography>
              <Typography
                variant={isMobile ? "caption" : "body2"}
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Perbandingan tugas selesai & pending
              </Typography>
            </Box>
            <Box sx={sectionIconSx(theme)}>
              <BarChart3 size={18} strokeWidth={1.5} />
            </Box>
          </Stack>
        </Box>
     
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          {hasData && data?.overallStats?.total > 0 ? (
            <Stack
              direction={{ xs: "column", md: "row" }}
              sx={{ alignItems: "center", gap: { xs: 3, md: 4 } }}
            >
              <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: { xs: 180, sm: 220, md: 240 },
                  }}
                >
                  <DoughnutChart
                    datasets={taskChartData.datasets}
                    height={isMobile ? 160 : isTablet ? 200 : 220}
                    labels={taskChartData.labels}
                    legend
                  />
                </Box>
              </Box>
              <Stack
                sx={{
                  gap: { xs: 1.5, sm: 2 },
                  minWidth: { xs: "100%", md: 200 },
                  maxWidth: { xs: "100%", md: 280 },
                  width: "100%",
                }}
              >
                {[
                  {
                    label: "Tugas Selesai",
                    value: data.overallStats.completed || 0,
                    color: theme.palette.secondary.main,
                    bgAlpha: 0.06,
                  },
                  {
                    label: "Tugas Pending",
                    value: data.overallStats.pending || 0,
                    color: alpha(theme.palette.secondary.main, 0.6),
                    bgAlpha: 0.04,
                  },
                  {
                    label: "Tingkat Penyelesaian",
                    value: `${data.overallStats.completionRate || 0}%`,
                    color: theme.palette.secondary.main,
                    bgAlpha: 0.04,
                  },
                ].map((item, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: "1px solid",
                      borderColor: alpha(theme.palette.divider, 0.8),
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{ fontWeight: 700, color: item.color }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
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
