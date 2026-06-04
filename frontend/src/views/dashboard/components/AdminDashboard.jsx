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
  
} from "lucide-react";

import { formatDate, formatToIdr } from "@shared/utils";
import { BarChart, SummaryCard } from "@components";

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

const AdminDashboard = ({ data, isLoading, refetch }) => {
  const theme = useTheme();

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

  const hasData = useMemo(() => {
    return (
      (data?.today?.orders > 0) ||
      (data?.thisMonth?.orders > 0) ||
      (data?.customers?.totalCustomers > 0)
    );
  }, [data]);

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

      {/* Second Row - Additional Metrics */}
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
          icon={Users}
          subtitle="Total pelanggan terdaftar"
          title="Total Pelanggan"
          value={data?.customers?.totalCustomers || 0}
          index={4}
        />
        <SummaryCard
          color="secondary"
          icon={Users}
          subtitle="Pelanggan baru bulan ini"
          title="Pelanggan Baru"
          value={data?.customers?.newThisMonth || 0}
          index={5}
        />
        <SummaryCard
          color="secondary"
          icon={Car}
          subtitle="Total kendaraan terdaftar"
          title="Total Kendaraan"
          value={data?.customers?.totalVehicles || 0}
          index={6}
        />
        <SummaryCard
          color="secondary"
          icon={Package}
          subtitle={`${data?.inventory?.activeProducts || 0} produk tersedia`}
          title="Total Produk"
          value={data?.inventory?.totalProducts || 0}
          index={7}
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
        {/* Low Stock Section */}
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
              Stok Menipis & Habis
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

        {/* Right Stack - Inventory Stats */}
        <Stack sx={{ gap: 5 }}>
          <SummaryCard
            color="secondary"
            icon={AlertCircle}
            subtitle="Stok habis"
            title="Stok Habis"
            value={data?.inventory?.outOfStockCount || 0}
            index={8}
          />
          <SummaryCard
            color="secondary"
            icon={AlertCircle}
            subtitle="Stok hampir habis"
            title="Stok Menipis"
            value={data?.inventory?.lowStockCount || 0}
            index={9}
          />
          <SummaryCard
            color="secondary"
            icon={DollarSign}
            subtitle="Total nilai stok"
            title="Nilai Stok"
            value={formatToIdr(data?.inventory?.totalStockValue || 0)}
            index={10}
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
      outOfStockCount: PropTypes.number,
      totalProducts: PropTypes.number,
      totalStockValue: PropTypes.number,
      lowStockProducts: PropTypes.array,
    }),
    pending: PropTypes.shape({ orders: PropTypes.number }),
    thisMonth: PropTypes.shape({
      orders: PropTypes.number,
      revenue: PropTypes.number,
      newCustomers: PropTypes.number,
      activeCustomers: PropTypes.number,
    }),
    today: PropTypes.shape({
      averageOrderValue: PropTypes.number,
      orders: PropTypes.number,
      revenue: PropTypes.number,
    }),
    customers: PropTypes.shape({
      totalCustomers: PropTypes.number,
      newThisMonth: PropTypes.number,
      activeThisMonth: PropTypes.number,
      totalVehicles: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  refetch: PropTypes.func,
};

export default AdminDashboard;