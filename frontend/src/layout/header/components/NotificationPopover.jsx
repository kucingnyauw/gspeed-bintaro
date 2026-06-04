/**
 * NotificationPopover - Komponen popover notifikasi dengan infinite scroll, read/unread status, dan bulk actions.
 *
 * @module NotificationPopover
 */
import { useRef, useCallback, useState, useEffect } from "react";
import { CheckCheck, RotateCcw, Trash2, X, BellDot } from "lucide-react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  keyframes,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatRelativeTime } from "@shared/utils";
import { notificationTypeColorMap } from "@shared/constant";

/**
 * Keyframe animasi fade in dari bawah.
 * Digunakan untuk animasi notifikasi baru yang masuk.
 * @type {Object}
 */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * EmptyNotificationSvg - Ilustrasi untuk state kosong notifikasi.
 * Menampilkan ikon lonceng dalam lingkaran.
 *
 * @param {Object} props - Props komponen
 * @param {number} [props.opacity=0.2] - Tingkat opacity ilustrasi
 * @returns {JSX.Element} Ilustrasi SVG
 */
const EmptyNotificationSvg = ({ opacity = 0.2 }) => (
  <Box
    sx={(theme) => ({
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 64,
      height: 64,
      borderRadius: "50%",
      bgcolor: alpha(theme.palette.secondary.main, 0.08),
      color: "text.secondary",
      opacity,
      mb: 1,
    })}
  >
    <BellDot size={32} strokeWidth={1.5} />
  </Box>
);

/**
 * NotificationSkeleton - Komponen skeleton loading untuk daftar notifikasi.
 * Menampilkan 4 item placeholder saat data dimuat.
 *
 * @returns {JSX.Element} Skeleton notifikasi
 */
