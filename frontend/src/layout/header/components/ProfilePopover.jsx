/**
 * ProfilePopover - User profile popover dengan greeting, role, theme toggle, cart access, dan logout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Popover open state
 * @param {HTMLElement|null} props.anchorEl - Anchor element for popover positioning
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.user - User data object
 * @param {string} [props.user.fullName] - User full name
 * @param {string} [props.user.role] - User role (e.g., "kasir", "admin")
 * @param {boolean} props.isCashier - Whether current user is a cashier
 * @param {Function} [props.onOpenCart] - Handler to open the cart drawer/modal
 * @returns {JSX.Element} Rendered profile popover
 */
import { useSelector, useDispatch } from "react-redux";
import {
  Badge, Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Popover, Stack, Switch, Typography, useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronRight, LogOut, Moon, ShoppingCart, Sun } from "lucide-react";

import { getGreeting } from "@shared/utils";
import { logout } from "@store/auth/authThunk.js";
import { selectAuthLoading } from "@store/auth/authSelector.js";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { toggleTheme } from "@store/theme/themeSlices.js";
import { selectCartItems } from "@store/cart/cartSelector.js";

const ProfilePopover = ({ open, anchorEl, onClose, user, isCashier, onOpenCart }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const mode = useSelector(selectThemeMode);
  const cartItems = useSelector(selectCartItems);
  const br = `${theme.shape.borderRadius}px`;

  /** Padding horizontal yang sama untuk header dan menu items */
  const contentPx = 2; // 16px — sama dengan padding ListItemButton default

  /** Style untuk icon box di setiap menu item */
  const iconBox = (bgColor, color) => ({
    width: 32, height: 32, borderRadius: br, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    bgcolor: alpha(bgColor, 0.08), color,
  });

  /** Style untuk ListItemButton */
  const menuItemSx = {
    borderRadius: br, py: 1.25, minHeight: 48, px: contentPx,
    "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.06) },
  };

  const handleLogout = () => { dispatch(logout()); onClose(); };
  const handleToggleTheme = (e) => { e.stopPropagation(); dispatch(toggleTheme()); };
  const handleCartClick = () => { onClose(); if (onOpenCart) onOpenCart(); };

  return (
    <Popover
      open={open} anchorEl={anchorEl} onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            mt: 1.5, width: 300, borderRadius: br,
            border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[4],
            overflow: "hidden", bgcolor: "background.paper", backgroundImage: "none", p: 2,
          },
        },
      }}
    >
      {/* Header: Greeting + Nama + Role — px disamakan dengan menuItemSx */}
      <Box sx={{ mb: 2, px: contentPx }}>
        <Typography variant="body2" sx={{ lineHeight: 1.5, color: "text.primary" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>{getGreeting()}, </Box>
          <Box component="span" sx={{ fontWeight: 400 }}>{user?.fullName || "Pengguna"}</Box>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize", mt: 0.5, display: "block", fontWeight: 500, letterSpacing: "0.02em" }}>
          {user?.role?.toLowerCase() || "—"}
        </Typography>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Menu Items */}
      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {/* Cart Menu - Hanya untuk Kasir */}
        {isCashier && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleCartClick} sx={menuItemSx}>
              <ListItemIcon sx={{ minWidth: 40, mr: 0.5 }}>
                <Box sx={iconBox(theme.palette.secondary.main, theme.palette.secondary.main)}>
                  <ShoppingCart size={16} strokeWidth={1.5} />
                </Box>
              </ListItemIcon>
              <ListItemText primary="Keranjang Belanja" slotProps={{ primary: { variant: "body2", color: "text.primary", fontWeight: 500 } }} />
              <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                {cartItems.length > 0 && (
                  <Badge badgeContent={cartItems.length} color="error" max={99}
                    sx={{ "& .MuiBadge-badge": { position: "static", transform: "none", fontSize: "0.625rem", height: 18, minWidth: 18, borderRadius: br, fontWeight: 600 } }} />
                )}
                <ChevronRight size={14} strokeWidth={1.5} color={theme.palette.text.disabled} />
              </Stack>
            </ListItemButton>
          </ListItem>
        )}

        {/* Theme Toggle */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleToggleTheme} sx={menuItemSx}>
            <ListItemIcon sx={{ minWidth: 40, mr: 0.5 }}>
              <Box sx={iconBox(theme.palette.warning.main, theme.palette.warning.main)}>
                {mode === "dark" ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
              </Box>
            </ListItemIcon>
            <ListItemText primary={mode === "dark" ? "Mode Terang" : "Mode Gelap"} slotProps={{ primary: { variant: "body2", color: "text.primary", fontWeight: 500 } }} />
            <Switch size="small" checked={mode === "dark"} onChange={handleToggleTheme} onClick={(e) => e.stopPropagation()} sx={{ "& .MuiSwitch-thumb": { boxShadow: "none" } }} />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1.5 }} />

      {/* Logout */}
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} disabled={isLoading}
            sx={{ ...menuItemSx, color: theme.palette.error.main, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.08) }, "&.Mui-disabled": { opacity: 0.5 } }}>
            <ListItemIcon sx={{ minWidth: 40, mr: 0.5, color: "inherit" }}>
              <Box sx={iconBox(theme.palette.error.main, "inherit")}>
                <LogOut size={16} strokeWidth={1.5} />
              </Box>
            </ListItemIcon>
            <ListItemText primary="Keluar" slotProps={{ primary: { variant: "body2", fontWeight: 500 } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Popover>
  );
};

export default ProfilePopover;