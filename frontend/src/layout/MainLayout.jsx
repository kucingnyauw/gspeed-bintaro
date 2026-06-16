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

/**
 * MainLayout - Layout utama aplikasi untuk halaman yang memerlukan autentikasi.
 *
 * Struktur layout:
 * - Header (fixed top)
 * - Sidebar (collapsible)
 * - Main Content dengan Outlet untuk nested routes
 * - Footer
 * - Tools panel
 *
 * Fitur:
 * - Sidebar responsif dengan state open/close dari Redux
 * - Main content area dengan margin yang menyesuaikan sidebar
 * - Animasi fade-in pada content container
 * - Scroll to top otomatis saat navigasi (via NavigationScroll)
 *
 * @component
 * @returns {JSX.Element} Main layout dengan NavigationScroll wrapper
 */
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
