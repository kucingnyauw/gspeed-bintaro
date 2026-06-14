/**
 * UserDetailDialog - Dialog untuk menampilkan detail karyawan/user.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {string} props.userId - ID user
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element}
 */
import { X } from "lucide-react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime, normalizeEnumText } from "@shared/utils";
import { roleColorMap } from "@shared/constant";
import { useUserDetailQuery } from "@views/users/hooks";
import { useDevice } from "@hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 4 }}>
    <Skeleton variant="rounded" height={100} sx={{ minHeight: 80 }} />
    <Skeleton variant="rounded" height={120} sx={{ minHeight: 100 }} />
  </Stack>
);

const UserDetailDialog = ({ open, userId, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const { data: user, isLoading } = useUserDetailQuery(userId, open);
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: br, overflow: "hidden" } } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, px: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}
          >
            Detail Karyawan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, px: { xs: 2.5, sm: 3 }, pb: 3 }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : user ? (
          <Stack sx={{ gap: 4 }}>
            {/* Header Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack
                  direction="row"
                  sx={{ gap: { xs: 2, sm: 2.5 }, alignItems: "center" }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      fontSize: { xs: "1.125rem", sm: "1.25rem" },
                      fontWeight: 700,
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                      flexShrink: 0,
                    }}
                  >
                    {user.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                      }}
                      noWrap
                    >
                      {user.fullName}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={normalizeEnumText(user.role)}
                        size="small"
                        variant="outlined"
                        color={roleColorMap[user.role] || "default"}
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      <Chip
                        label={user.isActive ? "Aktif" : "Nonaktif"}
                        color={user.isActive ? "success" : "default"}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Card>

            {/* Informasi */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: br,
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  }}
                >
                  Informasi
                </Typography>
                <Stack sx={{ gap: 2.5 }}>
                  {[
                    { label: "Email", value: user.email },
                    { label: "Telepon", value: user.phone || "—" },
                    { label: "Dibuat", value: formatDateTime(user.createdAt) },
                    ...(user.updatedAt
                      ? [
                          {
                            label: "Diupdate",
                            value: formatDateTime(user.updatedAt),
                          },
                        ]
                      : []),
                  ].map((item, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          maxWidth: "65%",
                          textAlign: "right",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Card>
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: { xs: 6, sm: 8 },
              gap: 2,
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              Data tidak ditemukan
            </Typography>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
            >
              User mungkin telah dihapus atau ID tidak valid
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            fontWeight: 500,
            textTransform: "none",
            borderRadius: br,
            px: 3,
          }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailDialog;
