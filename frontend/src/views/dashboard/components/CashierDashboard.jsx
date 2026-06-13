/**
 * CashierDashboard - Komponen dashboard kasir untuk menampilkan ringkasan penjualan harian,
 * status shift aktif, progress order, dan pesanan terbaru.
 *
 * Sepenuhnya mengandalkan nilai dari theme MUI untuk styling.
 * Responsive di semua device dengan skeleton loading yang identik.
 *
 * @component
 * @param {Object} props - Properti komponen
 * @param {Object} [props.data] - Data dashboard kasir
 * @param {boolean} [props.isLoading] - Status loading data
 * @param {Function} [props.refetch] - Fungsi untuk memuat ulang data
 * @returns {JSX.Element} Komponen dashboard kasir
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
import { Clock, DollarSign, RotateCcw, ShoppingCart } from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { DoughnutChart, SummaryCard, AppTable } from "@components";
import { useDevice } from "@hooks";

/**
 * Komponen SVG untuk menampilkan ilustrasi shift kosong.
 *
 * @component
 * @returns {JSX.Element} Ilustrasi SVG jam/shift
 */
const EmptyShiftSVG = () => (
  <Box component="svg" viewBox="0 0 200 120" sx={{ width: { xs: 80, sm: 100 }, height: { xs: 48, sm: 60 }, opacity: 0.12, color: "text.secondary" }}>
    <circle cx="100" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M100 60V35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M100 60L125 75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="100" cy="60" r="3" fill="currentColor" />
  </Box>
);

/**
 * Komponen SVG untuk menampilkan ilustrasi pesanan kosong.
 *
 * @component
 * @returns {JSX.Element} Ilustrasi SVG dokumen/order
 */
const EmptyOrdersSVG = () => (
  <Box component="svg" viewBox="0 0 200 120" sx={{ width: { xs: 80, sm: 100 }, height: { xs: 48, sm: 60 }, opacity: 0.12, color: "text.secondary" }}>
    <rect x="55" y="25" width="90" height="75" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="68" y1="48" x2="132" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="68" y1="60" x2="120" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="68" y1="72" x2="108" y2="72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Box>
);

/**
 * Komponen untuk menampilkan pesan ketika data kosong.
 *
 * @component
 * @param {Object} props - Properti komponen
 * @param {string} props.title - Judul pesan
 * @param {string} props.description - Deskripsi pesan
 * @param {React.ReactNode} props.children - Konten ilustrasi atau elemen tambahan
 * @returns {JSX.Element} Tampilan status kosong
 */
