/**
 * MainLayout - Layout utama aplikasi untuk halaman yang memerlukan autentikasi.
 *
 * Tidak ada logic auth di sini. Semua guard & loading state ditangani oleh:
 * - PrivateGuard (unknown → AppLoading, guest → redirect, auth/degraded → render)
 *
 * @component
 * @returns {JSX.Element} Main layout dengan NavigationScroll wrapper
 */
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useDevice } from "@hooks/useDevice";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import Header from "@layout/header/Header.jsx";
import Sidebar from "@layout/sidebar/Sidebar.jsx";
import Footer from "@layout/Footer.jsx";
import Tools from "@layout/tools/Tools.jsx";
import MainContentStyled from "@layout/MainContentStyled.jsx";
import NavigationScroll from "@layout/NavigationScroll.jsx";

const MainLayout = () => {
  const isOpen = useSelector(selectSidebarIsOpen);
  const { isMobile } = useDevice();

  return (
    <NavigationScroll>
      <Header />
      <Sidebar />
      <MainContentStyled open={isOpen} isMobile={isMobile}>
        <Box className="content-container fade-in">
          <Outlet />
        </Box>
        <Footer />
      </MainContentStyled>
      <Tools />
    </NavigationScroll>
  );
};

export default MainLayout;