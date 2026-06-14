/**
 * AdminDashboard - Komponen dashboard admin untuk menampilkan metrik dan statistik.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {Object} props.data - Data dashboard dari API
 * @param {boolean} props.isLoading - Status loading data
 * @param {Function} props.refetch - Fungsi untuk refresh data
 * @returns {JSX.Element} Komponen AdminDashboard
 */
import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  useTheme,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Clock,
  DollarSign,
  Package,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertCircle,
  Car,
  BarChart3,
  Target,
  CalendarDays,
} from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { BarChart, SummaryCard } from "@components";
import { useDevice } from "@hooks";

const EmptyStockSVG = () => (
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
    <rect
      x="60"
      y="30"
      width="80"
      height="70"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M52 30L100 18L148 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M52 30V42H148V30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M80 62L92 74L120 46"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
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
        minHeight: { xs: 200, sm: 260, md: 320 },
      }}
    >
      {children}
      <Stack sx={{ gap: { xs: 0.5, sm: 1 } }}>
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Typography
          variant={isMobile ? "caption" : "body2"}
          color="text.secondary"
        >
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

const TargetItem = ({
  label,
  actual,
  target,
  percentage,
  isCurrency = false,
}) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const fmt = (val) => (isCurrency ? formatToIdr(val) : String(val));
  const cappedProgress = Math.min(percentage, 100);
  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: { xs: 1.5, sm: 2 },
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography
          variant={isMobile ? "body2" : "body1"}
          sx={{ fontWeight: 600 }}
        >
          {label}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
          <Typography
            variant={isMobile ? "body2" : "body1"}
            sx={{ fontWeight: 700 }}
          >
            {fmt(actual)}
          </Typography>
          <Typography
            variant={isMobile ? "caption" : "body2"}
            color="text.disabled"
          >
            / {fmt(target)}
          </Typography>
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={cappedProgress}
        sx={{
          height: { xs: 8, sm: 10 },
          borderRadius: `${theme.shape.borderRadius}px`,
          bgcolor: theme.palette.divider,
          "& .MuiLinearProgress-bar": {
            bgcolor: theme.palette.secondary.main,
            borderRadius: `${theme.shape.borderRadius}px`,
          },
        }}
      />
    </Box>
  );
};

TargetItem.propTypes = {
  label: PropTypes.string.isRequired,
  actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  target: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.number.isRequired,
  isCurrency: PropTypes.bool,
};

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
                width={isMobile ? 180 : 240}
                height={isMobile ? 28 : 32}
                sx={{ minWidth: 120 }}
              />
              <Skeleton
                variant="text"
                width={isMobile ? 240 : 320}
                height={isMobile ? 16 : 20}
                sx={{ mt: 0.5, minWidth: 160 }}
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

const SectionHeaderSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton
          variant="text"
          width={isMobile ? 140 : 160}
          height={isMobile ? 24 : 28}
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
        sx={{ borderRadius: br, flexShrink: 0, ml: 2 }}
      />
    </Stack>
  );
};

const SummaryCardSkeleton = () => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card
      sx={{
        borderRadius: br,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: 120, sm: 140 },
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <Skeleton
          variant="rounded"
          width={40}
          height={40}
          sx={{ borderRadius: br }}
        />
        <Box>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="text" width="70%" height={14} />
      </Box>
    </Card>
  );
};

const ChartSkeleton = () => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card
      sx={{
        borderRadius: br,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: { xs: 300, sm: 360, md: 420 },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <SectionHeaderSkeleton />
      </Box>
      <Box
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 200, sm: 260, md: 320 },
        }}
      >
        <Skeleton
          variant="rounded"
          width="100%"
          height="100%"
          sx={{ borderRadius: br, minHeight: { xs: 180, sm: 240, md: 280 } }}
        />
      </Box>
    </Card>
  );
};

