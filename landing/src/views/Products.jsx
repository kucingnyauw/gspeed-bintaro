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
  const { hero, sections, meta } = productsData;

  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [searchInput, setSearchInput] = useState("");
  const [anchorElFilter, setAnchorElFilter] = useState(null);
  const [anchorElSort, setAnchorElSort] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSort, setSelectedSort] = useState("terbaru");

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: debouncedSearch,
    }));
  }, [debouncedSearch]);

  const buildQueryParams = () => {
    const params = {};
    
    if (filters.page && filters.page !== 1) params.page = filters.page;
    if (filters.limit && filters.limit !== 10) params.limit = filters.limit;
    if (filters.search && filters.search.trim()) params.search = filters.search.trim();
    if (filters.type && filters.type !== "") params.type = filters.type;
    if (filters.minPrice && filters.minPrice !== "" && !isNaN(filters.minPrice) && filters.minPrice > 0) {
      params.minPrice = parseInt(filters.minPrice);
    }
    if (filters.maxPrice && filters.maxPrice !== "" && !isNaN(filters.maxPrice) && filters.maxPrice > 0) {
      params.maxPrice = parseInt(filters.maxPrice);
    }
    if (filters.sortBy && filters.sortBy !== "createdAt") params.sortBy = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== "desc") params.sortOrder = filters.sortOrder;
    
    return params;
  };

  const queryParams = buildQueryParams();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(queryParams),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const responseData = data?.data;
  const productsList = Array.isArray(responseData?.data) ? responseData.data : [];
  const pagination = responseData?.metadata || {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handlePageChange = (event, value) => {
    setFilters((prev) => ({ ...prev, page: value }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setSearchInput("");
  };

  const handleTypeFilter = (type) => {
    setSelectedType(type);
    const typeValue = type === "all" ? "" : type;
    setFilters((prev) => ({ ...prev, page: 1, type: typeValue }));
    setAnchorElFilter(null);
  };

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

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchInput("");
    setSelectedType("all");
    setSelectedSort("terbaru");
  };

  const sortOptions = [
    { label: "Terbaru", sortBy: "createdAt", sortOrder: "desc" },
    { label: "Termurah", sortBy: "price", sortOrder: "asc" },
    { label: "Termahal", sortBy: "price", sortOrder: "desc" },
    { label: "Nama A-Z", sortBy: "name", sortOrder: "asc" },
    { label: "Nama Z-A", sortBy: "name", sortOrder: "desc" },
  ];

  const typeOptions = [
    { label: "Semua", value: "all" },
    { label: "Service", value: "SERVICE" },
    { label: "Sparepart", value: "SPAREPART" },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const SkeletonCard = () => (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
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
          p: theme.spacing(2),
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(1),
        }}
      >
        <Skeleton
          variant="text"
          animation="wave"
          sx={{ fontSize: theme.typography.body1.fontSize, bgcolor: theme.palette.grey[200] }}
        />
        <Skeleton
          variant="text"
          animation="wave"
          sx={{ fontSize: theme.typography.body1.fontSize, bgcolor: theme.palette.grey[200] }}
        />
        <Skeleton
          variant="text"
          animation="wave"
          width="60%"
          sx={{ fontSize: theme.typography.caption.fontSize, bgcolor: theme.palette.grey[200] }}
        />
        <Skeleton
          variant="text"
          animation="wave"
          width="60%"
          sx={{ fontSize: theme.typography.caption.fontSize, bgcolor: theme.palette.grey[200] }}
        />
        <Box sx={{ mt: "auto", pt: theme.spacing(1.5) }}>
          <Skeleton
            variant="text"
            animation="wave"
            width={100}
            sx={{ fontSize: theme.typography.body1.fontSize, bgcolor: theme.palette.grey[200] }}
          />
        </Box>
      </Box>
    </Box>
  );

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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(4),
        }}
      >
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: theme.spacing(2),
            }}
          >
            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  fontSize: theme.typography.h4.fontSize,
                  color: theme.palette.text.primary,
                  mb: theme.spacing(1),
                }}
              >
                {sections[0]?.title || "Katalog Produk"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                {sections[0]?.subtitle ||
                  "Pilih paket upgrade dan part terbaik untuk Vespa Anda"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: theme.spacing(1.5),
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
                    borderRadius: theme.shape.borderRadius,
                  },
                }}
              />

              <Button
                variant="outlined"
                size="medium"
                startIcon={<Filter size={18} />}
                onClick={(e) => setAnchorElFilter(e.currentTarget)}
                sx={{ borderRadius: theme.shape.borderRadius }}
              >
                {selectedType === "all" ? "Semua" : selectedType}
              </Button>

              <Menu
                anchorEl={anchorElFilter}
                open={Boolean(anchorElFilter)}
                onClose={() => setAnchorElFilter(null)}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: theme.shape.borderRadius,
                    },
                  },
                }}
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
                sx={{ borderRadius: theme.shape.borderRadius }}
              >
                {selectedSort}
              </Button>

              <Menu
                anchorEl={anchorElSort}
                open={Boolean(anchorElSort)}
                onClose={() => setAnchorElSort(null)}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: theme.shape.borderRadius,
                    },
                  },
                }}
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

        {isLoading ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: theme.spacing(2),
            }}
          >
            {[...Array(8)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </Box>
        ) : isError ? (
          <Box>
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: theme.shape.borderRadius, 
                mb: theme.spacing(2) 
              }}
            >
              {error?.response?.data?.message || error?.message || "Gagal memuat data produk"}
            </Alert>
            <Box sx={{ display: "flex", gap: theme.spacing(2) }}>
              <Button 
                variant="outlined" 
                onClick={() => refetch()}
                sx={{ borderRadius: theme.shape.borderRadius }}
              >
                Coba Lagi
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                sx={{ borderRadius: theme.shape.borderRadius }}
              >
                Reset Filter
              </Button>
            </Box>
          </Box>
        ) : (
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
                  gap: theme.spacing(2),
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
                        borderRadius: theme.shape.borderRadius,
                        overflow: "hidden",
                        bgcolor: theme.palette.background.paper,
                        transition: `box-shadow ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
                        "&:hover": {
                          boxShadow: theme.shadows[6],
                        },
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "default",
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
                        {product.image.url ? (
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
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            No Image
                          </Typography>
                        )}
                        <Chip
                          label={product.type || "SERVICE"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: theme.spacing(1),
                            right: theme.spacing(1),
                            bgcolor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            fontSize: theme.typography.caption.fontSize,
                            fontWeight: theme.typography.fontWeightBold,
                            height: 24,
                            boxShadow: theme.shadows[2],
                            border: `1px solid ${theme.palette.divider}`,
                            backdropFilter: "blur(4px)",
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          p: theme.spacing(2),
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: theme.spacing(1),
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: theme.typography.fontWeightBold,
                            fontSize: theme.typography.body1.fontSize,
                            lineHeight: 1.3,
                            minHeight: 40,
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: theme.typography.caption.fontSize,
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
                            pt: theme.spacing(1.5),
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: theme.typography.fontWeightBold,
                              color: theme.palette.primary.main,
                              fontSize: theme.typography.body1.fontSize,
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

            {productsList.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: theme.spacing(8),
                  bgcolor: theme.palette.grey[50],
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                  Tidak ada produk yang ditemukan
                </Typography>
                <Button
                  variant="outlined"
                  onClick={resetFilters}
                  sx={{ 
                    mt: theme.spacing(2),
                    borderRadius: theme.shape.borderRadius,
                  }}
                >
                  Reset Filter
                </Button>
              </Box>
            )}

            {pagination.totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  pt: theme.spacing(2),
                }}
              >
                <Pagination
                  count={pagination.totalPages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: theme.shape.borderRadius,
                    },
                  }}
                />
              </Box>
            )}

            {productsList.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  pt: theme.spacing(1),
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Menampilkan {productsList.length} dari {pagination.totalItems} produk
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
};

export default Products;