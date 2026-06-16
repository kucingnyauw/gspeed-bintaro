/**
 * NotificationPopover - Komponen popover notifikasi dengan infinite scroll, read/unread status, dan bulk actions.
 *
 * Fitur:
 * - Infinite scroll untuk load more notifikasi
 * - Animasi fade-in untuk notifikasi baru
 * - Mark as read (single & bulk)
 * - Delete notifikasi (single & bulk)
 * - Detail notifikasi dalam dialog dengan markdown rendering
 * - Empty state dengan ilustrasi
 * - Loading skeleton
 * - Optimistic delete dengan animasi fade-out
 * - Scroll position preservation saat load more
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { formatRelativeTime } from "@shared/utils";
import { notificationTypeColorMap } from "@shared/constant";
import { useDevice } from "@hooks";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

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

const getNotifColor = (type) => notificationTypeColorMap[type] || "default";

/**
 * MarkdownContent - Render markdown dengan styling minimalis untuk dialog detail.
 *
 * @component
 * @param {Object} props
 * @param {string} props.content - Konten markdown
 * @returns {JSX.Element}
 */

const MarkdownContent = ({ content }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();

  const markdownStyles = {
    "& p": {
      m: 0,
      lineHeight: 1.6,
      color: "inherit",
      fontSize: isMobile ? "0.8125rem" : "0.875rem",
    },
    "& p:not(:last-child)": { mb: 0.75 },
    "& ul, & ol": { m: 0, pl: 2, lineHeight: 1.6, color: "inherit" },
    "& li:not(:last-child)": { mb: 0.125 },
    "& strong": { fontWeight: 500, color: "inherit" },
    "& em": { fontStyle: "italic" },
    "& code": {
      px: 0.5,
      py: 0.125,
      borderRadius: 0.75,
      fontSize: "0.75rem",
      fontFamily: "monospace",
      bgcolor: alpha(theme.palette.common.black, 0.06),
      color: "inherit",
    },
    "& pre": {
      m: 0,
      p: 1.25,
      borderRadius: 1,
      fontSize: "0.75rem",
      fontFamily: "monospace",
      bgcolor: alpha(theme.palette.common.black, 0.06),
      overflow: "auto",
    },
    "& blockquote": {
      m: 0,
      pl: 1.5,
      py: 0.125,
      borderLeft: `2px solid ${alpha(theme.palette.secondary.main, 0.5)}`,
      opacity: 0.85,
      fontStyle: "italic",
    },
    "& hr": {
      my: 1,
      border: "none",
      borderTop: `1px solid ${theme.palette.divider}`,
    },
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      m: 0,
      mt: 0.75,
      mb: 0.25,
      fontWeight: 500,
      lineHeight: 1.4,
      color: "inherit",
      "&:first-of-type": { mt: 0 },
    },
    "& h1": { fontSize: "0.9375rem" },
    "& h2": { fontSize: "0.875rem" },
    "& h3": { fontSize: "0.8125rem" },
    "& h4, & h5, & h6": { fontSize: "0.75rem" },
    "& table": {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.6875rem",
      my: 1,
    },
    "& thead": { borderBottom: `1px solid ${theme.palette.divider}` },
    "& th": {
      textAlign: "left",
      px: 1,
      py: 0.75,
      fontWeight: 500,
      color: "text.secondary",
      fontSize: "0.6875rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    },
    "& td": {
      px: 1,
      py: 0.75,
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
    },
    "& tr:last-child td": { borderBottom: "none" },
    "& tbody tr:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.02) },
  };

  return (
    <Box sx={markdownStyles}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
};

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
  const { isMobile } = useDevice();
  const scrollRef = useRef(null);
  const prevScrollHeight = useRef(0);
  const [prevLength, setPrevLength] = useState(0);
  const [newItemIds, setNewItemIds] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  const allNotifications =
    notifications?.pages?.flatMap((page) => page.data) || [];
  const isAnyDeleting = deletingIds.length > 0;
  const br = `${theme.shape.borderRadius}px`;

  useEffect(() => {
    if (allNotifications.length > prevLength) {
      const newIds = allNotifications.slice(prevLength).map((n) => n.id);
      setNewItemIds(newIds);
      const timer = setTimeout(() => setNewItemIds([]), 400);
      return () => clearTimeout(timer);
    }
    setPrevLength(allNotifications.length);
  }, [allNotifications.length, prevLength]);

  useEffect(() => {
    if (deletingIds.length > 0) {
      const currentIds = allNotifications.map((n) => n.id);
      if (!deletingIds.some((id) => currentIds.includes(id)))
        setDeletingIds([]);
    }
  }, [allNotifications, deletingIds]);

  useEffect(() => {
    let timer;
    if (deletingIds.length > 0)
      timer = setTimeout(() => setDeletingIds([]), 3000);
    return () => clearTimeout(timer);
  }, [deletingIds]);

  useEffect(() => {
    if (
      !isFetchingNextPage &&
      prevScrollHeight.current > 0 &&
      scrollRef.current
    ) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const diff =
            scrollRef.current.scrollHeight - prevScrollHeight.current;
          scrollRef.current.scrollTop += diff;
          prevScrollHeight.current = 0;
        }
      });
    }
  }, [isFetchingNextPage]);

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        prevScrollHeight.current = scrollHeight;
        onFetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage]
  );

  const handleNotifClick = (notif) => {
    if (isAnyDeleting) return;
    if (!notif.isRead) onMarkRead(notif.id);
    setSelectedNotif(notif);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (isAnyDeleting) return;
    setDeletingIds((prev) => [...prev, id]);
    onDelete?.(id);
  };

  const handleDeleteAll = () => {
    if (isAnyDeleting) return;
    setDeletingIds(allNotifications.map((n) => n.id));
    onDeleteAll?.();
  };

  const handleCloseDetail = () => setSelectedNotif(null);

  const iconBtnSx = {
    color: "text.secondary",
    borderRadius: br,
    minWidth: 38,
    minHeight: 38,
    p: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    borderColor: alpha(theme.palette.divider, 0.8),
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.08),
      borderColor: alpha(theme.palette.secondary.main, 0.4),
      color: theme.palette.secondary.main,
    },
  };

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
              width: { xs: 340, sm: 380 },
              maxWidth: "100%",
              maxHeight: `calc(100vh - ${theme.spacing(12)})`,
              borderRadius: br,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
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
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1.5, sm: 2 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              }}
            >
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
                  fontSize: "0.625rem",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            )}
          </Stack>
          <Stack direction="row" sx={{ gap: "6px", alignItems: "center" }}>
            {onRefresh && (
              <Tooltip title="Segarkan" placement="bottom">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isAnyDeleting}
                  aria-label="Segarkan notifikasi"
                  sx={iconBtnSx}
                >
                  <RotateCcw size={isMobile ? 14 : 16} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip title="Tandai semua dibaca" placement="bottom">
                <IconButton
                  size="small"
                  onClick={onMarkAllRead}
                  disabled={isAnyDeleting}
                  aria-label="Tandai semua notifikasi dibaca"
                  sx={iconBtnSx}
                >
                  <CheckCheck size={isMobile ? 14 : 16} strokeWidth={2} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Tutup" placement="bottom">
              <IconButton
                size="small"
                onClick={onClose}
                disabled={isAnyDeleting}
                aria-label="Tutup notifikasi"
                sx={iconBtnSx}
              >
                <X size={isMobile ? 14 : 16} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Content */}
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 1,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha(theme.palette.divider, 0.5),
              borderRadius: 10,
            },
          }}
        >
          {isLoading ? (
            <NotificationSkeleton />
          ) : allNotifications.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                px: 3,
                textAlign: "center",
                minHeight: 280,
              }}
            >
              <EmptyNotificationSvg opacity={0.4} />
              <Typography
                variant="body2"
                color="text.primary"
                sx={{
                  fontWeight: 600,
                  mt: 1,
                  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                }}
              >
                Belum Ada Notifikasi
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, fontSize: { xs: "0.6875rem", sm: "0.75rem" } }}
              >
                Saat ini Anda sudah membaca semua pemberitahuan.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.5}>
              {allNotifications.map((notif) => {
                const isDeleting = deletingIds.includes(notif.id);
                const isUnread = !notif.isRead;
                const notifColor = getNotifColor(notif.type);
                const resolvedColor =
                  theme.palette[notifColor]?.main ||
                  theme.palette.secondary.main;

                return (
                  <Stack
                    key={notif.id}
                    direction="row"
                    onClick={() => handleNotifClick(notif)}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: br,
                      cursor: isAnyDeleting ? "default" : "pointer",
                      transition: "all 0.2s ease",
                      alignItems: "center",
                      gap: 1.5,
                      bgcolor: isUnread
                        ? alpha(theme.palette.secondary.main, 0.04)
                        : "transparent",
                      opacity: isDeleting ? 0.4 : 1,
                      animation: newItemIds.includes(notif.id)
                        ? `${fadeInUp} 0.35s ease-out`
                        : "none",
                      "&:hover": {
                        bgcolor: isAnyDeleting
                          ? undefined
                          : alpha(theme.palette.secondary.main, 0.06),
                        "& .delete-btn-container": {
                          opacity: 1,
                          visibility: "visible",
                        },
                      },
                    }}
                  >
                    {/* Unread Dot */}
                    {isUnread && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: resolvedColor,
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${alpha(resolvedColor, 0.4)}`,
                        }}
                      />
                    )}

                    {/* Title */}
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontWeight: isUnread ? 600 : 500,
                        color: isUnread ? "text.primary" : "text.secondary",
                        fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                      }}
                    >
                      {notif.title}
                    </Typography>

                    {/* Time */}
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        color: isUnread
                          ? theme.palette.secondary.main
                          : "text.disabled",
                        fontWeight: isUnread ? 500 : 400,
                        fontSize: { xs: "0.625rem", sm: "0.6875rem" },
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(notif.createdAt)}
                    </Typography>

                    {/* Delete Button */}
                    <Box
                      className="delete-btn-container"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        opacity: 0,
                        visibility: "hidden",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, notif.id)}
                        disabled={isAnyDeleting}
                        sx={{
                          color: "text.secondary",
                          p: 0.25,
                          borderRadius: 1,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            color: theme.palette.error.main,
                          },
                        }}
                      >
                        <Trash2 size={12} strokeWidth={2} />
                      </IconButton>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
          {isFetchingNextPage && (
            <Box sx={{ pt: 1 }}>
              <NotificationSkeleton />
            </Box>
          )}
        </Box>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              p: { xs: 1.25, sm: 1.5 },
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
                fontSize: { xs: "0.6875rem", sm: "0.75rem" },
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
        slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}
      >
        <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Stack
              direction="row"
              sx={{ gap: 1.5, alignItems: "center", minWidth: 0 }}
            >
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {selectedNotif?.title}
              </Typography>
              {selectedNotif?.type && (
                <Chip
                  label={selectedNotif.type}
                  size="small"
                  sx={{
                    bgcolor: alpha(
                      theme.palette[getNotifColor(selectedNotif.type)]?.main ||
                        theme.palette.secondary.main,
                      0.1
                    ),
                    color:
                      theme.palette[getNotifColor(selectedNotif.type)]?.main ||
                      theme.palette.secondary.main,
                    fontWeight: 500,
                    height: 22,
                    fontSize: "0.625rem",
                    flexShrink: 0,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              )}
            </Stack>
            <IconButton
              onClick={handleCloseDetail}
              size="small"
              sx={{ mr: -0.5, flexShrink: 0 }}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 } }}>
          <MarkdownContent content={selectedNotif?.message || ""} />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
          <Button
            variant="outlined"
            onClick={handleCloseDetail}
            sx={{
              fontWeight: 500,
              textTransform: "none",
              borderRadius: br,
              px: 3,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationPopover;
