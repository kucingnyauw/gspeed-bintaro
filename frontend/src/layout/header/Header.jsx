/**
 * Header - Application header dengan branding, search, notifikasi, dan action icons.
 * Mobile/tablet: search menutupi seluruh header dengan icon dalam TextField.
 *
 * @component
 * @returns {JSX.Element} Rendered header component
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Bell,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
  Search,
  Maximize,
  Minimize,
  X,
} from "lucide-react";

import { selectCartItems } from "@store/cart/cartSelector.js";
import { toggleSidebar } from "@store/sidebar/sidebarSlices.js";
import { toggleTheme } from "@store/theme/themeSlices.js";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { selectUser } from "@store/auth/authSelector.js";
import { HEADER, SIDEBAR } from "@shared/constant";
import { useDevice, usePermission } from "@hooks";
import { getAvatarUrl } from "@shared/utils";

import {
  HeaderCart,
  NotificationPopover,
  ProfilePopover,
} from "@layout/header/components";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteAllNotifications,
  useDeleteNotification,
} from "@layout/header/hooks/useNotifications.js";

import INFO from "@data/Info.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import { getSearchPages } from "@menu/index.js";

const Header = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDevice();
  const isCashier = usePermission({ role: "CASHIER" });
  const isSmallDevice = isMobile || isTablet;

  const items = useSelector(selectCartItems);
  const mode = useSelector(selectThemeMode);
  const user = useSelector(selectUser);

  const [cartOpen, setCartOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const searchPages = useMemo(() => getSearchPages(user?.role), [user?.role]);

  const filteredPages = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = searchVal.toLowerCase();
    return searchPages.filter((p) => p.label.toLowerCase().includes(q));
  }, [searchVal, searchPages]);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const {
    data: notifData,
    isLoading: isNotifLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    refetch,
  } = useNotifications({ enabled: notifOpen });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteAll = useDeleteAllNotifications();
  const deleteOne = useDeleteNotification();

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.error(err.message));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleMarkRead = (id) => markAsRead.mutate(id);
  const handleMarkAllRead = () => markAllAsRead.mutate();

  const handleDelete = (id) => {
    deleteOne.mutate(id, {
      onSuccess: () =>
        dispatch(
          showNotification({
            message: "Notifikasi berhasil dihapus",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        ),
      onError: (error) =>
        dispatch(
          showNotification({
            message: error.message || "Gagal menghapus notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        ),
    });
  };

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: () =>
        dispatch(
          showNotification({
            message: "Semua notifikasi berhasil dihapus",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        ),
      onError: (error) =>
        dispatch(
          showNotification({
            message: error.message || "Gagal menghapus semua notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        ),
    });
  };

  const handleToggleSidebar = () => dispatch(toggleSidebar());
  const handleToggleCart = useCallback(() => {
    if (isCashier) setCartOpen((prev) => !prev);
  }, [isCashier]);
  const handleToggleTheme = () => dispatch(toggleTheme());
  const handleProfileOpen = (e) => setProfileAnchorEl(e.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);
  const handleNotifOpen = (e) => {
    setNotifAnchorEl(e.currentTarget);
    setNotifOpen(true);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
    setNotifOpen(false);
  };
  const handleRefresh = () => refetch();
  const handleToggleMobileSearch = () => {
    setShowMobileSearch((prev) => !prev);
    setSearchVal("");
  };

  const iconBtnStyle = {
    border: "1px solid",
    borderColor: alpha(theme.palette.divider, 0.8),
    borderRadius: `${theme.shape.borderRadius}px`,
    color: "text.secondary",
    minWidth: 38,
    minHeight: 38,
    p: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.08),
      borderColor: alpha(theme.palette.secondary.main, 0.4),
      color: theme.palette.secondary.main,
    },
  };

  const adornmentIconWrapperStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 26,
    borderRadius: `${theme.shape.borderRadius}px`,
  };

  const logoPl = `${3 * 8 - 4}px`;
  const menuPl = `${2 * 8 - 4}px`;

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          height: isSmallDevice ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
          justifyContent: "center",
          bgcolor: "background.paper",
          zIndex: theme.zIndex.appBar,
        }}
      >
        {/* MOBILE/TABLET SEARCH OVERLAY */}
        {isSmallDevice && showMobileSearch && (
          <Toolbar
            sx={{
              minHeight: `${HEADER.MOBILE_HEIGHT}px !important`,
              px: { xs: 2, sm: 3 },
              display: "flex",
              alignItems: "center",
              bgcolor: "background.paper",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 2,
            }}
          >
            <TextField
              fullWidth
              autoFocus
              size="small"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Cari halaman..."
              slotProps={{
                input: {
                  startAdornment: (
                    <Box
                      sx={{
                        ...adornmentIconWrapperStyle,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        color: theme.palette.secondary.main,
                        mr: 1,
                      }}
                    >
                      <Search size={16} strokeWidth={1.5} />
                    </Box>
                  ),
                  endAdornment: (
                    <IconButton
                      onClick={handleToggleMobileSearch}
                      size="small"
                      sx={{
                        ml: 0.5,
                        width: 28,
                        height: 26,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        bgcolor: alpha(theme.palette.error.main, 0.15),
                        color: theme.palette.error.main,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.error.main, 0.25),
                          color: theme.palette.error.dark,
                        },
                      }}
                    >
                      <X size={16} strokeWidth={2} />
                    </IconButton>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  },
                  "&.Mui-focused": {
                    bgcolor: "background.paper",
                    boxShadow: `0 0 0 2px ${alpha(
                      theme.palette.secondary.main,
                      0.2
                    )}`,
                  },
                },
              }}
            />
          </Toolbar>
        )}

        {/* TOOLBAR UTAMA */}
        <Toolbar
          sx={{
            minHeight: `${
              isSmallDevice ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT
            }px !important`,
            pl: { xs: 2, sm: 2, md: 0 },
            pr: { xs: 2, sm: 4, md: 6 },
            display: isSmallDevice && showMobileSearch ? "none" : "flex",
            gap: { xs: 1, sm: 2 },
          }}
        >
          {/* LEFT */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", md: "space-between" },
              width: { xs: "auto", md: `${SIDEBAR.EXPANDED_WIDTH}px` },
              pl: { xs: 0, md: logoPl },
              pr: { xs: 0, md: 3 },
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={INFO.logoUrl}
              alt={INFO.name}
              sx={{
                display: { xs: "none", md: "block" },
                height: 36,
                width: "auto",
                maxWidth: 120,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <Tooltip title="Toggle Sidebar">
              <IconButton
                onClick={handleToggleSidebar}
                size="small"
                sx={{
                  ...iconBtnStyle,
                  flexShrink: 0,
                  ml: { xs: menuPl, md: menuPl },
                }}
              >
                <Menu size={18} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
          </Box>
          {/* CENTER */}
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              position: "relative",
              minWidth: 0,
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Cari halaman..."
              slotProps={{
                input: {
                  startAdornment: (
                    <Box
                      sx={{
                        ...adornmentIconWrapperStyle,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        color: theme.palette.secondary.main,
                        mr: 1,
                      }}
                    >
                      <Search size={14} strokeWidth={1.5} />
                    </Box>
                  ),
                  endAdornment: searchVal ? (
                    <IconButton
                      onClick={() => setSearchVal("")}
                      size="small"
                      sx={{
                        ml: 0.5,
                        color: "text.secondary",
                        "&:hover": { color: theme.palette.secondary.main },
                      }}
                    >
                      <X size={14} strokeWidth={1.5} />
                    </IconButton>
                  ) : null,
                },
              }}
              sx={{ maxWidth: 320 }}
            />
            {filteredPages.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "100%",
                  maxWidth: 320,
                  bgcolor: "background.paper",
                  borderRadius: `${theme.shape.borderRadius}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: `0 8px 24px ${alpha(
                    theme.palette.common.black,
                    0.1
                  )}`,
                  maxHeight: 320,
                  overflowY: "auto",
                  zIndex: theme.zIndex.appBar + 1,
                }}
              >
                {filteredPages.map((page) => (
                  <Box
                    key={page.path}
                    onClick={() => {
                      navigate(page.path);
                      setSearchVal("");
                    }}
                    sx={{
                      px: 2,
                      py: 1.25,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      },
                      "&:not(:last-child)": {
                        borderBottom: `1px solid ${alpha(
                          theme.palette.divider,
                          0.4
                        )}`,
                      },
                    }}
                  >
                    <Typography variant="body2">{page.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {page.path}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {/* SPACER */}
          <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />
          {/* RIGHT */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: { xs: "6px", sm: "10px" },
              flexShrink: 0,
            }}
          >
            <Tooltip title="Pencarian" enterDelay={300} leaveDelay={0}>
              <IconButton
                onClick={handleToggleMobileSearch}
                sx={{
                  ...iconBtnStyle,
                  display: { xs: "inline-flex", md: "none" },
                }}
              >
                <Search size={18} strokeWidth={1.5} />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              enterDelay={300}
              leaveDelay={0}
            >
              <IconButton
                onClick={handleToggleFullscreen}
                sx={{
                  ...iconBtnStyle,
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                {isFullscreen ? (
                  <Minimize size={18} strokeWidth={1.5} />
                ) : (
                  <Maximize size={18} strokeWidth={1.5} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip
              title={mode === "dark" ? "Mode Terang" : "Mode Gelap"}
              enterDelay={300}
              leaveDelay={0}
            >
              <IconButton
                onClick={handleToggleTheme}
                sx={{
                  ...iconBtnStyle,
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                {mode === "dark" ? (
                  <Sun size={18} strokeWidth={1.5} />
                ) : (
                  <Moon size={18} strokeWidth={1.5} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifikasi" enterDelay={300} leaveDelay={0}>
              <IconButton onClick={handleNotifOpen} sx={iconBtnStyle}>
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  invisible={unreadCount === 0}
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.625rem",
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                >
                  <Bell size={18} strokeWidth={1.5} />
                </Badge>
              </IconButton>
            </Tooltip>
            {isCashier && (
              <Tooltip title="Keranjang" enterDelay={300} leaveDelay={0}>
                <IconButton
                  onClick={handleToggleCart}
                  sx={{
                    ...iconBtnStyle,
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                >
                  <Badge
                    badgeContent={items.length}
                    color="error"
                    invisible={items.length === 0}
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.625rem",
                        height: 16,
                        minWidth: 16,
                      },
                    }}
                  >
                    <ShoppingCart size={18} strokeWidth={1.5} />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 24, alignSelf: "center", mx: "2px" }}
            />
            {/* Avatar Circle Only */}
            <Tooltip title="Profil Pengguna" enterDelay={300} leaveDelay={0}>
              <Avatar
                src={getAvatarUrl(user?.fullName)}
                variant="circular"
                onClick={handleProfileOpen}
                sx={{
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  flexShrink: 0,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "2px solid",
                  borderRadius : "50%",
                  borderColor: alpha(theme.palette.divider, 0.6),
                  "&:hover": {
                    borderColor: alpha(theme.palette.secondary.main, 0.4),
                  },
                }}
              />
            </Tooltip>
          </Box>
        </Toolbar>

        {/* SEARCH RESULTS DROPDOWN — Mobile */}
        {isSmallDevice && showMobileSearch && filteredPages.length > 0 && (
          <Box
            sx={{
              position: "fixed",
              top: HEADER.MOBILE_HEIGHT,
              left: 0,
              right: 0,
              bgcolor: "background.paper",
              borderBottom: `1px solid ${theme.palette.divider}`,
              boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
              maxHeight: "calc(100vh - 56px)",
              overflowY: "auto",
              zIndex: theme.zIndex.appBar + 1,
            }}
          >
            {filteredPages.map((page) => (
              <Box
                key={page.path}
                onClick={() => {
                  navigate(page.path);
                  setSearchVal("");
                  setShowMobileSearch(false);
                }}
                sx={{
                  px: 2,
                  py: 2,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  },
                  "&:not(:last-child)": {
                    borderBottom: `1px solid ${alpha(
                      theme.palette.divider,
                      0.4
                    )}`,
                  },
                }}
              >
                <Typography variant="body1" fontWeight={500}>
                  {page.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {page.path}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </AppBar>

      {isCashier && <HeaderCart open={cartOpen} onClose={handleToggleCart} />}
      <ProfilePopover
        open={Boolean(profileAnchorEl)}
        anchorEl={profileAnchorEl}
        onClose={handleProfileClose}
        user={user}
        isCashier={isCashier}
        onOpenCart={handleToggleCart}
      />
      {notifOpen && (
        <NotificationPopover
          open={Boolean(notifAnchorEl)}
          anchorEl={notifAnchorEl}
          onClose={handleNotifClose}
          notifications={notifData}
          isLoading={isNotifLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onFetchNextPage={fetchNextPage}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onDeleteAll={handleDeleteAll}
          onDelete={handleDelete}
          unreadCount={unreadCount}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};

export default Header;
