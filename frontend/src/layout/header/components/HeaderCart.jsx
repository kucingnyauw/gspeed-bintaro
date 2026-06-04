/**
 * HeaderCart - Cart dialog for managing order items, customer selection, and checkout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 *
 * @returns {JSX.Element} Rendered header cart dialog
 */
import { useState } from "react";
import { Controller } from "react-hook-form";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";

import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
  Badge,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { getCustomers } from "@api/customerApi.js";
import { formatToIdr } from "@shared/utils";
import { ProductType } from "@shared/constant";
import { useDevice, useDebounce } from "@hooks";
import { AsyncAutocomplete } from "@components";
import { useHeaderCart } from "../hooks/useHeaderCart";

/**
 * SVG ilustrasi untuk keranjang kosong.
 * Menampilkan ikon shopping bag dengan smiley face.
 *
 * @param {Object} props - Props komponen
 * @param {number} [props.opacity=0.15] - Tingkat opacity ilustrasi
 * @returns {JSX.Element} Ilustrasi SVG
 */
const EmptyCartSvg = ({ opacity = 0.15 }) => (
  <Box
    component="svg"
    viewBox="0 0 120 120"
    sx={{
      width: 100,
      height: 100,
      opacity,
      color: "text.secondary",
    }}
  >
    {/* Shopping Bag Body */}
    <path
      d="M35 40 L35 30 C35 16.2 46.2 5 60 5 C73.8 5 85 16.2 85 30 L85 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Shopping Bag */}
    <rect
      x="25"
      y="40"
      width="70"
      height="65"
      rx="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    {/* Handle */}
    <path
      d="M40 40 L40 25 C40 17.8 37 12 30 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M80 40 L80 25 C80 17.8 83 12 90 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Smiley Face */}
    <circle cx="60" cy="68" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="54" cy="65" r="2" fill="currentColor" />
    <circle cx="66" cy="65" r="2" fill="currentColor" />
    <path
      d="M54 73 Q60 78 66 73"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Box>
);

/**
 * QuantityControl - Komponen kontrol increment/decrement quantity item.
 *
 * @param {Object} props - Props komponen
 * @param {number} props.quantity - Quantity saat ini
 * @param {number} props.maxLimit - Batas maksimal quantity
 * @param {Function} props.onChange - Handler perubahan quantity (+1 atau -1)
 * @param {boolean} [props.disabled=false] - Status disabled
 * @returns {JSX.Element} Komponen kontrol quantity
 */
const QuantityControl = ({ quantity, maxLimit, onChange, disabled }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(-1)}
        disabled={disabled || quantity <= 1}
        sx={{ borderRadius: 0 }}
      >
        <Minus size={14} strokeWidth={1.5} />
      </IconButton>
      <Typography
        variant="body2"
        sx={{
          minWidth: 32,
          textAlign: "center",
          userSelect: "none",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 600,
          px: 0.5,
        }}
      >
        {quantity}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange(1)}
        disabled={disabled || quantity >= maxLimit}
        sx={{ borderRadius: 0 }}
      >
        <Plus size={14} strokeWidth={1.5} />
      </IconButton>
    </Stack>
  );
};

/**
 * CartItemCard - Kartu item dalam keranjang belanja.
 * Menampilkan informasi produk, kontrol quantity, dan total harga per item.
 *
 * @param {Object} props - Props komponen
 * @param {Object} props.item - Data item keranjang
 * @param {string} props.item.productId - ID produk
 * @param {string} props.item.productName - Nama produk
 * @param {string} props.item.type - Tipe produk (SERVICE/SPAREPART)
 * @param {number} props.item.unitPrice - Harga satuan
 * @param {number} props.item.quantity - Jumlah
 * @param {Object} [props.item.image] - Gambar produk
 * @param {number} [props.item.maxQuantity] - Maksimal quantity
 * @param {number} [props.item.productStock] - Stok produk
 * @param {Function} props.onRemove - Handler hapus item
 * @param {Function} props.onQuantityChange - Handler perubahan quantity
 * @param {boolean} [props.disabled=false] - Status disabled
 * @returns {JSX.Element} Kartu item keranjang
 */