const EmptyState = ({ title, description, children }) => {
  const { isMobile } = useDevice();
  return (
    <Stack sx={{ alignItems: "center", justifyContent: "center", py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 0 }, gap: { xs: 1.5, sm: 2 }, textAlign: "center", minHeight: { xs: 180, sm: 220 } }}>
      {children}
      <Stack sx={{ gap: { xs: 0.25, sm: 0.5 } }}>
        <Typography variant={isMobile ? "subtitle2" : "body2"} sx={{ fontWeight: 600 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{description}</Typography>
      </Stack>
    </Stack>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Skeleton untuk header card.
 *
 * @component
 * @returns {JSX.Element}
 */
const HeaderSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  return (
    <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width={isMobile ? "60%" : "40%"} height={isMobile ? 28 : 32} />
            <Skeleton variant="text" width={isMobile ? "80%" : "50%"} height={16} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
        </Stack>
      </Box>
    </Card>
  );
};

/**
 * Skeleton untuk summary card.
 *
 * @component
 * @returns {JSX.Element}
 */
const SummaryCardSkeleton = () => {
  const theme = useTheme();
  return (
    <Card sx={{ borderRadius: `${theme.shape.borderRadius}px`, height: "100%", minHeight: { xs: 100, sm: 120 } }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="50%" height={14} />
      </Box>
    </Card>
  );
};

/**
 * Skeleton untuk shift info card.
 *
 * @component
 * @returns {JSX.Element}
 */
const ShiftInfoSkeleton = () => {
  const theme = useTheme();
  return (
    <Card sx={{ borderRadius: `${theme.shape.borderRadius}px`, height: "100%" }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton variant="text" width={120} height={28} />
          <Skeleton variant="circular" width={8} height={8} />
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack sx={{ gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="25%" height={20} />
              </Stack>
              {i < 4 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>
      </Box>
    </Card>
  );
};

/**
 * Skeleton untuk progress order card.
 *
 * @component
 * @returns {JSX.Element}
 */
const ProgressOrderSkeleton = () => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  return (
    <Card sx={{ borderRadius: `${theme.shape.borderRadius}px`, height: "100%" }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <Skeleton variant="text" width={isMobile ? 140 : 160} height={28} />
        <Skeleton variant="text" width={isMobile ? 180 : 200} height={16} sx={{ mt: 0.5 }} />
      </Box>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <Skeleton variant="circular" width={isMobile ? 140 : 180} height={isMobile ? 140 : 180} />
        <Stack direction="row" sx={{ gap: 2, width: "100%" }}>
          <Skeleton variant="rounded" width="100%" height={isMobile ? 60 : 80} sx={{ borderRadius: `${theme.shape.borderRadius}px`, flex: 1 }} />
          <Skeleton variant="rounded" width="100%" height={isMobile ? 60 : 80} sx={{ borderRadius: `${theme.shape.borderRadius}px`, flex: 1 }} />
        </Stack>
      </Box>
    </Card>
  );
};

/**
 * Skeleton untuk table.
 *
 * @component
 * @returns {JSX.Element}
 */
const TableSkeleton = () => {
  const theme = useTheme();
  return (
    <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
        <Skeleton variant="text" width={160} height={28} />
        <Skeleton variant="text" width={200} height={16} sx={{ mt: 0.5 }} />
      </Box>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Skeleton variant="rounded" width="100%" height={44} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
      </Box>
    </Card>
  );
};

/**
 * Dashboard Kasir - Menampilkan ringkasan penjualan harian, status shift aktif,
 * progress order, dan pesanan terbaru.
 *
 * @component
 * @param {Object} props - Properti komponen
 * @param {Object} [props.data] - Data dashboard kasir
 * @param {boolean} [props.isLoading] - Status loading data
 * @param {Function} [props.refetch] - Fungsi untuk memuat ulang data
 * @returns {JSX.Element} Komponen dashboard kasir
 */
const CashierDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useDevice();

  /**
   * Data untuk DoughnutChart progress order.
   *
   * @type {{ labels: string[], datasets: Array<{ data: number[], backgroundColor: string[], borderWidth: number }>, centerText: string, centerSubtext: string }}
   */
  const orderProgress = useMemo(() => {
    const completed = data?.todaySales?.todayOrders || 0;
    const pending = data?.todaySales?.pendingOrders || 0;
    const total = completed + pending;
    return {
      labels: ["Selesai", "Pending"],
      datasets: [{
        data: total > 0 ? [completed, pending] : [1, 0],
        backgroundColor: [theme.palette.secondary.main, alpha(theme.palette.secondary.main, 0.15)],
        borderWidth: 0,
      }],
      centerText: total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%",
      centerSubtext: "Penyelesaian",
    };
  }, [data?.todaySales?.todayOrders, data?.todaySales?.pendingOrders, theme]);

  /** @type {string[]} */
  const tableHeaders = ["NO. ORDER", "PELANGGAN", "STATUS", "TOTAL"];

  /**
   * Merender satu baris tabel untuk pesanan yang diberikan.
   *
   * @param {Object} order - Data pesanan
   * @returns {JSX.Element[]} Elemen sel tabel
   */
  const renderRow = (order) => {
    return [
      <Typography key="orderNumber" variant="body2" noWrap>{order.orderNumber}</Typography>,
      <Typography key="customer" variant="body2" color="text.secondary" noWrap>{order.customer?.name || "—"}</Typography>,
      <Chip key="status" label={OrderStatus[order.status] || order.status} color={statusColorMap[order.status] || "default"} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }} />,
      <Typography key="total" variant="body2" noWrap>{formatToIdr(order.total)}</Typography>,
    ];
  };

  if (isLoading) {
    return (
      <Stack sx={{ gap: { xs: 3, sm: 4, md: 5 } }}>
        <HeaderSkeleton />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
          {[1, 2, 3].map((i) => (<SummaryCardSkeleton key={i} />))}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
          <ShiftInfoSkeleton />
          <ProgressOrderSkeleton />
        </Box>
        <TableSkeleton />
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: { xs: 3, sm: 4, md: 5 } }}>
      {/* Header Card */}
      <Card sx={{ borderRadius: `${theme.shape.borderRadius}px` }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant={isMobile ? "h6" : "h5"} color="text.primary" sx={{ fontWeight: 600, letterSpacing: "-0.01em", wordBreak: "break-word" }}>
                Dashboard Kasir
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {data?.activeShift ? `Shift aktif · ${data.activeShift.id?.slice(0, 8)}` : "Belum ada shift"} · {formatDate(new Date(), { dateStyle: isMobile ? "medium" : "full" })}
              </Typography>
            </Box>
            <Tooltip title="Refresh data" placement="bottom">
              <span>
                <IconButton
                  onClick={() => refetch?.()}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    borderRadius: `${theme.shape.borderRadius}px`,
                    color: theme.palette.text.secondary,
                    alignSelf: { xs: "flex-end", sm: "center" },
                    "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.08), borderColor: alpha(theme.palette.secondary.main, 0.4), color: theme.palette.secondary.main },
                  }}
                >
                  <RotateCcw size={isMobile ? 14 : 16} strokeWidth={2} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Card>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
        <SummaryCard
          color="secondary"
          icon={ShoppingCart}
          title="Pesanan Hari Ini"
          value={(data?.todaySales?.todayOrders || 0) + (data?.todaySales?.pendingOrders || 0)}
          subtitle={`${data?.todaySales?.todayOrders || 0} selesai, ${data?.todaySales?.pendingOrders || 0} pending`}
          index={0}
        />
        <SummaryCard
          color="secondary"
          icon={DollarSign}
          title="Pendapatan Hari Ini"
          value={formatToIdr(data?.todaySales?.todaySales || 0)}
          subtitle="Total pemasukan"
          index={1}
        />
        <SummaryCard
          color="secondary"
          icon={Clock}
          title="Status Shift"
          value={data?.activeShift ? "Aktif" : "Belum"}
          subtitle={data?.activeShift ? `Shift #${data.activeShift.id?.slice(0, 8)}` : "Buka shift"}
          index={2}
        />
      </Box>

      {/* Shift Info | Progress Order - 2 Kolom Sejajar */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
        {/* Shift Info */}
        <Card sx={{ borderRadius: `${theme.shape.borderRadius}px`, height: "100%" }}>
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} color="text.primary" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
                Shift Aktif
              </Typography>
              {data?.activeShift && (
                <Box sx={{ width: { xs: 6, sm: 8 }, height: { xs: 6, sm: 8 }, borderRadius: "50%", bgcolor: theme.palette.success.main, boxShadow: `0 0 6px ${alpha(theme.palette.success.main, 0.4)}` }} />
              )}
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            {data?.activeShift ? (
              <Stack sx={{ gap: { xs: 1.5, sm: 2 } }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">Saldo Awal</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 600 }}>{formatToIdr(data.activeShift.startingCash)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">Penjualan Tunai</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"}>{formatToIdr(data.activeShift.currentCashSales || 0)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">Total Order</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"}>{data.activeShift.orderCount || 0} Pesanan</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                  <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">Waktu Buka</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"}>{formatDate(data.activeShift.openedAt, { timeStyle: "short" })}</Typography>
                </Stack>
              </Stack>
            ) : (
              <EmptyState title="Belum Ada Shift Aktif" description="Buka shift untuk mulai bertransaksi"><EmptyShiftSVG /></EmptyState>
            )}
          </Box>
        </Card>

        {/* Progress Order */}
        <Card sx={{ borderRadius: `${theme.shape.borderRadius}px`, height: "100%" }}>
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} color="text.primary" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
              Progress Order
            </Typography>
            <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary" sx={{ mt: 0.5 }}>
              Selesai vs pending hari ini
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: { xs: 2, sm: 3 }, flexGrow: 1 }}>
            {(data?.todaySales?.todayOrders || 0) + (data?.todaySales?.pendingOrders || 0) > 0 ? (
              <>
                <Box sx={{ width: { xs: 140, sm: 180, md: 200 }, height: { xs: 140, sm: 180, md: 200 } }}>
                  <DoughnutChart labels={orderProgress.labels} datasets={orderProgress.datasets} height={isMobile ? 140 : isTablet ? 180 : 200} centerText={orderProgress.centerText} centerSubtext={orderProgress.centerSubtext} />
                </Box>
                <Stack direction="row" sx={{ gap: { xs: 1.5, sm: 2 }, width: "100%" }}>
                  <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, borderRadius: `${theme.shape.borderRadius}px`, textAlign: "center" }}>
                    <Typography variant={isMobile ? "h6" : "h5"} component="span" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                      {data?.todaySales?.todayOrders || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>Selesai</Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, borderRadius: `${theme.shape.borderRadius}px`, textAlign: "center" }}>
                    <Typography variant={isMobile ? "h6" : "h5"} component="span" sx={{ fontWeight: 600, color: alpha(theme.palette.secondary.main, 0.5) }}>
                      {data?.todaySales?.pendingOrders || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>Pending</Typography>
                  </Box>
                </Stack>
              </>
            ) : (
              <EmptyState title="Belum Ada Order" description="Belum ada pesanan yang tercatat hari ini"><EmptyOrdersSVG /></EmptyState>
            )}
          </Box>
        </Card>
      </Box>

      {/* Recent Orders Table */}
      <AppTable
        title="Pesanan Terbaru"
        subtitle={`${data?.recentOrders?.length || 0} pesanan terakhir`}
        headers={tableHeaders}
        data={data?.recentOrders || []}
        renderRow={renderRow}
        count={1}
        page={1}
        isLoading={isLoading}
        emptyStateMessage="Belum ada pesanan yang tercatat"
        enableMultiSelect={false}
        hideRowsPerPage
      />
    </Stack>
  );
};

CashierDashboard.propTypes = {
  data: PropTypes.shape({
    activeShift: PropTypes.shape({
      id: PropTypes.string,
      openedAt: PropTypes.string,
      startingCash: PropTypes.number,
      currentCashSales: PropTypes.number,
      orderCount: PropTypes.number,
    }),
    recentOrders: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      orderNumber: PropTypes.string,
      total: PropTypes.number,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      customer: PropTypes.shape({ name: PropTypes.string }),
    })),
    todaySales: PropTypes.shape({
      todayOrders: PropTypes.number,
      todaySales: PropTypes.number,
      pendingOrders: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default CashierDashboard;