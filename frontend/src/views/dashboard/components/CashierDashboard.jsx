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
      py: 6,
      gap: 2,
      textAlign: "center",
    }}
  >
    {children}
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  </Stack>
);

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Komponen SVG untuk menampilkan ilustrasi shift kosong.
 * @returns {JSX.Element} Ilustrasi SVG jam/shift
 */
const EmptyShiftSVG = () => (
  <Box
    component="svg"
    viewBox="0 0 200 120"
    sx={{ width: 100, height: 60, opacity: 0.12, color: "text.secondary" }}
  >
    <circle
      cx="100"
      cy="60"
      r="45"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M100 60V35"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M100 60L125 75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="100" cy="60" r="3" fill="currentColor" />
  </Box>
);

/**
 * Komponen SVG untuk menampilkan ilustrasi pesanan kosong.
 * @returns {JSX.Element} Ilustrasi SVG dokumen/order
 */
const EmptyOrdersSVG = () => (
  <Box
    component="svg"
    viewBox="0 0 200 120"
    sx={{ width: 100, height: 60, opacity: 0.12, color: "text.secondary" }}
  >
    <rect
      x="55"
      y="25"
      width="90"
      height="75"
      rx="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="68"
      y1="48"
      x2="132"
      y2="48"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="68"
      y1="60"
      x2="120"
      y2="60"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="68"
      y1="72"
      x2="108"
      y2="72"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Box>
);

/**
 * Dashboard Kasir - Menampilkan ringkasan penjualan harian, status shift aktif, progress order, dan pesanan terbaru.
 * @param {Object} props - Properti komponen
 * @param {Object} [props.data] - Data dashboard kasir
 * @param {Object} [props.data.activeShift] - Informasi shift yang sedang aktif
 * @param {number} props.data.activeShift.currentCashSales - Total penjualan tunai saat ini
 * @param {string} props.data.activeShift.openedAt - Waktu shift dibuka
 * @param {number} props.data.activeShift.orderCount - Jumlah pesanan dalam shift
 * @param {number} props.data.activeShift.startingCash - Saldo awal shift
 * @param {Array<Object>} [props.data.recentOrders] - Daftar pesanan terbaru
 * @param {Object} [props.data.recentOrders[].customer] - Data pelanggan
 * @param {string} props.data.recentOrders[].customer.name - Nama pelanggan
 * @param {string} props.data.recentOrders[].id - ID pesanan
 * @param {string} props.data.recentOrders[].orderNumber - Nomor pesanan
 * @param {string} props.data.recentOrders[].status - Status pesanan
 * @param {number} props.data.recentOrders[].total - Total harga pesanan
 * @param {Object} [props.data.todaySales] - Statistik penjualan hari ini
 * @param {number} props.data.todaySales.pendingOrders - Jumlah pesanan pending
 * @param {number} props.data.todaySales.todayOrders - Jumlah pesanan selesai hari ini
 * @param {number} props.data.todaySales.todaySales - Total pendapatan hari ini
 * @param {boolean} [props.isLoading] - Status loading data
 * @param {Function} [props.refetch] - Fungsi untuk memuat ulang data
 * @returns {JSX.Element} Komponen dashboard kasir
 */
const CashierDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

  /**
   * Data untuk DoughnutChart progress order.
   * Menghitung persentase penyelesaian dari pesanan selesai vs pending hari ini.
   * Jika tidak ada data, menampilkan chart kosong dengan nilai 0%.
   * @type {{ labels: string[], datasets: Array<{ data: number[], backgroundColor: string[], borderWidth: number }>, centerText: string, centerSubtext: string }}
   */
  const orderProgress = useMemo(() => {
    const completed = data?.todaySales?.todayOrders || 0;
    const pending = data?.todaySales?.pendingOrders || 0;
    const total = completed + pending;
    return {
      labels: ["Selesai", "Pending"],
      datasets: [
        {
          data: total > 0 ? [completed, pending] : [1, 0],
          backgroundColor: [
            theme.palette.secondary.main,
            alpha(theme.palette.secondary.main, 0.15),
          ],
          borderWidth: 0,
        },
      ],
      centerText:
        total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%",
      centerSubtext: "Penyelesaian",
    };
  }, [data, theme]);

  /** @type {string[]} */
  const tableHeaders = ["NO. ORDER", "PELANGGAN", "STATUS", "TOTAL"];

  /**
   * Merender satu baris tabel untuk pesanan yang diberikan.
   * @param {Object} order - Data pesanan
   * @param {string} order.orderNumber - Nomor pesanan
   * @param {Object} [order.customer] - Data pelanggan
   * @param {string} [order.customer.name] - Nama pelanggan
   * @param {string} order.status - Status pesanan
   * @param {number} order.total - Total harga pesanan
   * @returns {JSX.Element[]} Elemen sel tabel
   */
  const renderRow = (order) => {
    return [
      <Typography key="orderNumber" variant="body2">
        {order.orderNumber}
      </Typography>,
      <Typography key="customer" variant="body2" color="text.secondary">
        {order.customer?.name || "—"}
      </Typography>,
      <Chip
        key="status"
        label={OrderStatus[order.status] || order.status}
        color={statusColorMap[order.status] || "default"}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 500,
          fontSize: "0.75rem",
          height: 24,
        }}
      />,
      <Typography key="total" variant="body2">
        {formatToIdr(order.total)}
      </Typography>,
    ];
  };

  if (isLoading) {
    return (
      <Stack sx={{ gap: 5 }}>
        <Card
          sx={{
            p: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        >
          <Skeleton width={240} height={28} />
          <Skeleton width={160} height={16} sx={{ mt: 1 }} />
        </Card>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 5,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              sx={{
                p: 2.5,
                minHeight: 120,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Stack sx={{ gap: 1.5 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={32} />
                <Skeleton width="50%" height={14} />
              </Stack>
            </Card>
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 5,
          }}
        >
          <Stack sx={{ gap: 5 }}>
            <Card
              sx={{
                p: 3,
                minHeight: 200,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Skeleton width={120} height={24} />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="100%" height={20} sx={{ mt: 2 }} />
              ))}
            </Card>
            <Card
              sx={{
                p: 3,
                minHeight: 300,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Skeleton width={160} height={28} />
              <Skeleton width={200} height={16} sx={{ mt: 1 }} />
              <Skeleton
                variant="circular"
                width={180}
                height={180}
                sx={{ mx: "auto", mt: 3 }}
              />
            </Card>
          </Stack>
          <Card
            sx={{
              p: 3,
              minHeight: 520,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <Skeleton width={160} height={28} />
            <Skeleton width={200} height={16} sx={{ mt: 1 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                width="100%"
                height={44}
                sx={{ mt: 2 }}
              />
            ))}
          </Card>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: 5 }}>
      {/* Header Card */}
      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
       
          borderRadius: `${theme.shape.borderRadius}px`,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}
              >
                Dashboard Kasir
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {data?.activeShift ? "Shift aktif" : "Belum ada shift"} ·{" "}
                {formatDate(new Date(), { dateStyle: "full" })}
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
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 5,
        }}
      >
        <SummaryCard
          color="secondary"
          icon={ShoppingCart}
          title="Pesanan Hari Ini"
          value={data?.todaySales?.todayOrders || 0}
          subtitle={`${data?.todaySales?.pendingOrders || 0} pending`}
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
          subtitle={data?.activeShift ? "Shift berjalan" : "Buka shift"}
          index={2}
        />
      </Box>

      {/* Mid Row: Shift Info + Doughnut */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 5,
        }}
      >
        {/* Shift Info */}
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        >
          <Box sx={{ p: 3, pb: 2 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Shift Aktif
              </Typography>
              {data?.activeShift && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: theme.palette.success.main,
                    boxShadow: `0 0 6px ${alpha(
                      theme.palette.success.main,
                      0.4
                    )}`,
                  }}
                />
              )}
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            {data?.activeShift ? (
              <Stack sx={{ gap: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Awal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatToIdr(data.activeShift.startingCash)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Penjualan Tunai
                  </Typography>
                  <Typography variant="body2">
                    {formatToIdr(data.activeShift.currentCashSales || 0)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Order
                  </Typography>
                  <Typography variant="body2">
                    {data.activeShift.orderCount || 0} Pesanan
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Waktu Buka
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(data.activeShift.openedAt, {
                      timeStyle: "short",
                    })}
                  </Typography>
                </Stack>
              </Stack>
            ) : (
              <EmptyState
                title="Belum Ada Shift Aktif"
                description="Buka shift untuk mulai bertransaksi"
              >
                <EmptyShiftSVG />
              </EmptyState>
            )}
          </Box>
        </Card>

        {/* Order Progress Doughnut */}
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        >
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Progress Order
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Selesai vs pending hari ini
            </Typography>
          </Box>
          <Divider />
          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            {(data?.todaySales?.todayOrders || 0) +
              (data?.todaySales?.pendingOrders || 0) >
            0 ? (
              <>
                <Box sx={{ width: 200 }}>
                  <DoughnutChart
                    labels={orderProgress.labels}
                    datasets={orderProgress.datasets}
                    height={200}
                    centerText={orderProgress.centerText}
                    centerSubtext={orderProgress.centerSubtext}
                  />
                </Box>
                <Stack direction="row" sx={{ gap: 2, width: "100%" }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.secondary.main,
                      }}
                    >
                      {data?.todaySales?.todayOrders || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      Selesai
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: alpha(theme.palette.secondary.main, 0.5),
                      }}
                    >
                      {data?.todaySales?.pendingOrders || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      Pending
                    </Typography>
                  </Box>
                </Stack>
              </>
            ) : (
              <EmptyState
                title="Belum Ada Order"
                description="Belum ada pesanan yang tercatat hari ini"
              >
                <EmptyOrdersSVG />
              </EmptyState>
            )}
          </Box>
        </Card>
      </Box>

      {/* Recent Orders Table - Full Width using AppTable */}
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
      currentCashSales: PropTypes.number,
      openedAt: PropTypes.string,
      orderCount: PropTypes.number,
      startingCash: PropTypes.number,
    }),
    recentOrders: PropTypes.arrayOf(
      PropTypes.shape({
        customer: PropTypes.shape({ name: PropTypes.string }),
        id: PropTypes.string,
        orderNumber: PropTypes.string,
        status: PropTypes.string,
        total: PropTypes.number,
      })
    ),
    todaySales: PropTypes.shape({
      pendingOrders: PropTypes.number,
      todayOrders: PropTypes.number,
      todaySales: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default CashierDashboard;