const StatCardSkeleton = () => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card sx={{ borderRadius: br, minHeight: { xs: 120, sm: 140 } }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
          <Skeleton
            variant="rounded"
            width={44}
            height={44}
            sx={{ borderRadius: br, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="50%" height={20} />
            <Skeleton variant="text" width="35%" height={32} sx={{ mt: 0.5 }} />
            <Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

const TargetCardSkeleton = () => {
  const theme = useTheme();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card sx={{ borderRadius: br, display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <SectionHeaderSkeleton />
      </Box>
      <Box
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: 250, sm: 300, md: 320 },
        }}
      >
        <Skeleton
          variant="rounded"
          width="100%"
          height="100%"
          sx={{ borderRadius: br, minHeight: { xs: 200, sm: 260, md: 280 } }}
        />
      </Box>
    </Card>
  );
};

const YearlyTargetSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;
  return (
    <Card sx={{ borderRadius: br }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <SectionHeaderSkeleton />
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ flex: 2, minWidth: { xs: "100%", md: 280 } }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: { xs: 1.5, sm: 2 },
              }}
            >
              <Skeleton variant="text" width="30%" height={20} />
              <Stack direction="row" sx={{ gap: 1 }}>
                <Skeleton variant="text" width={60} height={20} />
                <Skeleton variant="text" width={80} height={20} />
              </Stack>
            </Stack>
            <Skeleton
              variant="rounded"
              width="100%"
              height={10}
              sx={{ borderRadius: br }}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: { xs: "100%", md: 140 },
              alignSelf: "center",
            }}
          >
            <Stack
              direction="row"
              sx={{
                gap: { xs: 4, md: 6 },
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Skeleton variant="text" width={80} height={32} />
                <Skeleton
                  variant="text"
                  width={60}
                  height={16}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Skeleton variant="text" width={100} height={32} />
                <Skeleton
                  variant="text"
                  width={60}
                  height={16}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

const AdminDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useDevice();
  const fmt = (val) => formatToIdr(val);

  const lowStockData = useMemo(() => {
    if (!data?.inventory?.lowStockProducts?.length)
      return { datasets: [], labels: [] };
    const validProducts = data.inventory.lowStockProducts.filter(
      (p) => p.stock >= 0
    );
    if (!validProducts.length) return { datasets: [], labels: [] };
    const colorCount = validProducts.length;
    return {
      datasets: [
        {
          backgroundColor: validProducts.map((_, i) => {
            const ratio = colorCount > 1 ? i / (colorCount - 1) : 0;
            return alpha(theme.palette.secondary.main, 0.85 - ratio * 0.12);
          }),
          data: validProducts.map((p) => p.stock),
          label: "Sisa Stok",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: validProducts.map((p) => p.name),
    };
  }, [data, theme]);

  const dailyTargetChartData = useMemo(() => {
    const ordersActual = data?.today?.orders || 0;
    const ordersTarget = data?.targets?.daily?.orders?.target || 0;
    const revenueActual = data?.today?.revenue || 0;
    const revenueTarget = data?.targets?.daily?.revenue?.target || 0;
    return {
      datasets: [
        {
          backgroundColor: [
            alpha(theme.palette.secondary.main, 0.85),
            alpha(theme.palette.secondary.main, 0.25),
          ],
          data: [ordersActual, ordersTarget],
          label: "Pesanan",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
        {
          backgroundColor: [
            alpha(theme.palette.secondary.main, 0.65),
            alpha(theme.palette.secondary.main, 0.15),
          ],
          data: [revenueActual, revenueTarget],
          label: "Pendapatan",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: ["Aktual", "Target"],
    };
  }, [data, theme]);

  const monthlyTargetChartData = useMemo(() => {
    const ordersActual = data?.thisMonth?.orders || 0;
    const ordersTarget = data?.targets?.monthly?.orders?.target || 0;
    const revenueActual = data?.thisMonth?.revenue || 0;
    const revenueTarget = data?.targets?.monthly?.revenue?.target || 0;
    return {
      datasets: [
        {
          backgroundColor: [
            alpha(theme.palette.secondary.main, 0.85),
            alpha(theme.palette.secondary.main, 0.25),
          ],
          data: [ordersActual, ordersTarget],
          label: "Pesanan",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
        {
          backgroundColor: [
            alpha(theme.palette.secondary.main, 0.65),
            alpha(theme.palette.secondary.main, 0.15),
          ],
          data: [revenueActual, revenueTarget],
          label: "Pendapatan",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: ["Aktual", "Target"],
    };
  }, [data, theme]);

  if (isLoading) {
    return (
      <Stack sx={{ gap: { xs: 2, sm: 3, md: 4 } }}>
        <HeaderSkeleton />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <ChartSkeleton />
          <Stack sx={{ gap: { xs: 2, sm: 2.5, md: 3 } }}>
            {[1, 2, 3].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </Stack>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <TargetCardSkeleton />
          <TargetCardSkeleton />
        </Box>
        <YearlyTargetSkeleton />
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
                  Dashboard Admin
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {data?.activeShift
                    ? `Shift aktif · ${data.activeShift.cashier}`
                    : "Belum ada shift aktif"}{" "}
                  ·{" "}
                  {formatDate(new Date(), {
                    dateStyle: isMobile ? "medium" : "full",
                  })}
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
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <SummaryCard
          color="secondary"
          icon={ShoppingCart}
          subtitle={
            data?.today?.orders > 0
              ? `Rata-rata ${fmt(data.today.averageOrderValue)}`
              : "Belum ada pesanan"
          }
          title="Pesanan Hari Ini"
          value={data?.today?.orders || 0}
          index={0}
        />
        <SummaryCard
          color="secondary"
          icon={DollarSign}
          subtitle="Total pemasukan"
          title="Pendapatan Hari Ini"
          value={fmt(data?.today?.revenue || 0)}
          index={1}
        />
        <SummaryCard
          color="secondary"
          icon={TrendingUp}
          subtitle={`Dari ${data?.thisMonth?.orders || 0} pesanan`}
          title="Pendapatan Bulan Ini"
          value={fmt(data?.thisMonth?.revenue || 0)}
          index={2}
        />
        <SummaryCard
          color="secondary"
          icon={Clock}
          subtitle={
            data?.pending?.orders > 0
              ? `${data.pending.orders} menunggu`
              : "Tidak ada antrean"
          }
          title="Pesanan Tertunda"
          value={data?.pending?.orders || 0}
          index={3}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <Card
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: 300, sm: 360, md: 420 },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  color="text.primary"
                  sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
                >
                  Stok Menipis & Habis
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {data?.inventory?.lowStockCount || 0} item butuh restock
                </Typography>
              </Box>
              <Box sx={sectionIconSx(theme)}>
                <BarChart3 size={18} strokeWidth={1.5} />
              </Box>
            </Stack>
          </Box>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {lowStockData.labels.length > 0 ? (
              <BarChart
                datasets={lowStockData.datasets}
                height={isMobile ? 200 : isTablet ? 260 : 320}
                labels={lowStockData.labels}
                legend={false}
                horizontal
              />
            ) : (
              <EmptyState
                title="Semua Stok Aman"
                description="Tidak ada produk di bawah batas minimum"
              >
                <EmptyStockSVG />
              </EmptyState>
            )}
          </Box>
        </Card>
        <Stack sx={{ gap: { xs: 2, sm: 2.5, md: 3 } }}>
          <SummaryCard
            color="secondary"
            icon={AlertCircle}
            subtitle="Stok habis"
            title="Stok Habis"
            value={data?.inventory?.outOfStockCount || 0}
            index={4}
          />
          <SummaryCard
            color="secondary"
            icon={AlertCircle}
            subtitle="Stok hampir habis"
            title="Stok Menipis"
            value={data?.inventory?.lowStockCount || 0}
            index={5}
          />
          <SummaryCard
            color="secondary"
            icon={DollarSign}
            subtitle="Total nilai stok"
            title="Nilai Stok"
            value={fmt(data?.inventory?.totalStockValue || 0)}
            index={6}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <SummaryCard
          color="secondary"
          icon={Users}
          subtitle="Total pelanggan terdaftar"
          title="Total Pelanggan"
          value={data?.customers?.totalCustomers || 0}
          index={7}
        />
        <SummaryCard
          color="secondary"
          icon={Users}
          subtitle="Pelanggan baru bulan ini"
          title="Pelanggan Baru"
          value={data?.customers?.newThisMonth || 0}
          index={8}
        />
        <SummaryCard
          color="secondary"
          icon={Car}
          subtitle="Total kendaraan terdaftar"
          title="Total Kendaraan"
          value={data?.customers?.totalVehicles || 0}
          index={9}
        />
        <SummaryCard
          color="secondary"
          icon={Package}
          subtitle={`${data?.inventory?.activeProducts || 0} produk tersedia`}
          title="Total Produk"
          value={data?.inventory?.totalProducts || 0}
          index={10}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  color="text.primary"
                  sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
                >
                  Target Harian
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Capaian vs target hari ini
                </Typography>
              </Box>
              <Box sx={sectionIconSx(theme)}>
                <Target size={18} strokeWidth={1.5} />
              </Box>
            </Stack>
          </Box>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              minHeight: { xs: 250, sm: 300, md: 320 },
            }}
          >
            <BarChart
              datasets={dailyTargetChartData.datasets}
              labels={dailyTargetChartData.labels}
              height={isMobile ? 200 : isTablet ? 260 : 280}
              legend
              stacked={false}
            />
          </Box>
        </Card>
        <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  color="text.primary"
                  sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
                >
                  Target Bulanan
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Capaian vs target bulan ini
                </Typography>
              </Box>
              <Box sx={sectionIconSx(theme)}>
                <CalendarDays size={18} strokeWidth={1.5} />
              </Box>
            </Stack>
          </Box>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              minHeight: { xs: 250, sm: 300, md: 320 },
            }}
          >
            <BarChart
              datasets={monthlyTargetChartData.datasets}
              labels={monthlyTargetChartData.labels}
              height={isMobile ? 200 : isTablet ? 260 : 280}
              legend
              stacked={false}
            />
          </Box>
        </Card>
      </Box>

      <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
  <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          color="text.primary"
          sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          Target Tahunan
        </Typography>
        <Typography
          variant={isMobile ? "caption" : "body2"}
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Capaian vs target tahun ini
        </Typography>
      </Box>
      <Box sx={sectionIconSx(theme)}>
        <Target size={18} strokeWidth={1.5} />
      </Box>
    </Stack>
  </Box>
  <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
    <Stack
      direction={{ xs: "column", md: "row" }}
      sx={{
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        flexWrap: "wrap",
        gap: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ flex: 2, minWidth: { xs: "100%", md: 280 } }}>
        <TargetItem
          label="Pendapatan"
          actual={data?.targets?.yearly?.revenue?.actual || 0}
          target={data?.targets?.yearly?.revenue?.target || 0}
          percentage={data?.targets?.yearly?.revenue?.percentage || 0}
          isCurrency
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          minWidth: { xs: "100%", md: 140 },
          alignSelf: "center",
        }}
      >
        <Stack
          direction="row"
          sx={{
            gap: { xs: 2, md: 0 },
            alignItems: "stretch",
            justifyContent: "stretch",
          }}
        >
          <Box
            sx={{
              flex: 1,
              py: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 2.5 },
              borderRadius: `${theme.shape.borderRadius}px`,
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.8),
              textAlign: "center",
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{ fontWeight: 700 }}
            >
              {data?.thisYear?.orders || 0}
            </Typography>
            <Typography
              variant={isMobile ? "caption" : "body2"}
              color="text.secondary"
            >
              Pesanan
            </Typography>
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              px: 2,
            }}
          >
            <Box
              sx={{
                width: "1px",
                height: 48,
                bgcolor: alpha(theme.palette.divider, 0.8),
              }}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              py: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 2.5 },
              borderRadius: `${theme.shape.borderRadius}px`,
              border: "1px solid",
              borderColor: alpha(theme.palette.divider, 0.8),
              textAlign: "center",
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{ fontWeight: 700 }}
            >
              {fmt(data?.thisYear?.averageOrderValue || 0)}
            </Typography>
            <Typography
              variant={isMobile ? "caption" : "body2"}
              color="text.secondary"
            >
              Rata-rata
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  </Box>
</Card>
    </Stack>
  );
};

AdminDashboard.propTypes = {
  data: PropTypes.shape({
    activeShift: PropTypes.object,
    inventory: PropTypes.object,
    pending: PropTypes.object,
    thisMonth: PropTypes.object,
    thisYear: PropTypes.object,
    today: PropTypes.object,
    customers: PropTypes.object,
    targets: PropTypes.object,
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default AdminDashboard;