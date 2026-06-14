/**
 * MainLayoutLoader - Full layout skeleton untuk loading state.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isLoading - Status loading
 * @returns {JSX.Element|null} Layout skeleton atau null
 */
import { Box, Card, Divider, Skeleton, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { useDevice } from "@hooks/useDevice";
import { HEADER, SIDEBAR } from "@shared/constant";
import MainContentStyled from "@layout/MainContentStyled.jsx";

const HeaderSkeleton = ({ theme, isMobile, isOpen }) => {
  const headerHeight = isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT;
  const sidebarWidth = isOpen
    ? SIDEBAR.EXPANDED_WIDTH
    : SIDEBAR.COLLAPSED_WIDTH;
  const br = `${theme.shape.borderRadius}px`;

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
        <Skeleton
          variant="rounded"
          width={100}
          height={28}
          sx={{
            display: { xs: "none", md: isOpen ? "block" : "none" },
            borderRadius: br,
            minWidth: 80,
          }}
        />
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{
            borderRadius: br,
            flexShrink: 0,
            ml: { xs: `${2 * 8 - 4}px`, md: `${2 * 8 - 4}px` },
            minWidth: 38,
            minHeight: 38,
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
          sx={{ width: 320, maxWidth: 320, borderRadius: br, minWidth: 200 }}
        />
      </Box>
      <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: "6px", sm: "10px" },
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            borderRadius: br,
            minWidth: 38,
            minHeight: 38,
          }}
        />
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: br,
            minWidth: 38,
            minHeight: 38,
          }}
        />
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: br,
            minWidth: 38,
            minHeight: 38,
          }}
        />
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{ borderRadius: br, minWidth: 38, minHeight: 38 }}
        />
        <Skeleton
          variant="rounded"
          width={38}
          height={38}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: br,
            minWidth: 38,
            minHeight: 38,
          }}
        />
        <Skeleton
          variant="circular"
          width={32}
          height={32}
          sx={{
            flexShrink: 0,
            minWidth: 32,
            minHeight: 32,
            ml: { xs: 0.5, sm: 1 },
          }}
        />
      </Box>
    </Box>
  );
};

