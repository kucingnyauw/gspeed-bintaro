/**
 * PosProductCard - Komponen card produk untuk tampilan grid di POS.
 * Menampilkan gambar produk, info, harga, dan tombol tambah ke keranjang.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.product - Data produk
 * @param {Function} props.onAddToCart - Handler tambah ke keranjang
 * @returns {JSX.Element}
 */
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    useTheme,
  } from "@mui/material";
  import { alpha } from "@mui/material/styles";
  import { ShoppingCart, ImageOff } from "lucide-react";
  import { formatToIdr } from "@shared/utils";
  
  const PosProductCard = ({ product, onAddToCart }) => {
    const theme = useTheme();
    const br = `${theme.shape.borderRadius}px`;
    const isService = product.type === "SERVICE";
    const isOutOfStock = !isService && product.stock <= 0;
    const hasImage = product.image?.url;
  
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: br,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          transition: theme.transitions.create(
            ["border-color", "box-shadow", "transform"],
            { duration: theme.transitions.duration.short }
          ),
          opacity: isOutOfStock ? 0.7 : 1,
          cursor: isOutOfStock ? "default" : "pointer",
          "&:hover": {
            borderColor: alpha(theme.palette.secondary.main, 0.3),
            boxShadow: theme.shadows[2],
            transform: "translateY(-2px)",
          },
        }}
        onClick={() => !isOutOfStock && onAddToCart?.(product)}
      >
        {/* Gambar Produk */}
        <Box sx={{ position: "relative" }}>
          {hasImage ? (
            <CardMedia
              component="img"
              image={product.image.url}
              alt={product.name}
              sx={{
                height: 200,
                objectFit: "cover",
                bgcolor: alpha(theme.palette.secondary.main, 0.04),
              }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.secondary.main, 0.03),
                gap: 1,
              }}
            >
              <ImageOff size={32} strokeWidth={1.5} style={{ opacity: 0.2 }} />
              <Typography variant="caption" color="text.disabled">
                Tidak ada gambar
              </Typography>
            </Box>
          )}
  
          {/* Type Chip - Kanan atas */}
          <Chip
            label={isService ? "Servis" : "Sparepart"}
            size="small"
            variant="filled"
            color={isService ? "secondary" : "warning"}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              fontWeight: 600,
              height: 24,
              fontSize: "0.6875rem",
              boxShadow: "none",
            }}
          />
  
          {/* SKU Chip - Kiri bawah */}
          {product.sku && (
            <Chip
              label={product.sku}
              size="small"
              variant="filled"
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                fontWeight: 500,
                height: 22,
                fontSize: "0.625rem",
                bgcolor: alpha(theme.palette.common.black, 0.55),
                color: theme.palette.common.white,
                backdropFilter: "blur(4px)",
                boxShadow: "none",
                letterSpacing: "0.02em",
              }}
            />
          )}
  
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                backdropFilter: "blur(2px)",
              }}
            >
              <Chip
                label="Stok Habis"
                size="small"
                color="error"
                variant="filled"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 28,
                  boxShadow: "none",
                }}
              />
            </Box>
          )}
        </Box>
  
        {/* Info */}
        <CardContent
          sx={{
            p: 2.5,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Nama */}
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, lineHeight: 1.3, mb: 1.5 }}
            noWrap
          >
            {product.name}
          </Typography>
  
          {/* Deskripsi */}
          {product.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.5,
                mb: "auto",
              }}
            >
              {product.description}
            </Typography>
          )}
  
          {/* Spacer kalau tidak ada deskripsi */}
          {!product.description && <Box sx={{ flex: 1 }} />}
  
          {/* Footer: Harga + Tombol */}
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-end",
              mt: 2.5,
            }}
          >
            <Stack spacing={0.25}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: "1.125rem" }}
              >
                {formatToIdr(product.price)}
              </Typography>
              {!isService && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    color: isOutOfStock ? "error.main" : "text.secondary",
                  }}
                >
                  Stok {product.stock ?? 0}
                </Typography>
              )}
            </Stack>
  
            <Tooltip
              title={isOutOfStock ? "Stok habis" : "Tambah ke keranjang"}
              placement="top"
              arrow
            >
              <Box component="span" sx={{ display: "inline-flex" }}>
                <IconButton
                  size="small"
                  disabled={isOutOfStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(product);
                  }}
                  sx={{
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    borderRadius: br,
                    bgcolor: isOutOfStock
                      ? "transparent"
                      : alpha(theme.palette.secondary.main, 0.08),
                    color: isOutOfStock ? "text.disabled" : "secondary.main",
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color"],
                      { duration: theme.transitions.duration.shorter }
                    ),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.16),
                      borderColor: alpha(theme.palette.secondary.main, 0.5),
                      color: "secondary.dark",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "transparent",
                      borderColor: alpha(theme.palette.divider, 0.3),
                      color: "text.disabled",
                    },
                  }}
                >
                  <ShoppingCart size={18} strokeWidth={1.5} />
                </IconButton>
              </Box>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>
    );
  };
  
  export default PosProductCard;