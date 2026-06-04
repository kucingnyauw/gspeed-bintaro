/**
 * NavigationScroll - Component yang otomatis scroll ke atas saat navigasi berubah.
 * Bungkus di dalam Router, di luar Routes.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Children yang dibungkus
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NavigationScroll = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return children || null;
};

export default NavigationScroll;