/**
 * Halaman Katalog Produk
 *
 * Menampilkan daftar produk (service & sparepart) dengan fitur:
 * - Hanya menampilkan produk aktif (isActive: true)
 * - Pencarian real-time dengan debounce 500ms
 * - Filter berdasarkan tipe produk (Semua/Service/Sparepart)
 * - Sorting (Terbaru, Termurah, Termahal, Nama A-Z, Nama Z-A)
 * - Pagination dengan limit 8 item per halaman
 * - Loading skeleton, error handling dengan retry & reset filter
 * - Animasi fade-in dan hover menggunakan Framer Motion
 * - SEO meta tags dari data SEO configuration
 *
 * @component
 * @returns {JSX.Element}
 */
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  useTheme,
  Chip,
  Menu,
  MenuItem,
  Pagination,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Filter, SortDesc, Search, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@api/productApi.js";
import SEO from "@data/seo.js";
import useDebounce from "@hooks/useDebounce.js";

const Products = () => {
  const theme = useTheme();
  const productsData = SEO.find((page) => page.path === "/products");
  const { sections, meta } = productsData || {};

  /**
   * State filter & pagination yang dikirim ke API.
   *
   * @type {[Object, Function]}
   */
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    type: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  /**
   * Nilai input pencarian sebelum debounce.
   *
   * @type {[string, Function]}
   */
  const [searchInput, setSearchInput] = useState("");

  /**
   * Anchor element untuk menu dropdown filter.
   *
   * @type {[HTMLElement|null, Function]}
   */
  const [anchorElFilter, setAnchorElFilter] = useState(null);

  /**
   * Anchor element untuk menu dropdown sort.
   *
   * @type {[HTMLElement|null, Function]}
   */
  const [anchorElSort, setAnchorElSort] = useState(null);

  /**
   * Label tipe yang dipilih untuk tampilan tombol.
   *
   * @type {[string, Function]}
   */
  const [selectedType, setSelectedType] = useState("all");

  /**
   * Label sort yang dipilih untuk tampilan tombol.
   *
   * @type {[string, Function]}
   */
  const [selectedSort, setSelectedSort] = useState("terbaru");

  /** @type {string} Nilai pencarian yang sudah di-debounce */
  const debouncedSearch = useDebounce(searchInput, 500);

  /**
   * Effect: Sync debounced search ke filters.
   * Reset ke halaman 1 saat search berubah.
   */
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: debouncedSearch,
    }));
  }, [debouncedSearch]);

  /**
   * Membangun query params dari state filters.
   * Selalu menyertakan isActive: true untuk hanya menampilkan produk aktif.
   *
   * @returns {Object} Query params yang sudah difilter
   */
  const buildQueryParams = () => {
    const params = {
      isActive: true, // Selalu hanya produk aktif
    };

    if (filters.page && filters.page !== 1) params.page = filters.page;
    if (filters.limit && filters.limit !== 8) params.limit = filters.limit;
    if (filters.search && filters.search.trim())
      params.search = filters.search.trim();
    if (filters.type && filters.type !== "") params.type = filters.type;
    if (filters.sortBy && filters.sortBy !== "createdAt")
      params.sortBy = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== "desc")
      params.sortOrder = filters.sortOrder;

    return params;
  };

  const queryParams = buildQueryParams();

  /**
   * React Query untuk fetching data produk.
   *
   * @type {Object}
   */
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(queryParams),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  /**
   * Normalisasi data produk dari response API.
   *
   * @type {Array<Object>}
   */
  const productsList = data?.data?.data || [];

  /**
   * Normalisasi metadata pagination dari response API.
   *
   * @type {Object}
   */
  const pagination = data?.data?.metadata || {
    currentPage: 1,
    itemsPerPage: 8,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  /**
   * Mengubah halaman dan scroll ke atas.
   *
   * @param {Event} event - Event change dari Pagination
   * @param {number} value - Nomor halaman baru
   */
  const handlePageChange = (event, value) => {
    setFilters((prev) => ({ ...prev, page: value }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Menghapus input pencarian.
   */
  const clearSearch = () => {
    setSearchInput("");
  };

  /**
   * Mengatur filter tipe produk.
   *
   * @param {string} type - Nilai tipe ("all" | "SERVICE" | "SPAREPART")
   */
  const handleTypeFilter = (type) => {
    setSelectedType(type);
    const typeValue = type === "all" ? "" : type;
    setFilters((prev) => ({ ...prev, page: 1, type: typeValue }));
    setAnchorElFilter(null);
  };

  /**
   * Mengatur sorting produk.
   *
   * @param {Object} sort - Object konfigurasi sorting
   * @param {string} sort.label - Label tampilan
   * @param {string} sort.sortBy - Field untuk sorting
   * @param {string} sort.sortOrder - Arah sorting ("asc" | "desc")
   */
  const handleSort = (sort) => {
    setSelectedSort(sort.label);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    }));
    setAnchorElSort(null);
  };

  /**
   * Mereset semua filter ke nilai default.
   */
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 8,
      search: "",
      type: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchInput("");
    setSelectedType("all");
    setSelectedSort("terbaru");
  };

  /**
   * Opsi sorting yang tersedia.
   *
   * @type {Array<{label: string, sortBy: string, sortOrder: string}>}
   */
  const sortOptions = [
    { label: "Terbaru", sortBy: "createdAt", sortOrder: "desc" },
    { label: "Termurah", sortBy: "price", sortOrder: "asc" },
    { label: "Termahal", sortBy: "price", sortOrder: "desc" },
    { label: "Nama A-Z", sortBy: "name", sortOrder: "asc" },
    { label: "Nama Z-A", sortBy: "name", sortOrder: "desc" },
  ];

  /**
   * Opsi filter tipe produk.
   *
   * @type {Array<{label: string, value: string}>}
   */
  const typeOptions = [
    { label: "Semua", value: "all" },
    { label: "Service", value: "SERVICE" },
    { label: "Sparepart", value: "SPAREPART" },
  ];

  /**
   * Memformat angka menjadi format mata uang IDR.
   *
   * @param {number} price - Harga produk
   * @returns {string} Harga dalam format Rupiah
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  /**
   * Variants untuk animasi fade-in dari bawah.
   *
   * @type {Object}
   */
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  /**
   * Variants untuk animasi stagger children.
   *
   * @type {Object}
   */
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  /**
   * Komponen loading skeleton untuk card produk.
   *
   * @returns {JSX.Element} Skeleton card
   */
  const SkeletonCard = () => (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: "hidden",
        bgcolor: theme.palette.background.paper,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          height: { xs: 180, sm: 200, md: 220 },
          bgcolor: theme.palette.grey[200],
        }}
      />
      <Box
        sx={{
          p: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Skeleton variant="text" animation="wave" sx={{ fontSize: "1rem" }} />
        <Skeleton variant="text" animation="wave" sx={{ fontSize: "1rem" }} />
        <Skeleton
          variant="text"
          animation="wave"
          width="60%"
          sx={{ fontSize: "0.75rem" }}
        />
        <Skeleton
          variant="text"
          animation="wave"
          width="60%"
          sx={{ fontSize: "0.75rem" }}
        />
        <Box sx={{ mt: "auto", pt: 1.5 }}>
          <Skeleton
            variant="text"
            animation="wave"
            width={100}
            sx={{ fontSize: "1rem" }}
          />
        </Box>
      </Box>
    </Box>
  );

  if (!meta) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">Halaman tidak ditemukan</Typography>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="robots" content={meta.robots} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:type" content={meta.ogType} />
      </Helmet>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Header Section */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {sections?.[0]?.title || "Katalog Produk"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sections?.[0]?.subtitle ||
                  "Pilih paket upgrade dan part terbaik untuk Vespa Anda"}
              </Typography>
            </Box>

            {/* Search, Filter & Sort Controls */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <TextField
                size="small"
                placeholder="Cari produk..."
                variant="outlined"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: searchInput && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={clearSearch}>
                          <X size={16} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: { xs: "100%", sm: 200 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${theme.shape.borderRadius}px`,
                  },
                }}
              />

              <Button
                variant="outlined"
                size="medium"
                startIcon={<Filter size={18} />}
                onClick={(e) => setAnchorElFilter(e.currentTarget)}
                sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
              >
                {typeOptions.find((o) => o.value === selectedType)?.label ||
                  "Semua"}
              </Button>

              <Menu
                anchorEl={anchorElFilter}
                open={Boolean(anchorElFilter)}
                onClose={() => setAnchorElFilter(null)}
              >
                {typeOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => handleTypeFilter(option.value)}
                    selected={selectedType === option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>

              <Button
                variant="outlined"
                size="medium"
                startIcon={<SortDesc size={18} />}
                onClick={(e) => setAnchorElSort(e.currentTarget)}
                sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
              >
                {selectedSort}
              </Button>

              <Menu
                anchorEl={anchorElSort}
                open={Boolean(anchorElSort)}
                onClose={() => setAnchorElSort(null)}
              >
                {sortOptions.map((option) => (
                  <MenuItem
                    key={option.label}
                    onClick={() => handleSort(option)}
                    selected={selectedSort === option.label}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {[...Array(8)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </Box>
        )}

        {/* Error State */}
        {isError && (
          <Box>
            <Alert
              severity="error"
              sx={{ borderRadius: `${theme.shape.borderRadius}px`, mb: 2 }}
            >
              {error?.response?.data?.message ||
                error?.message ||
                "Gagal memuat data produk"}
            </Alert>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => refetch()}
                sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
              >
                Coba Lagi
              </Button>
              <Button
                variant="outlined"
                onClick={resetFilters}
                sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
              >
                Reset Filter
              </Button>
            </Box>
          </Box>
        )}

        {/* Success State */}
        {!isLoading && !isError && (
          <>
            {productsList.length > 0 ? (
              <>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    {productsList.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={fadeInUp}
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: `${theme.shape.borderRadius}px`,
                            overflow: "hidden",
                            bgcolor: theme.palette.background.paper,
                            transition: `box-shadow ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
                            "&:hover": {
                              boxShadow: theme.shadows[6],
                            },
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              bgcolor: theme.palette.grey[100],
                              height: { xs: 180, sm: 200, md: 220 },
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {product.image?.url ? (
                              <img
                                src={product.image.url}
                                alt={product.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No Image
                              </Typography>
                            )}
                            <Chip
                              label={
                                product.type === "SERVICE"
                                  ? "Servis"
                                  : "Sparepart"
                              }
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                height: 24,
                                boxShadow: theme.shadows[2],
                                border: `1px solid ${theme.palette.divider}`,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                lineHeight: 1.3,
                                minHeight: 40,
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                minHeight: 32,
                              }}
                            >
                              {product.description || "Tidak ada deskripsi"}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                mt: "auto",
                                pt: 1.5,
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 700,
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {formatPrice(product.price)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </motion.div>

                {pagination.totalPages > 1 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", pt: 2 }}
                  >
                    <Pagination
                      count={pagination.totalPages}
                      page={filters.page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      sx={{
                        "& .MuiPaginationItem-root": {
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Menampilkan {productsList.length} dari{" "}
                    {pagination.totalItems} produk
                  </Typography>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  bgcolor: theme.palette.grey[50],
                  borderRadius: `${theme.shape.borderRadius}px`,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Tidak ada produk yang ditemukan
                </Typography>
                <Button
                  variant="outlined"
                  onClick={resetFilters}
                  sx={{ mt: 2, borderRadius: `${theme.shape.borderRadius}px` }}
                >
                  Reset Filter
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
};

export default Products;