const CartItemCard = ({ item, onRemove, onQuantityChange, disabled }) => {
  const theme = useTheme();
  const isSparepart = item.type === ProductType.SPAREPART;
  const maxLimit = item.maxQuantity || item.productStock || 999;
  const itemTotal = (item.unitPrice || 0) * item.quantity;

  return (
    <Card
      sx={{
        opacity: disabled ? 0.6 : 1,
        transition: theme.transitions.create("opacity"),
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        boxShadow: "none",
        "&:hover": {
          borderColor: alpha(theme.palette.secondary.main, 0.2),
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", gap: 2 }}>
          {/* Avatar Produk */}
          <Avatar
            alt={item.productName}
            src={item.image?.url || ""}
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: `${theme.shape.borderRadius}px`,
              bgcolor: !item.image?.url
                ? alpha(theme.palette.secondary.main, 0.08)
                : "transparent",
              color: !item.image?.url ? theme.palette.secondary.main : "transparent",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            {!item.image?.url && item.productName?.charAt(0)?.toUpperCase()}
          </Avatar>

          {/* Detail Item */}
          <Stack sx={{ flex: 1, minWidth: 0, gap: 1.5 }}>
            {/* Header: Nama & Hapus */}
            <Stack
              direction="row"
              sx={{
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Stack sx={{ minWidth: 0, gap: 0.5 }}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={isSparepart ? "Sparepart" : "Servis"}
                    size="small"
                    variant="outlined"
                    color={isSparepart ? "warning" : "secondary"}
                    sx={{ height: 22, fontWeight: 500 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {item.productName}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {formatToIdr(item.unitPrice || 0)} × {item.quantity}
                </Typography>
              </Stack>

              <Stack sx={{ alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                {/* Delete Button */}
                <IconButton
                  size="small"
                  onClick={() => onRemove(item.productId)}
                  disabled={disabled}
                  sx={{
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    color: "text.secondary",
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color"],
                      { duration: theme.transitions.duration.shorter }
                    ),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.06),
                      borderColor: alpha(theme.palette.error.main, 0.4),
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </IconButton>
                {/* Total per Item */}
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatToIdr(itemTotal)}
                </Typography>
              </Stack>
            </Stack>

            {/* Quantity Control & Stok (hanya untuk Sparepart) */}
            {isSparepart && (
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <QuantityControl
                  quantity={item.quantity}
                  maxLimit={maxLimit}
                  onChange={(inc) =>
                    onQuantityChange(item.productId, item.quantity, inc)
                  }
                  disabled={disabled}
                />
                <Typography variant="caption" color="text.disabled">
                  Stok: {maxLimit}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * PriceRow - Komponen baris harga untuk summary pembayaran.
 *
 * @param {Object} props - Props komponen
 * @param {string} props.label - Label harga
 * @param {number} props.value - Nilai harga
 * @param {boolean} [props.isPending=false] - Status loading
 * @param {number} [props.skeletonWidth=80] - Lebar skeleton saat loading
 * @param {boolean} [props.bold=false] - Apakah teks bold
 * @param {string} [props.color] - Warna teks
 * @returns {JSX.Element} Baris harga
 */
const PriceRow = ({ label, value, isPending, skeletonWidth = 80, bold, color }) => (
  <Stack
    direction="row"
    sx={{ justifyContent: "space-between", alignItems: "center" }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {isPending ? (
      <Skeleton width={skeletonWidth} height={20} />
    ) : (
      <Typography
        variant={bold ? "subtitle1" : "body2"}
        sx={{ fontVariantNumeric: "tabular-nums", fontWeight: bold ? 700 : 400 }}
        color={color}
      >
        {formatToIdr(value)}
      </Typography>
    )}
  </Stack>
);

/**
 * HeaderCart - Dialog keranjang belanja untuk mengelola item pesanan, pemilihan pelanggan, dan checkout.
 *
 * Fitur:
 * - Manajemen item keranjang (tambah, kurang, hapus)
 * - Pencarian dan pemilihan pelanggan dengan AsyncAutocomplete
 * - Pemilihan kendaraan pelanggan
 * - Perhitungan otomatis subtotal, pajak, dan total
 * - Tampilan responsif (dialog di desktop, fullscreen di mobile)
 * - Empty state dengan ilustrasi
 *
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka/tutup
 * @param {Function} props.onClose - Handler untuk menutup dialog
 * @returns {JSX.Element} Dialog keranjang belanja
 */
const HeaderCart = ({ open, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const [customerSearch, setCustomerSearch] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    selectedCustomer,
    customerVehicles,
    items,
    isCalculatePending,
    isSubmitting,
    calcData,
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    onSubmit,
  } = useHeaderCart(open, onClose);

  /** @type {boolean} Status processing (submit atau kalkulasi) */
  const isProcessing = isSubmitting || isCalculatePending;

  /**
   * Handler perubahan quantity item.
   * Positive increment untuk tambah, negative untuk kurang.
   *
   * @param {string} productId - ID produk
   * @param {number} currentQty - Quantity saat ini
   * @param {number} inc - Increment (+1 atau -1)
   */
  const handleQuantityChange = (productId, currentQty, inc) => {
    if (inc > 0) {
      handleIncrement(productId);
    } else {
      handleDecrement(productId);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "100%" : "85vh",
          maxHeight: isMobile ? "100%" : "90vh",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
            bgcolor: alpha(theme.palette.background.default, 0.6),
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <Badge badgeContent={items.length} color="secondary" max={99}>
              <ShoppingBag size={20} strokeWidth={1.5} />
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                Keranjang
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length > 0
                  ? `${items.length} item dalam keranjang`
                  : "Keranjang kosong"}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={onClose}
            disabled={isProcessing}
            size="small"
            sx={{
              color: "text.secondary",
              borderRadius: `${theme.shape.borderRadius}px`,
              "&:hover": {
                color: "error.main",
                bgcolor: alpha(theme.palette.error.main, 0.08),
              },
            }}
          >
            <X size={20} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          {items.length === 0 ? (
            <Stack
              sx={{
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                py: 6,
              }}
            >
              <EmptyCartSvg />
              <Stack sx={{ gap: 1, alignItems: "center", textAlign: "center" }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Keranjang masih kosong
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tambahkan item untuk memulai transaksi
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Stack sx={{ gap: 3 }}>
              {/* Customer Section */}
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Informasi Pelanggan
                  </Typography>

                  <Controller
                    name="customer"
                    control={control}
                    render={({ field, fieldState }) => (
                      <AsyncAutocomplete
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue("vehicle", null);
                        }}
                        onInputChange={setCustomerSearch}
                        queryKey={["customers-list"]}
                        fetchOptions={async (search) => {
                          const res = await getCustomers({
                            page: 1,
                            limit: 10,
                            search,
                          });
                          return res?.data || [];
                        }}
                        getOptionLabel={(o) => o?.name || ""}
                        placeholder="Cari pelanggan..."
                        disabled={isProcessing}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        renderOption={(props, option) => {
                          const { key, ...rest } = props;
                          return (
                            <Box key={key} component="li" {...rest}>
                              <Stack>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {option.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.phone || "Tanpa nomor telepon"}
                                </Typography>
                              </Stack>
                            </Box>
                          );
                        }}
                      />
                    )}
                  />

                  {selectedCustomer && (
                    <Box sx={{ mt: 2 }}>
                      <Controller
                        name="vehicle"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Autocomplete
                            size="small"
                            options={customerVehicles}
                            getOptionLabel={(o) => o.plateNumber || o.brand || ""}
                            value={field.value}
                            onChange={(_, v) => field.onChange(v)}
                            disabled={!customerVehicles.length || isProcessing}
                            isOptionEqualToValue={(a, b) => a.id === b.id}
                            noOptionsText="Tidak ada kendaraan"
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Pilih kendaraan"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                              />
                            )}
                            renderOption={(props, option) => (
                              <li {...props}>
                                <Stack>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {option.plateNumber || option.brand}
                                  </Typography>
                                  {option.brand && option.model && (
                                    <Typography variant="caption" color="text.secondary">
                                      {option.brand} {option.model}
                                    </Typography>
                                  )}
                                </Stack>
                              </li>
                            )}
                          />
                        )}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Items Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Item Pesanan ({items.length})
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  {items.map((item, i) => (
                    <CartItemCard
                      key={item.productId || i}
                      item={item}
                      onRemove={handleRemoveItem}
                      onQuantityChange={handleQuantityChange}
                      disabled={isProcessing}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Footer - Summary & Checkout */}
        {items.length > 0 && (
          <Stack
            sx={{
              p: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
              gap: 2.5,
              flexShrink: 0,
              bgcolor: alpha(theme.palette.secondary.main, 0.02),
            }}
          >
            {/* Price Summary */}
            <Stack sx={{ gap: 1.5 }}>
              <PriceRow
                label="Subtotal"
                value={calcData.subtotal || 0}
                isPending={isCalculatePending}
              />
              <PriceRow
                label={`Pajak (${calcData.taxRate || 11}%)`}
                value={calcData.tax || 0}
                isPending={isCalculatePending}
              />
              <Divider />
              <PriceRow
                label="Total"
                value={calcData.total || 0}
                isPending={isCalculatePending}
                skeletonWidth={120}
                bold
                color="secondary.main"
              />
            </Stack>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!items.length || isProcessing}
              sx={{
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.9375rem",
              }}
            >
              {isSubmitting ? (
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  Memproses...
                </Stack>
              ) : (
                "Proses Pemesanan"
              )}
            </Button>
          </Stack>
        )}
      </Box>
    </Dialog>
  );
};

export default HeaderCart;