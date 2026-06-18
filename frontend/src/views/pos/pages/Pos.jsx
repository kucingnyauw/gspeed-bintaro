/**
 * Pos - Halaman Point of Sale dengan tampilan Grid & Tabel.
 *
 * Fitur:
 * - Header (PosHeader) selalu tampil di kedua mode (view toggle, search, filter, refresh)
 * - Toggle tampilan Grid/Tabel
 * - Grid: Card produk + PosPagination
 * - Tabel: AppTable standar (pagination sudah include)
 * - Klik produk untuk tambah ke keranjang
 * - Filter & pencarian real-time
 *
 * @component
 * @returns {JSX.Element} Halaman POS
 */
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ShoppingCart } from "lucide-react";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { AppTable } from "@components";
import { useDebounce } from "@hooks";
import { addItem } from "@store/cart/cartSlices.js";
import { formatToIdr } from "@shared/utils";
import {
  PosProductCard,
  PosProductFilterDialog,
  PosHeader,
  PosPagination,
} from "@views/pos/components";
import {
  usePosProductsQuery,
  usePosProductFilters,
} from "@views/pos/hooks";

const Pos = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const br = `${theme.shape.borderRadius}px`;

  /** @type {[string, Function]} */
  const [viewMode, setViewMode] = useState("grid");

  /** @type {[number, Function]} */
  const [page, setPage] = useState(1);

  /** @type {[number, Function]} */
  const [limit, setLimit] = useState(10);

  /** @type {[string, Function]} */
  const [search, setSearch] = useState("");

  /** @type {string} */
  const debouncedSearch = useDebounce(search);

  const {
    activeFilters,
    applyFilter,
    closeFilter,
    filterOpen,
    openFilter,
    resetFilter,
    setTempFilters,
    tempFilters,
  } = usePosProductFilters();

  const handleAddToCart = useCallback(
    (row) => {
      dispatch(
        addItem({
          productId: row.id,
          productName: row.name,
          quantity: 1,
          maxQuantity: row.stock ?? 99,
          unitPrice: row.price,
          type: row.type,
          productStock: row.stock ?? 0,
          image: row.image || null,
          sku: row.sku || null,
        })
      );
    },
    [dispatch]
  );

  const params = useMemo(
    () => ({
      isActive: true,
      limit,
      maxPrice: activeFilters.maxPrice || undefined,
      minPrice: activeFilters.minPrice || undefined,
      page,
      search: debouncedSearch,
      sortBy: activeFilters.sortBy,
      sortOrder: activeFilters.sortOrder,
      type: activeFilters.type || undefined,
    }),
    [page, limit, debouncedSearch, activeFilters]
  );

  const { data, isLoading, refetch } = usePosProductsQuery(params);

  /** @type {Array} */
  const tableData = data?.data || [];

  /** @type {Object} */
  const metadata = data?.metadata || {};

  const handleApplyFilter = useCallback(() => {
    applyFilter();
    setPage(1);
  }, [applyFilter]);

  const handleResetFilter = useCallback(() => {
    resetFilter();
    setPage(1);
  }, [resetFilter]);

  const handleRowClick = useCallback(
    (row) => handleAddToCart(row),
    [handleAddToCart]
  );

  const handleAddToCartClick = useCallback(
    (e, row) => {
      e.stopPropagation();
      handleAddToCart(row);
    },
    [handleAddToCart]
  );

  const renderRow = useCallback(
    (row) => [
      <Avatar
        key={`img-${row.id}`}
        alt={row.name}
        src={row.image?.url || ""}
        variant="rounded"
        sx={{
          width: 40,
          height: 40,
          borderRadius: br,
          bgcolor: !row.image?.url ? alpha(theme.palette.secondary.main, 0.08) : "transparent",
          color: !row.image?.url ? "secondary.main" : "transparent",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {!row.image?.url && row.name?.charAt(0)?.toUpperCase()}
      </Avatar>,

      <Typography key={`name-${row.id}`} variant="body2" sx={{ fontWeight: 500 }}>
        {row.name}
      </Typography>,

      <Typography
        key={`desc-${row.id}`}
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {row.description || "—"}
      </Typography>,

      <Typography key={`sku-${row.id}`} variant="body2" color="text.secondary">
        {row.sku || "—"}
      </Typography>,

      <Typography key={`price-${row.id}`} variant="body2" sx={{ fontWeight: 500 }}>
        {formatToIdr(row.price)}
      </Typography>,

      <Typography key={`cost-${row.id}`} variant="body2" color="text.secondary">
        {row.cost > 0 ? formatToIdr(row.cost) : "—"}
      </Typography>,

      <Typography
        key={`stock-${row.id}`}
        variant="body2"
        sx={{
          fontWeight: 500,
          color: row.type === "SERVICE" ? "text.disabled" : row.stock > 0 ? "text.primary" : "error.main",
        }}
      >
        {row.type === "SERVICE" ? "—" : row.stock ?? 0}
      </Typography>,

      <Chip
        key={`type-${row.id}`}
        color={row.type === "SERVICE" ? "secondary" : "warning"}
        label={row.type === "SERVICE" ? "Servis" : "Sparepart"}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 500, height: 24 }}
      />,

      <Stack key={`action-${row.id}`} direction="row" sx={{ gap: 0.5 }}>
        <Tooltip title="Tambah ke Keranjang" placement="top" arrow>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={(e) => handleAddToCartClick(e, row)}
              size="small"
              aria-label="Tambah ke Keranjang"
              sx={{
                border: "1px solid",
                borderColor: alpha(theme.palette.divider, 0.8),
                borderRadius: br,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                color: "text.secondary",
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  color: "secondary.main",
                },
              }}
            >
              <ShoppingCart size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      </Stack>,
    ],
    [handleAddToCartClick, theme, br]
  );

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const onSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Header - selalu tampil */}
      <PosHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchVal={search}
        onSearchChange={onSearchChange}
        onOpenFilter={openFilter}
        onRefresh={() => refetch()}
      />

      {viewMode === "grid" ? (
        <>
          {/* Grid produk */}
          {isLoading ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 2.5,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Box
                  key={i}
                  sx={{
                    borderRadius: br,
                    border: `1px solid ${theme.palette.divider}`,
                    p: 2.5,
                  }}
                >
                  <Stack sx={{ gap: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Skeleton variant="rounded" width={44} height={44} />
                      <Skeleton variant="rounded" width={64} height={24} />
                    </Stack>
                    <Skeleton width="70%" height={20} />
                    <Skeleton width="90%" height={14} />
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Skeleton width={80} height={28} />
                      <Skeleton variant="rounded" width={36} height={36} />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : tableData.length === 0 ? (
            <Stack
              sx={{
                alignItems: "center",
                justifyContent: "center",
                py: 10,
                gap: 2,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Tidak ada produk tersedia
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coba ubah filter atau kata kunci pencarian
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 2.5,
              }}
            >
              {tableData.map((product) => (
                <PosProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </Box>
          )}

          {/* Pagination - hanya di grid */}
          <PosPagination
            page={page}
            totalPages={metadata.totalPages || 0}
            totalItems={metadata.total || 0}
            itemsPerPage={limit}
            isLoading={isLoading}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      ) : (
        /* Tabel - pagination sudah include di AppTable */
        <AppTable
          count={metadata.totalPages || 0}
          data={tableData}
          emptyStateMessage="Tidak ada produk tersedia"
          headers={["Gambar", "Nama", "Deskripsi", "SKU", "Harga", "HPP", "Stok", "Tipe", "Aksi"]}
          isLoading={isLoading}
          onChange={handlePageChange}
          onRowClick={handleRowClick}
          onRowsPerPageChange={handleRowsPerPageChange}
          page={metadata.currentPage || page}
          renderRow={renderRow}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 50]}
          subtitle="Pilih produk untuk ditambahkan ke keranjang"
          title="Daftar Produk"
        />
      )}

      <PosProductFilterDialog
        onApply={handleApplyFilter}
        onClose={closeFilter}
        onFilterChange={setTempFilters}
        onReset={handleResetFilter}
        open={filterOpen}
        tempFilters={tempFilters}
      />
    </Stack>
  );
};

export default Pos;