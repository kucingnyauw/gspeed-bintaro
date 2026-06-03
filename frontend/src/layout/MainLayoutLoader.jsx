import { Box, Card, Skeleton, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { useDevice } from "@hooks/useDevice";
import { HEADER, SIDEBAR } from "@shared/constant";
import MainContentStyled from "@layout/MainContentStyled.jsx";

/**
 * Skeleton untuk Header saat loading.
 * @param {Object} props
 * @param {Object} props.theme
 * @param {boolean} props.isMobile
 * @param {boolean} props.isOpen
 */
const HeaderSkeleton = ({ theme, isMobile, isOpen }) => {
  const sidebarWidth = isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH;

  return (
    <Box
      sx={{
        width: "100%",
        height: isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        px: { xs: theme.spacing(2), sm: theme.spacing(3) },
        gap: theme.spacing(2),
        flexShrink: 0,
        position: "fixed",
        top: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing(1.5),
          width: { xs: "auto", md: `${sidebarWidth}px` },
          transition: `width ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
          justifyContent: {
            xs: "flex-start",
            md: isOpen ? "flex-start" : "center",
          },
          pl: { xs: 0, md: isOpen ? theme.spacing(3) : 0 },
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rounded"
          width={100}
          height={28}
          sx={{
            display: { xs: "none", md: isOpen ? "block" : "none" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            flexShrink: 0,
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
        }}
      >
        <Skeleton
          variant="rounded"
          height={40}
          sx={{
            width: "100%",
            maxWidth: 360,
            borderRadius: `${theme.shape.borderRadius * 1.5}px`,
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: theme.spacing(0.5), sm: theme.spacing(1.5) },
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
        />
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          width={1}
          height={24}
          sx={{ mx: theme.spacing(0.5) }}
        />
        <Skeleton
          variant="circular"
          width={36}
          height={36}
          sx={{ flexShrink: 0 }}
        />
      </Box>
    </Box>
  );
};

/**
 * Skeleton untuk Sidebar saat loading.
 * @param {Object} props
 * @param {Object} props.theme
 * @param {boolean} props.isOpen
 */
const SidebarSkeleton = ({ theme, isOpen }) => (
  <Box
    sx={{
      width: isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH,
      flexShrink: 0,
      position: "fixed",
      top: HEADER.DESKTOP_HEIGHT,
      left: 0,
      height: `calc(100vh - ${HEADER.DESKTOP_HEIGHT}px)`,
      borderRight: `1px solid ${theme.palette.divider}`,
      bgcolor: theme.palette.background.paper,
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      px: isOpen ? theme.spacing(2) : theme.spacing(1),
      py: theme.spacing(2.5),
      gap: theme.spacing(0.5),
      transition: `width ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
      overflow: "hidden",
    }}
  >
    {[1, 2, 3].map((section) => (
      <Box key={section}>
        {isOpen && (
          <Skeleton
            width={section === 1 ? 60 : section === 2 ? 80 : 50}
            height={12}
            sx={{
              mb: 1,
              mt: section === 1 ? 0 : 1.5,
              ml: theme.spacing(1.5),
              borderRadius: `${theme.shape.borderRadius / 2}px`,
            }}
          />
        )}
        {Array.from({ length: section === 3 ? 2 : section === 2 ? 4 : 3 }).map(
          (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={isOpen ? 44 : 38}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mb: 0.5,
                ...(isOpen ? {} : { mx: "auto", width: 38 }),
              }}
            />
          )
        )}
        {section < 3 && (
          <Skeleton
            height={1}
            sx={{ mx: theme.spacing(1), my: theme.spacing(1.5) }}
          />
        )}
      </Box>
    ))}
  </Box>
);

/**
 * Skeleton untuk Content Area saat loading.
 * @param {Object} props
 * @param {Object} props.theme
 */
const ContentSkeleton = ({ theme }) => (
  <Stack sx={{ gap: theme.spacing(4) }}>
    <Card
      sx={{
        p: theme.spacing(3),
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "none",
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="text" width={300} height={18} sx={{ mt: 0.75 }} />
        </Box>
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
        />
      </Stack>
    </Card>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          lg: "repeat(4, 1fr)",
        },
        gap: theme.spacing(4),
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <Card
          key={i}
          sx={{
            p: theme.spacing(2.5),
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "none",
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        >
          <Stack sx={{ gap: theme.spacing(1.5) }}>
            <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
            <Box>
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={32} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton width="70%" height={14} />
          </Stack>
        </Card>
      ))}
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
        gap: theme.spacing(4),
      }}
    >
      <Card
        sx={{
          p: theme.spacing(3),
          minHeight: 420,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
          borderRadius: `${theme.shape.borderRadius}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box>
          <Skeleton width={180} height={28} />
          <Skeleton width={240} height={16} sx={{ mt: 0.75 }} />
        </Box>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ mt: theme.spacing(3), flex: 1, borderRadius: `${theme.shape.borderRadius}px` }}
        />
      </Card>

      <Stack sx={{ gap: theme.spacing(4) }}>
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            sx={{
              p: theme.spacing(2.5),
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: "none",
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <Stack direction="row" sx={{ gap: theme.spacing(2), alignItems: "center" }}>
              <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: `${theme.shape.borderRadius}px`, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="50%" height={18} />
                <Skeleton width="35%" height={28} sx={{ mt: 0.5 }} />
                <Skeleton width="60%" height={14} sx={{ mt: 0.5 }} />
              </Box>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Box>
  </Stack>
);

/**
 * MainLayoutLoader - Full layout skeleton untuk loading state.
 * @param {Object} props
 * @param {boolean} props.isLoading
 */
const MainLayoutLoader = ({ isLoading }) => {
  const theme = useTheme();
  const isOpen = useSelector(selectSidebarIsOpen);
  const { isMobile } = useDevice();

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      <HeaderSkeleton theme={theme} isMobile={isMobile} isOpen={isOpen} />

      <Box
        sx={{
          display: "flex",
          flex: 1,
   
        }}
      >
        {!isMobile && <SidebarSkeleton theme={theme} isOpen={isOpen} />}

        <MainContentStyled open={isOpen} isMobile={isMobile}>
          <Box sx={{ p: { xs: theme.spacing(2.5), sm: theme.spacing(4) } }}>
            <ContentSkeleton theme={theme} />
          </Box>
        </MainContentStyled>
      </Box>
    </Box>
  );
};

export default MainLayoutLoader;