const NotificationSkeleton = () => (
  <Stack spacing={0.5} sx={{ px: 1, py: 1 }}>
    {[1, 2, 3, 4].map((i) => (
      <Box
        key={i}
        sx={(theme) => ({
          p: 2,
          borderRadius: `${theme.shape.borderRadius}px`,
          display: "flex",
          gap: 2,
          bgcolor: alpha(theme.palette.secondary.main, 0.02),
        })}
      >
        <Skeleton variant="circular" width={8} height={8} sx={{ mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="85%" height={16} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
    ))}
  </Stack>
);

/**
 * Mendapatkan warna chip berdasarkan tipe notifikasi.
 *
 * @param {string} type - Tipe notifikasi
 * @returns {string} Nama warna dari theme palette
 */
const getNotifColor = (type) => {
  return notificationTypeColorMap[type] || "default";
};

/**
 * NotificationPopover - Popover yang menampilkan daftar notifikasi dengan fitur lengkap.
 *
 * Fitur:
 * - Infinite scroll untuk load more notifikasi
 * - Animasi fade-in untuk notifikasi baru
 * - Indikator unread dengan garis warna di kiri
 * - Mark as read (single & bulk)
 * - Delete notifikasi (single & bulk)
 * - Detail notifikasi dalam dialog
 * - Empty state dengan ilustrasi
 * - Loading skeleton
 * - Optimistic delete dengan animasi fade-out
 * - Scroll position preservation saat load more
 *
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status popover terbuka/tutup
 * @param {HTMLElement|null} props.anchorEl - Element anchor untuk popover
 * @param {Function} props.onClose - Handler tutup popover
 * @param {Array} props.notifications - Data notifikasi dari useInfiniteQuery
 * @param {boolean} props.isLoading - Status loading awal
 * @param {boolean} props.isFetchingNextPage - Status loading next page
 * @param {boolean} props.hasNextPage - Apakah masih ada halaman berikutnya
 * @param {Function} props.onFetchNextPage - Handler fetch halaman berikutnya
 * @param {Function} props.onMarkRead - Handler tandai satu notifikasi dibaca
 * @param {Function} props.onMarkAllRead - Handler tandai semua notifikasi dibaca
 * @param {Function} props.onDeleteAll - Handler hapus semua notifikasi
 * @param {Function} props.onDelete - Handler hapus satu notifikasi
 * @param {Function} props.onRefresh - Handler refresh notifikasi
 * @param {number} [props.unreadCount=0] - Jumlah notifikasi belum dibaca
 * @returns {JSX.Element} Popover notifikasi
 */
const NotificationPopover = ({
  open,
  anchorEl,
  onClose,
  notifications,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  onMarkRead,
  onMarkAllRead,
  onDeleteAll,
  onDelete,
  onRefresh,
  unreadCount = 0,
}) => {
  const theme = useTheme();

  /** @type {React.RefObject<HTMLDivElement>} Ref untuk kontainer scroll */
  const scrollRef = useRef(null);

  /** @type {React.MutableRefObject<number>} Ref untuk menyimpan tinggi scroll sebelumnya */
  const prevScrollHeight = useRef(0);

  /** @type {[number, Function]} State panjang notifikasi sebelumnya */
  const [prevLength, setPrevLength] = useState(0);

  /** @type {[string[], Function]} State ID notifikasi baru untuk animasi */
  const [newItemIds, setNewItemIds] = useState([]);

  /** @type {[Object|null, Function]} State notifikasi yang dipilih untuk detail */
  const [selectedNotif, setSelectedNotif] = useState(null);

  /** @type {[string[], Function]} State ID notifikasi yang sedang dihapus */
  const [deletingIds, setDeletingIds] = useState([]);

  /**
   * Semua notifikasi yang sudah di-flat dari struktur infinite query pages.
   * @type {Array<Object>}
   */
  const allNotifications = notifications?.pages?.flatMap((page) => page.data) || [];

  /** @type {boolean} Apakah ada notifikasi yang sedang dalam proses hapus */
  const isAnyDeleting = deletingIds.length > 0;

  /**
   * Effect: Deteksi notifikasi baru untuk animasi fade-in.
   * Membandingkan panjang array sebelumnya dengan yang baru.
   */
  useEffect(() => {
    if (allNotifications.length > prevLength) {
      const newIds = allNotifications.slice(prevLength).map((n) => n.id);
      setNewItemIds(newIds);
      const timer = setTimeout(() => setNewItemIds([]), 400);
      return () => clearTimeout(timer);
    }
    setPrevLength(allNotifications.length);
  }, [allNotifications.length]);

  /**
   * Effect: Bersihkan deleting IDs jika notifikasi sudah benar-benar hilang dari list.
   */
  useEffect(() => {
    if (deletingIds.length > 0) {
      const currentIds = allNotifications.map((n) => n.id);
      const stillDeleting = deletingIds.some((id) => currentIds.includes(id));
      if (!stillDeleting) setDeletingIds([]);
    }
  }, [allNotifications, deletingIds]);

  /**
   * Effect: Timeout fallback untuk membersihkan deleting IDs setelah 3 detik.
   */
  useEffect(() => {
    let timer;
    if (deletingIds.length > 0) {
      timer = setTimeout(() => setDeletingIds([]), 3000);
    }
    return () => clearTimeout(timer);
  }, [deletingIds]);

  /**
   * Effect: Preserve scroll position saat load more (infinite scroll).
   * Menghitung perbedaan tinggi dan menyesuaikan posisi scroll.
   */
  useEffect(() => {
    if (!isFetchingNextPage && prevScrollHeight.current > 0 && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const diff = scrollRef.current.scrollHeight - prevScrollHeight.current;
          scrollRef.current.scrollTop += diff;
          prevScrollHeight.current = 0;
        }
      });
    }
  }, [isFetchingNextPage]);

  /**
   * Handler scroll untuk infinite scroll.
   * Memicu fetch next page saat mendekati bottom.
   *
   * @param {React.UIEvent<HTMLDivElement>} e - Event scroll
   */
  const handleScroll = useCallback(
    (e) => {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
        prevScrollHeight.current = scrollHeight;
        onFetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage]
  );

  /**
   * Handler klik notifikasi.
   * Mark as read jika belum dibaca, lalu buka detail.
   *
   * @param {Object} notif - Data notifikasi
   */
  const handleNotifClick = (notif) => {
    if (isAnyDeleting) return;
    if (!notif.isRead) onMarkRead(notif.id);
    setSelectedNotif(notif);
  };

  /**
   * Handler hapus satu notifikasi.
   * Optimistic delete dengan menambahkan ID ke deletingIds.
   *
   * @param {React.MouseEvent} e - Event klik
   * @param {string} id - ID notifikasi
   */
  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (isAnyDeleting) return;
    setDeletingIds((prev) => [...prev, id]);
    onDelete?.(id);
  };

  /**
   * Handler hapus semua notifikasi.
   * Optimistic delete semua dengan menambahkan semua ID ke deletingIds.
   */
  const handleDeleteAll = () => {
    if (isAnyDeleting) return;
    const allIds = allNotifications.map((n) => n.id);
    setDeletingIds(allIds);
    onDeleteAll?.();
  };

  /** Handler tutup dialog detail */
  const handleCloseDetail = () => setSelectedNotif(null);

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={isAnyDeleting ? undefined : onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: 380,
              maxWidth: "100%",
              maxHeight: `calc(100vh - ${theme.spacing(12)})`,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.background.paper,
              backgroundImage: "none",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifikasi
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} Baru`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  height: 20,
                  fontSize: "0.6875rem",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
            {onRefresh && (
              <Tooltip title="Segarkan" placement="bottom">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isAnyDeleting}
                  sx={{
                    color: "text.secondary",
                    p: 0.75,
                    borderRadius: 1,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      color: theme.palette.secondary.main,
                    },
                  }}
                >
                  <RotateCcw size={16} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip title="Tandai semua dibaca" placement="bottom">
                <IconButton
                  size="small"
                  onClick={onMarkAllRead}
                  disabled={isAnyDeleting}
                  sx={{
                    color: "text.secondary",
                    p: 0.75,
                    borderRadius: 1,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      color: theme.palette.secondary.main,
                    },
                  }}
                >
                  <CheckCheck size={16} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            )}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 0.5, height: 16, alignSelf: "center" }}
            />
            <Tooltip title="Tutup" placement="bottom">
              <IconButton
                size="small"
                onClick={onClose}
                disabled={isAnyDeleting}
                sx={{
                  color: "text.secondary",
                  p: 0.75,
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    color: theme.palette.secondary.main,
                  },
                }}
              >
                <X size={16} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Content - Scrollable List */}
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 1,
          }}
        >
          {isLoading ? (
            <NotificationSkeleton />
          ) : allNotifications.length === 0 ? (
            /* Empty State */
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                px: 3,
                textAlign: "center",
              }}
            >
              <EmptyNotificationSvg opacity={0.4} />
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, mt: 1 }}>
                Belum Ada Notifikasi
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Saat ini Anda sudah membaca semua pemberitahuan.
              </Typography>
            </Box>
          ) : (
            /* Notification List */
            <Stack spacing={0.5}>
              {allNotifications.map((notif) => {
                const isDeleting = deletingIds.includes(notif.id);
                const notifColor = getNotifColor(notif.type);
                const isUnread = !notif.isRead;

                return (
                  <Box
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    sx={{
                      position: "relative",
                      p: 1.5,
                      pl: isUnread ? 2 : 1.5,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      cursor: isAnyDeleting ? "default" : "pointer",
                      transition: "all 0.2s ease",
                      bgcolor: isUnread
                        ? alpha(theme.palette.secondary.main, 0.04)
                        : "transparent",
                      opacity: isDeleting ? 0.4 : 1,
                      animation:
                        newItemIds.includes(notif.id)
                          ? `${fadeInUp} 0.35s ease-out`
                          : "none",
                      border: "1px solid transparent",
                      "&:hover": {
                        bgcolor: isAnyDeleting
                          ? undefined
                          : alpha(theme.palette.secondary.main, 0.08),
                        borderColor: isAnyDeleting
                          ? "transparent"
                          : alpha(theme.palette.secondary.main, 0.1),
                        "& .delete-btn-container": {
                          opacity: 1,
                          visibility: "visible",
                        },
                      },
                      // Indikator unread di kiri
                      ...(isUnread && {
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "15%",
                          height: "70%",
                          width: 3,
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4,
                          bgcolor:
                            theme.palette[notifColor]?.main ||
                            theme.palette.primary.main,
                        },
                      }),
                    }}
                  >
                    <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Title & Time */}
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              fontWeight: isUnread ? 600 : 500,
                              color: isUnread ? "text.primary" : "text.secondary",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {notif.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isUnread
                                ? theme.palette.primary.main
                                : "text.disabled",
                              fontWeight: isUnread ? 500 : 400,
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {formatRelativeTime(notif.createdAt)}
                          </Typography>
                        </Stack>

                        {/* Message */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.4,
                            mt: 0.5,
                          }}
                        >
                          {notif.message}
                        </Typography>

                        {/* Type Chip & Delete Button */}
                        <Stack
                          direction="row"
                          sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1.5,
                          }}
                        >
                          <Chip
                            label={notif.type}
                            size="small"
                            sx={{
                              bgcolor: alpha(
                                theme.palette[notifColor]?.main ||
                                  theme.palette.secondary.main,
                                0.1
                              ),
                              color:
                                theme.palette[notifColor]?.main ||
                                theme.palette.secondary.main,
                              fontWeight: 500,
                              height: 20,
                              fontSize: "0.625rem",
                            }}
                          />
                          <Box
                            className="delete-btn-container"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              opacity: 0,
                              visibility: "hidden",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => handleDelete(e, notif.id)}
                              disabled={isAnyDeleting}
                              sx={{
                                color: "text.secondary",
                                p: 0.5,
                                borderRadius: 1,
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.error.main, 0.08),
                                  color: theme.palette.error.main,
                                },
                              }}
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </IconButton>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Loading More Indicator */}
          {isFetchingNextPage && (
            <Box sx={{ pt: 1 }}>
              <NotificationSkeleton />
            </Box>
          )}
        </Box>

        {/* Footer - Delete All */}
        {allNotifications.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              p: 1.5,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Button
              size="small"
              disabled={isAnyDeleting}
              onClick={handleDeleteAll}
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
                textTransform: "none",
                fontWeight: 500,
                px: 2,
                "&:hover": {
                  bgcolor: "transparent",
                  color: theme.palette.error.main,
                  textDecoration: "underline",
                },
              }}
            >
              Bersihkan Semua Notifikasi
            </Button>
          </Box>
        )}
      </Popover>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedNotif}
        onClose={handleCloseDetail}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {selectedNotif?.title}
            </Typography>
            <IconButton onClick={handleCloseDetail} size="small" sx={{ mr: -0.5 }}>
              <X size={18} strokeWidth={2} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, pb: 3 }}>
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>
            {selectedNotif?.message}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            variant="outlined"
            onClick={handleCloseDetail}
            sx={{ fontWeight: 500, textTransform: "none" }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationPopover;