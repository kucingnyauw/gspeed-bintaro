import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  Divider,
  IconButton,
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
} from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { BarChart, SummaryCard } from "@components";

/**
 * Komponen SVG untuk menampilkan ilustrasi stok kosong.
 * @returns {JSX.Element} Ilustrasi SVG stok
 */
const EmptyStockSVG = () => (
  <Box
    component="svg"
    viewBox="0 0 200 120"
    sx={{ width: 120, height: 72, opacity: 0.15, color: "text.secondary" }}
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

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Dashboard Admin - Menampilkan ringkasan bisnis, stok menipis, dan metrik utama untuk administrator.
 * @param {Object} props - Properti komponen
 * @param {Object} [props.data] - Data dashboard admin
 * @param {Object} [props.data.activeShift] - Informasi shift yang sedang aktif
 * @param {string} props.data.activeShift.cashier - Nama kasir yang bertugas
 * @param {number} props.data.activeShift.orderCount - Jumlah pesanan dalam shift
 * @param {string} props.data.activeShift.openedAt - Waktu shift dibuka
 * @param {number} props.data.activeShift.startingCash - Saldo awal shift
 * @param {Object} [props.data.inventory] - Data inventaris
 * @param {number} props.data.inventory.activeProducts - Jumlah produk aktif
 * @param {number} props.data.inventory.lowStockCount - Jumlah produk stok menipis
 * @param {number} props.data.inventory.totalProducts - Total produk
 * @param {Array<{name: string, stock: number}>} [props.data.inventory.lowStockProducts] - Daftar produk dengan stok menipis
 * @param {Object} [props.data.pending] - Data pesanan tertunda
 * @param {number} props.data.pending.orders - Jumlah pesanan tertunda
 * @param {Object} [props.data.thisMonth] - Statistik bulan ini
 * @param {number} props.data.thisMonth.orders - Jumlah pesanan bulan ini
 * @param {number} props.data.thisMonth.revenue - Pendapatan bulan ini
 * @param {Object} [props.data.today] - Statistik hari ini
 * @param {number} props.data.today.averageOrderValue - Rata-rata nilai pesanan
 * @param {number} props.data.today.orders - Jumlah pesanan hari ini
 * @param {number} props.data.today.revenue - Pendapatan hari ini
 * @param {Object} [props.data.customers] - Data pelanggan
 * @param {number} props.data.customers.newThisMonth - Pelanggan baru bulan ini
 * @param {number} props.data.customers.activeThisMonth - Pelanggan aktif bulan ini
 * @param {boolean} [props.isLoading] - Status loading data
 * @param {Function} [props.refetch] - Fungsi untuk memuat ulang data
 * @returns {JSX.Element} Komponen dashboard admin
 */
const AdminDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

  /**
   * Data untuk BarChart stok menipis.
   * Memfilter produk dengan stok valid (>= 0) dan memformat untuk ditampilkan dalam grafik batang horizontal.
   * @type {{ datasets: Array<{ backgroundColor: string[], data: number[], label: string, borderRadius: number, borderSkipped: boolean }>, labels: string[] }}
   */
  const lowStockData = useMemo(() => {
    if (!data?.inventory?.lowStockProducts?.length)
      return { datasets: [], labels: [] };
    const validProducts = data.inventory.lowStockProducts.filter(
      (p) => p.stock >= 0
    );
    if (!validProducts.length) return { datasets: [], labels: [] };
    return {
      datasets: [
        {
          backgroundColor: validProducts.map((_, i) =>
            alpha(theme.palette.secondary.main, 0.85 - i * 0.12)
          ),
          data: validProducts.map((p) => p.stock),
          label: "Sisa Stok",
          borderRadius: theme.shape.borderRadius,
          borderSkipped: false,
        },
      ],
      labels: validProducts.map((p) => p.name),
    };
  }, [data, theme]);

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
          <Skeleton width={300} height={16} sx={{ mt: 1 }} />
        </Card>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
            gap: 5,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              sx={{
                p: 2.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Stack sx={{ gap: 1.5 }}>
                <Skeleton width="40%" height={20} />
                <Skeleton width="60%" height={40} />
                <Skeleton width="50%" height={16} />
              </Stack>
            </Card>
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
            gap: 5,
          }}
        >
          <Card
            sx={{
              p: 3,
              minHeight: 420,
              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: "none",
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <Skeleton width={200} height={28} />
            <Skeleton
              variant="rounded"
              width="100%"
              height={300}
              sx={{ mt: 3 }}
            />
          </Card>
          <Stack sx={{ gap: 5 }}>
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                sx={{
                  p: 2.5,
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                <Stack sx={{ gap: 1.5 }}>
                  <Skeleton width="50%" height={20} />
                  <Skeleton width="40%" height={36} />
                </Stack>
              </Card>
            ))}
          </Stack>
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
          boxShadow: "none",
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
                Dashboard Admin
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {data?.activeShift
                  ? `Shift aktif · ${data.activeShift.cashier}`
                  : "Belum ada shift aktif"}{" "}
                · {formatDate(new Date(), { dateStyle: "full" })}
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

      {/* Summary Row 1 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 5,
        }}
      >
        <SummaryCard
          color="secondary"
          icon={ShoppingCart}
          subtitle={
            data?.today?.orders > 0
              ? `Rata-rata ${formatToIdr(data.today.averageOrderValue)}`
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
          value={formatToIdr(data?.today?.revenue || 0)}
          index={1}
        />
        <SummaryCard
          color="secondary"
          icon={TrendingUp}
          subtitle={`Dari ${data?.thisMonth?.orders || 0} pesanan`}
          title="Pendapatan Bulan Ini"
          value={formatToIdr(data?.thisMonth?.revenue || 0)}
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

      {/* Asymmetric Bottom */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: 5,
        }}
      >
        <Card
          sx={{
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: "none",
            borderRadius: `${theme.shape.borderRadius}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Stok Menipis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {data?.inventory?.lowStockCount || 0} item butuh restock
            </Typography>
          </Box>
          <Divider />
          <Box
            sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            {lowStockData.labels.length > 0 ? (
              <BarChart
                datasets={lowStockData.datasets}
                height={320}
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

        <Stack sx={{ gap: 5 }}>
          <SummaryCard
            color="secondary"
            icon={Users}
            subtitle={`${data?.customers?.newThisMonth || 0} pelanggan baru`}
            title="Pelanggan Aktif"
            value={data?.customers?.activeThisMonth || 0}
            index={4}
          />
          <SummaryCard
            color="secondary"
            icon={Package}
            subtitle={`${data?.inventory?.activeProducts || 0} produk tersedia`}
            title="Total Produk"
            value={data?.inventory?.totalProducts || 0}
            index={5}
          />
          <SummaryCard
            color="secondary"
            icon={AlertCircle}
            subtitle="Stok hampir habis"
            title="Butuh Restock"
            value={data?.inventory?.lowStockCount || 0}
            index={6}
          />
        </Stack>
      </Box>
    </Stack>
  );
};

AdminDashboard.propTypes = {
  data: PropTypes.shape({
    activeShift: PropTypes.shape({
      cashier: PropTypes.string,
      orderCount: PropTypes.number,
      openedAt: PropTypes.string,
      startingCash: PropTypes.number,
    }),
    inventory: PropTypes.shape({
      activeProducts: PropTypes.number,
      lowStockCount: PropTypes.number,
      totalProducts: PropTypes.number,
      lowStockProducts: PropTypes.array,
    }),
    pending: PropTypes.shape({ orders: PropTypes.number }),
    thisMonth: PropTypes.shape({
      orders: PropTypes.number,
      revenue: PropTypes.number,
    }),
    today: PropTypes.shape({
      averageOrderValue: PropTypes.number,
      orders: PropTypes.number,
      revenue: PropTypes.number,
    }),
    customers: PropTypes.shape({
      newThisMonth: PropTypes.number,
      activeThisMonth: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default AdminDashboard;