const SidebarSkeleton = ({ theme, isOpen }) => {
  const br = `${theme.shape.borderRadius}px`;
  return (
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
        transition: theme.transitions.create("width", {
          duration: "0.3s",
          easing: theme.transitions.easing.easeInOut,
        }),
        overflow: "hidden",
      }}
    >
      {[
        { width: 60, count: 4 },
        { width: 80, count: 4 },
        { width: 70, count: 5 },
        { width: 50, count: 2 },
      ].map((section, si) => (
        <Box key={si}>
          {isOpen && (
            <Skeleton
              width={section.width}
              height={10}
              sx={{
                mb: 1.5,
                mt: si === 0 ? 0 : 2,
                ml: 2,
                borderRadius: `${theme.shape.borderRadius / 2}px`,
                minWidth: 40,
              }}
            />
          )}
          {Array.from({ length: section.count }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={44}
              sx={{
                borderRadius: br,
                mb: 0.5,
                minHeight: 44,
                ...(isOpen
                  ? { minWidth: 120 }
                  : { mx: "auto", width: 36, minWidth: 36 }),
              }}
            />
          ))}
          {si < 3 && (
            <Skeleton
              height={1}
              sx={{ mx: 1, my: 2, opacity: 0.3, minWidth: 20 }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

const ContentSkeleton = ({ theme }) => {
  const { isMobile } = useDevice();
  const br = `${theme.shape.borderRadius}px`;

  return (
    <Stack sx={{ gap: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header Card */}
      <Card sx={{ borderRadius: br }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton
                variant="text"
                width={isMobile ? 180 : 240}
                height={isMobile ? 28 : 32}
                sx={{ minWidth: 120 }}
              />
              <Skeleton
                variant="text"
                width={isMobile ? 240 : 320}
                height={isMobile ? 16 : 20}
                sx={{ mt: 0.5, minWidth: 160 }}
              />
            </Box>
            <Skeleton
              variant="rounded"
              width={38}
              height={38}
              sx={{ borderRadius: br, flexShrink: 0, ml: 2 }}
            />
          </Stack>
        </Box>
      </Card>

      {/* Summary Cards Row 1 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            sx={{
              borderRadius: br,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: 120, sm: 140 },
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
              <Skeleton
                variant="rounded"
                width={40}
                height={40}
                sx={{ borderRadius: br }}
              />
              <Box>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={32}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Skeleton variant="text" width="70%" height={14} />
            </Box>
          </Card>
        ))}
      </Box>

      {/* Chart + Stats Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <Card
          sx={{
            borderRadius: br,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: { xs: 300, sm: 360, md: 420 },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton
                  variant="text"
                  width={isMobile ? 160 : 200}
                  height={isMobile ? 24 : 28}
                  sx={{ minWidth: 120 }}
                />
                <Skeleton
                  variant="text"
                  width={isMobile ? 200 : 260}
                  height={16}
                  sx={{ mt: 0.5, minWidth: 140 }}
                />
              </Box>
              <Skeleton
                variant="rounded"
                width={38}
                height={38}
                sx={{ borderRadius: br, ml: 2, flexShrink: 0 }}
              />
            </Stack>
          </Box>
          <Divider />
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
                borderRadius: br,
                minHeight: { xs: 180, sm: 240, md: 280 },
              }}
            />
          </Box>
        </Card>
        <Stack sx={{ gap: { xs: 2, sm: 2.5, md: 3 } }}>
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              sx={{ borderRadius: br, minHeight: { xs: 120, sm: 140 } }}
            >
              <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
                  <Skeleton
                    variant="rounded"
                    width={44}
                    height={44}
                    sx={{ borderRadius: br, flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton variant="text" width="50%" height={20} />
                    <Skeleton
                      variant="text"
                      width="35%"
                      height={32}
                      sx={{ mt: 0.5 }}
                    />
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={16}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Summary Cards Row 2 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            sx={{
              borderRadius: br,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: 120, sm: 140 },
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
              <Skeleton
                variant="rounded"
                width={40}
                height={40}
                sx={{ borderRadius: br }}
              />
              <Box>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={32}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Skeleton variant="text" width="70%" height={14} />
            </Box>
          </Card>
        ))}
      </Box>

      {/* Target Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        {[1, 2].map((i) => (
          <Card
            key={i}
            sx={{ borderRadius: br, display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton
                    variant="text"
                    width={isMobile ? 140 : 160}
                    height={isMobile ? 24 : 28}
                    sx={{ minWidth: 100 }}
                  />
                  <Skeleton
                    variant="text"
                    width={isMobile ? 180 : 220}
                    height={16}
                    sx={{ mt: 0.5, minWidth: 120 }}
                  />
                </Box>
                <Skeleton
                  variant="rounded"
                  width={38}
                  height={38}
                  sx={{ borderRadius: br, ml: 2, flexShrink: 0 }}
                />
              </Stack>
            </Box>
            <Divider />
            <Box
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: { xs: 250, sm: 300, md: 320 },
              }}
            >
              <Skeleton
                variant="rounded"
                width="100%"
                height="100%"
                sx={{
                  borderRadius: br,
                  minHeight: { xs: 200, sm: 260, md: 280 },
                }}
              />
            </Box>
          </Card>
        ))}
      </Box>

      {/* Yearly Target */}
      <Card sx={{ borderRadius: br }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, pb: 2 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton
                variant="text"
                width={isMobile ? 140 : 160}
                height={isMobile ? 24 : 28}
                sx={{ minWidth: 100 }}
              />
              <Skeleton
                variant="text"
                width={isMobile ? 180 : 220}
                height={16}
                sx={{ mt: 0.5, minWidth: 120 }}
              />
            </Box>
            <Skeleton
              variant="rounded"
              width={38}
              height={38}
              sx={{ borderRadius: br, ml: 2, flexShrink: 0 }}
            />
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
              gap: { xs: 3, md: 4 },
            }}
          >
            <Box sx={{ flex: 2, minWidth: { xs: "100%", md: 280 } }}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <Skeleton variant="text" width="30%" height={20} />
                <Stack direction="row" sx={{ gap: 1 }}>
                  <Skeleton variant="text" width={60} height={20} />
                  <Skeleton variant="text" width={80} height={20} />
                </Stack>
              </Stack>
              <Skeleton
                variant="rounded"
                width="100%"
                height={10}
                sx={{ borderRadius: br }}
              />
            </Box>
            <Divider
              orientation={isMobile ? "horizontal" : "vertical"}
              flexItem
            />
            <Box
              sx={{
                flex: 1,
                minWidth: { xs: "100%", md: 140 },
                alignSelf: "center",
              }}
            >
              <Stack
                direction="row"
                sx={{
                  gap: { xs: 4, md: 6 },
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Box>
                  <Skeleton variant="text" width={80} height={32} />
                  <Skeleton
                    variant="text"
                    width={60}
                    height={16}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box>
                  <Skeleton variant="text" width={100} height={32} />
                  <Skeleton
                    variant="text"
                    width={60}
                    height={16}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );
};

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
        bgcolor: "background.default",
      }}
    >
      <HeaderSkeleton theme={theme} isMobile={isMobile} isOpen={isOpen} />
      <Box sx={{ display: "flex", flex: 1 }}>
        {!isMobile && <SidebarSkeleton theme={theme} isOpen={isOpen} />}
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
