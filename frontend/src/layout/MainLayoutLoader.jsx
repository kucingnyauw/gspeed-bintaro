/**
 * MainLayoutLoader - Full layout skeleton untuk loading state.
 *
 * Menampilkan skeleton yang meniru struktur layout asli:
 * - Header skeleton dengan posisi fixed top
 * - Sidebar skeleton dengan posisi fixed left (desktop only)
 * - Content area skeleton dengan margin yang menyesuaikan sidebar
 * - Responsif: mobile menampilkan header + content saja
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isLoading - Status loading
 * @returns {JSX.Element|null} Layout skeleton atau null
 */
import { Box, Card, Skeleton, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { useDevice } from "@hooks/useDevice";
import { HEADER, SIDEBAR } from "@shared/constant";
import MainContentStyled from "@layout/MainContentStyled.jsx";

/**
 * HeaderSkeleton - Skeleton untuk header aplikasi.
 * Meniru struktur header asli: logo + menu toggle | search bar | action icons + avatar.
 *
 * @param {Object} props
 * @param {Object} props.theme - MUI theme
 * @param {boolean} props.isMobile - Apakah perangkat mobile
 * @param {boolean} props.isOpen - Status sidebar terbuka/tutup
 * @returns {JSX.Element} Header skeleton
 */
const HeaderSkeleton = ({ theme, isMobile, isOpen }) => {
  const headerHeight = isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT;
  const sidebarWidth = isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH;

  return (
    <Box
      sx={{
        width: "100%",
        height: headerHeight,
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        px: { xs: 2, sm: 2, md: 0 },
        gap: { xs: 1, sm: 2 },
        flexShrink: 0,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* LEFT: Logo area + Menu toggle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "flex-start", md: "space-between" },
          width: { xs: "auto", md: `${sidebarWidth}px` },
          pl: { xs: 0, md: isOpen ? `${3 * 8 - 4}px` : `${2 * 8 - 4}px` },
          pr: { xs: 0, md: isOpen ? 3 : 0 },
          transition: theme.transitions.create("width", {
            duration: "0.3s",
            easing: theme.transitions.easing.easeInOut,
          }),
          flexShrink: 0,
        }}
      >
        {/* Logo skeleton - hanya terlihat di desktop saat sidebar terbuka */}
        <Skeleton
          variant="rounded"
          width={100}
          height={28}
          sx={{
            display: { xs: "none", md: isOpen ? "block" : "none" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        {/* Menu toggle skeleton */}
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            flexShrink: 0,
            ml: { xs: `${2 * 8 - 4}px`, md: `${2 * 8 - 4}px` },
          }}
        />
      </Box>

      {/* CENTER: Search bar - desktop only */}
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
            maxWidth: 320,
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
      </Box>

      {/* SPACER: Mobile only */}
      <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />

      {/* RIGHT: Action icons + Avatar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: "6px", sm: "10px" },
          flexShrink: 0,
        }}
      >
        {/* Search icon - mobile only */}
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />

        {/* Fullscreen icon */}
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />

        {/* Theme icon */}
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />

        {/* Notification icon */}
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
        />

        {/* Cart icon - kasir only */}
        <Skeleton
          variant="rounded"
          width={36}
          height={36}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />

        {/* Divider */}
        <Skeleton
          variant="rounded"
          width={1}
          height={24}
          sx={{ mx: "2px" }}
        />

        {/* Avatar */}
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
 * SidebarSkeleton - Skeleton untuk sidebar navigasi.
 * Meniru struktur sidebar asli dengan group label, menu items, dan divider.
 *
 * @param {Object} props
 * @param {Object} props.theme - MUI theme
 * @param {boolean} props.isOpen - Status sidebar terbuka/tutup
 * @returns {JSX.Element} Sidebar skeleton
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
      bgcolor: "background.paper",
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      px: isOpen ? 2.5 : 1.5,
      py: 1.5,
      gap: 0,
      transition: theme.transitions.create("width", {
        duration: "0.3s",
        easing: theme.transitions.easing.easeInOut,
      }),
      overflow: "hidden",
    }}
  >
    {/* Section 1: Main Menu */}
    <Box>
      {/* Group label */}
      {isOpen && (
        <Skeleton
          width={60}
          height={10}
          sx={{
            mb: 1.5,
            mt: 0,
            ml: 2,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
          }}
        />
      )}

      {/* Menu items - 4 items */}
      {[1, 2, 3, 4].map((i) => (
        <Skeleton
          key={`main-${i}`}
          variant="rounded"
          height={44}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton height={1} sx={{ mx: 1, my: 2, opacity: 0.3 }} />

    {/* Section 2: Management */}
    <Box>
      {/* Group label */}
      {isOpen && (
        <Skeleton
          width={80}
          height={10}
          sx={{
            mb: 1.5,
            ml: 2,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
          }}
        />
      )}

      {/* Menu items - 4 items */}
      {[1, 2, 3, 4].map((i) => (
        <Skeleton
          key={`mgmt-${i}`}
          variant="rounded"
          height={44}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton height={1} sx={{ mx: 1, my: 2, opacity: 0.3 }} />

    {/* Section 3: Reports */}
    <Box>
      {/* Group label */}
      {isOpen && (
        <Skeleton
          width={70}
          height={10}
          sx={{
            mb: 1.5,
            ml: 2,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
          }}
        />
      )}

      {/* Menu items - 5 items */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={`report-${i}`}
          variant="rounded"
          height={44}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton height={1} sx={{ mx: 1, my: 2, opacity: 0.3 }} />

    {/* Section 4: Settings */}
    <Box>
      {/* Group label */}
      {isOpen && (
        <Skeleton
          width={50}
          height={10}
          sx={{
            mb: 1.5,
            ml: 2,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
          }}
        />
      )}

      {/* Menu items - 2 items */}
      {[1, 2].map((i) => (
        <Skeleton
          key={`settings-${i}`}
          variant="rounded"
          height={44}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>
  </Box>
);

/**
 * ContentSkeleton - Skeleton untuk area konten utama.
 * Menampilkan card skeleton untuk header, summary cards, dan chart area.
 *
 * @param {Object} props
 * @param {Object} props.theme - MUI theme
 * @returns {JSX.Element} Content skeleton
 */
const ContentSkeleton = ({ theme }) => (
  <Stack sx={{ gap: { xs: 3, sm: 4 } }}>
    {/* Page Header Card */}
    <Card
      sx={{
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="text" width="55%" height={18} sx={{ mt: 0.5 }} />
          </Box>
          <Stack direction="row" sx={{ gap: 1, flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}>
            <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
            <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
            <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
          </Stack>
        </Stack>
      </Box>
    </Card>

    {/* Summary Cards Grid */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          lg: "repeat(4, 1fr)",
        },
        gap: { xs: 2.5, sm: 3 },
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <Card
          key={i}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: `${theme.shape.borderRadius}px` }} />
            <Box>
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={32} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton width="70%" height={14} />
          </Box>
        </Card>
      ))}
    </Box>

    {/* Charts & Details Grid */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
        gap: { xs: 2.5, sm: 3 },
      }}
    >
      {/* Chart Card */}
      <Card
        sx={{
          borderRadius: `${theme.shape.borderRadius}px`,
          display: "flex",
          flexDirection: "column",
          minHeight: { xs: 300, sm: 360, md: 420 },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
          <Skeleton width="40%" height={28} />
          <Skeleton width="50%" height={16} sx={{ mt: 0.5 }} />
        </Box>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: 200, sm: 260, md: 320 },
          }}
        >
          <Skeleton
            variant="rounded"
            width="100%"
            height="100%"
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              minHeight: { xs: 180, sm: 240, md: 280 },
            }}
          />
        </Box>
      </Card>

      {/* Detail Cards */}
      <Stack sx={{ gap: { xs: 2.5, sm: 3 } }}>
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              minHeight: { xs: 120, sm: 140 },
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                <Skeleton
                  variant="rounded"
                  width={44}
                  height={44}
                  sx={{ borderRadius: `${theme.shape.borderRadius}px`, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton width="50%" height={20} />
                  <Skeleton width="35%" height={32} sx={{ mt: 0.5 }} />
                  <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
                </Box>
              </Stack>
            </Box>
          </Card>
        ))}
      </Stack>
    </Box>
  </Stack>
);

/**
 * MainLayoutLoader - Full layout skeleton untuk loading state.
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - Status loading
 * @returns {JSX.Element|null} Layout skeleton
 */
const MainLayoutLoader = ({ isLoading }) => {
  const theme = useTheme();
  const isOpen = useSelector(selectSidebarIsOpen);
  const { isMobile } = useDevice();

  if (!isLoading) return null;

  const headerHeight = isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Header - Fixed top */}
      <HeaderSkeleton theme={theme} isMobile={isMobile} isOpen={isOpen} />

      {/* Body: Sidebar + Content */}
      <Box
        sx={{
          display: "flex",
          flex: 1,

        }}
      >
        {/* Sidebar - Fixed left, desktop only */}
        {!isMobile && <SidebarSkeleton theme={theme} isOpen={isOpen} />}

        {/* Main Content Area */}
        <MainContentStyled open={isOpen} isMobile={isMobile}>
          <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
            <ContentSkeleton theme={theme} />
          </Box>
        </MainContentStyled>
      </Box>
    </Box>
  );
};

export default MainLayoutLoader;