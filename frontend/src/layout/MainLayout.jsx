/**
 * MainLayout - Layout utama aplikasi untuk halaman yang memerlukan autentikasi.
 *
 * Struktur layout:
 * - Header (fixed top)
 * - Sidebar (collapsible)
 * - Main Content dengan Outlet untuk nested routes
 * - Footer
 * - Customization panel
 *
 * Fitur:
 * - Menampilkan loader saat status auth unknown/degraded atau loading
 * - Sidebar responsif dengan state open/close dari Redux
 * - Main content area dengan margin yang menyesuaikan sidebar
 * - Animasi fade-in pada content container
 * - Scroll to top otomatis saat navigasi (via NavigationScroll)
 *
 * @component
 * @returns {JSX.Element} Main layout dengan NavigationScroll wrapper
 */
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useDevice } from "@hooks/useDevice";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { selectAuthStatus, selectAuthLoading } from "@store/auth/authSelector.js";
import Header from "@layout/header/Header.jsx";
import Sidebar from "@layout/sidebar/Sidebar.jsx";
import Footer from "@layout/Footer.jsx";
import Customization from "@layout/customization/Customization.jsx";
import MainContentStyled from "@layout/MainContentStyled.jsx";
import MainLayoutLoader from "@layout/MainLayoutLoader.jsx";
import NavigationScroll from "@layout/NavigationScroll.jsx";

const MainLayout = () => {
  /**
   * Status sidebar (terbuka/tertutup) dari Redux store.
   *
   * @type {boolean}
   */
  const isOpen = useSelector(selectSidebarIsOpen);

  /**
   * Status autentikasi user.
   * Nilai: "unknown" | "authenticated" | "unauthenticated" | "degraded"
   *
   * @type {string}
   */
  const status = useSelector(selectAuthStatus);

  /**
   * Status loading autentikasi.
   *
   * @type {boolean}
   */
  const isLoading = useSelector(selectAuthLoading);

  /**
   * Informasi device (isMobile, isTablet, isDesktop).
   *
   * @type {{ isMobile: boolean }}
   */
  const { isMobile } = useDevice();

  /**
   * Tampilkan loader jika status auth belum diketahui atau sedang loading.
   */
  if (status === "unknown" || status === "degraded" || isLoading) {
    return <MainLayoutLoader isLoading={true} />;
  }

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
      <Customization />
    </NavigationScroll>
  );
};

export default MainLayout;