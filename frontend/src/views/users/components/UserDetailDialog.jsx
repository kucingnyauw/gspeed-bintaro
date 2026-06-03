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

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={100} />
  </Stack>
);

const UserDetailDialog = ({ open, userId, onClose }) => {
  const theme = useTheme();
  const { data: user, isLoading } = useUserDetailQuery(userId, open);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Detail Karyawan
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
        {isLoading ? (
          <DetailSkeleton />
        ) : user ? (
          <Stack sx={{ gap: 3 }}>
            {/* Header Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    {user.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
                      {user.fullName}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 1 }}>
                      <Chip
                        label={normalizeEnumText(user.role)}
                        size="small"
                        variant="outlined"
                        color={roleColorMap[user.role] || "default"}
                        sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
                      />
                      <Chip
                        label={user.isActive ? "Aktif" : "Nonaktif"}
                        color={user.isActive ? "success" : "default"}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500, fontSize: "0.75rem", height: 24 }}
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
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Informasi
                </Typography>
                <Stack sx={{ gap: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{user.email}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Telepon</Typography>
                    <Typography variant="body2">{user.phone || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Dibuat</Typography>
                    <Typography variant="body2">{formatDateTime(user.createdAt)}</Typography>
                  </Stack>
                  {user.updatedAt && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Diupdate</Typography>
                      <Typography variant="body2">{formatDateTime(user.updatedAt)}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Card>
          </Stack>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Data tidak ditemukan
            </Typography>
            <Typography variant="body2" color="text.disabled">
              User mungkin telah dihapus atau ID tidak valid
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 500, textTransform: "none" }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailDialog;