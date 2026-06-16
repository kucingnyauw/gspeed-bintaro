import {
  Box,
  Button,
  Card,
  Stack,
  useTheme,
  alpha,
  Grid,
  Typography,
  Container,
} from "@mui/material";
import { motion } from "framer-motion";
import { keyframes } from "@mui/material";
import StackIcon from "tech-stack-icons";
import hero from "@assets/image/hero.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import screen1 from "@assets/image/screen1.png";
import screen2 from "@assets/image/screen2.png";
import screen3 from "@assets/image/screen3.png";
import screen4 from "@assets/image/screen4.png";
import { useNavigate } from "react-router-dom";

const smoothRunning = keyframes`from { transform: translateX(0); } to { transform: translateX(-50%); }`;

const glowPulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
`;

/** Minimalist SVG icons untuk setiap modul */
const moduleIcons = {
  pos: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  ),
  mechanic: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M14.31 8l5.74 9.94M9.69 8L3.95 17.94M14.31 16H9.69" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  ),
  inventory: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  crm: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  report: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <polyline points="3 20 21 20" />
    </svg>
  ),
  auth: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  shift: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  expense: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  payment: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
};

/**
 * Membuat ilustrasi SVG animasi untuk setiap modul
 * @param {string} color - Warna utama dari theme
 * @returns {JSX.Element[]} Array ilustrasi SVG
 */
const createSvgIllustrations = (color) => [
  <svg key="pos" width="100%" height="100%" viewBox="0 0 300 180" fill="none">
    <motion.rect
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity }}
      x="20"
      y="25"
      width="110"
      height="130"
      rx="6"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.25"
    />
    <motion.rect
      animate={{ y: [45, 50, 45] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      x="28"
      y="45"
      width="94"
      height="6"
      rx="3"
      fill={color}
      opacity="0.15"
    />
    <motion.path
      animate={{ pathLength: [0, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
      d="M50 100 L75 85 L100 95 L130 78"
      stroke={color}
      strokeWidth="2"
      opacity="0.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <motion.circle
      animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
      cx="130"
      cy="78"
      r="4"
      fill={color}
      opacity="0.4"
    />
    <rect
      x="160"
      y="25"
      width="120"
      height="55"
      rx="6"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.15"
    />
    <rect
      x="160"
      y="100"
      width="120"
      height="55"
      rx="6"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.1"
    />
  </svg>,
  <svg
    key="mechanic"
    width="100%"
    height="100%"
    viewBox="0 0 300 180"
    fill="none"
  >
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "150px 90px" }}
    >
      <circle
        cx="150"
        cy="90"
        r="45"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.12"
        strokeDasharray="8 4"
      />
      <motion.circle
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        cx="150"
        cy="90"
        r="25"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.2"
      />
    </motion.g>
    <circle cx="150" cy="90" r="8" fill={color} opacity="0.2" />
    <motion.line
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "150px 90px" }}
      x1="150"
      y1="90"
      x2="150"
      y2="55"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.25"
      strokeLinecap="round"
    />
  </svg>,
  <svg
    key="inventory"
    width="100%"
    height="100%"
    viewBox="0 0 300 180"
    fill="none"
  >
    <motion.rect
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      x="40"
      y="55"
      width="50"
      height="50"
      rx="6"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.18"
    />
    <motion.rect
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
      x="110"
      y="40"
      width="60"
      height="65"
      rx="6"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.22"
    />
    <motion.rect
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
      x="200"
      y="50"
      width="55"
      height="55"
      rx="6"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.14"
    />
    <motion.path
      animate={{ x: [0, 8, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
      d="M90 80 L105 80"
      stroke={color}
      strokeWidth="2"
      opacity="0.3"
      strokeLinecap="round"
    />
    <motion.path
      animate={{ x: [0, 6, 0], opacity: [0.15, 0.35, 0.15] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
      d="M170 75 L195 75"
      stroke={color}
      strokeWidth="2"
      opacity="0.25"
      strokeLinecap="round"
    />
  </svg>,
  <svg key="crm" width="100%" height="100%" viewBox="0 0 300 180" fill="none">
    <motion.circle
      animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      cx="80"
      cy="60"
      r="16"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.2"
    />
    <motion.circle
      animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.35, 0.15] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      cx="180"
      cy="55"
      r="20"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.25"
    />
    <motion.circle
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      cx="130"
      cy="120"
      r="14"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.15"
    />
    <motion.path
      animate={{ pathLength: [0, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      d="M96 60 Q130 30 160 55"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.2"
      strokeDasharray="6 3"
    />
    <motion.path
      animate={{ pathLength: [0, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      d="M116 72 Q130 90 130 106"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.15"
      strokeDasharray="6 3"
    />
    <motion.circle
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      cx="130"
      cy="65"
      r="3"
      fill={color}
      opacity="0.5"
    />
  </svg>,
  <svg
    key="reporting"
    width="100%"
    height="100%"
    viewBox="0 0 300 180"
    fill="none"
  >
    <motion.rect
      initial={{ height: 0, y: 120 }}
      animate={{ height: 40, y: 80 }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      x="40"
      width="30"
      rx="3"
      fill={color}
      opacity="0.12"
    />
    <motion.rect
      initial={{ height: 0, y: 120 }}
      animate={{ height: 65, y: 55 }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        repeatType: "reverse",
        delay: 0.3,
      }}
      x="85"
      width="30"
      rx="3"
      fill={color}
      opacity="0.18"
    />
    <motion.rect
      initial={{ height: 0, y: 120 }}
      animate={{ height: 90, y: 30 }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        repeatType: "reverse",
        delay: 0.6,
      }}
      x="130"
      width="30"
      rx="3"
      fill={color}
      opacity="0.25"
    />
    <motion.rect
      initial={{ height: 0, y: 120 }}
      animate={{ height: 55, y: 65 }}
      transition={{
        duration: 2.1,
        repeat: Infinity,
        repeatType: "reverse",
        delay: 0.2,
      }}
      x="175"
      width="30"
      rx="3"
      fill={color}
      opacity="0.14"
    />
    <motion.rect
      initial={{ height: 0, y: 120 }}
      animate={{ height: 75, y: 45 }}
      transition={{
        duration: 2.3,
        repeat: Infinity,
        repeatType: "reverse",
        delay: 0.5,
      }}
      x="220"
      width="30"
      rx="3"
      fill={color}
      opacity="0.2"
    />
  </svg>,
  <svg key="auth" width="100%" height="100%" viewBox="0 0 300 180" fill="none">
    <motion.path
      animate={{ opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      d="M150 20 L210 48 L210 105 Q210 145 150 175 Q90 145 90 105 L90 48 Z"
      stroke={color}
      strokeWidth="1.5"
    />
    <motion.circle
      animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.45, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
      cx="150"
      cy="95"
      r="16"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.25"
    />
    <motion.path
      animate={{ pathLength: [0, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
      d="M143 95 L149 102 L158 88"
      stroke={color}
      strokeWidth="2"
      opacity="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  <svg key="shift" width="100%" height="100%" viewBox="0 0 300 180" fill="none">
    <motion.circle
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "150px 90px" }}
      cx="150"
      cy="90"
      r="55"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.15"
    />
    <motion.line
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "150px 90px" }}
      x1="150"
      y1="90"
      x2="150"
      y2="50"
      stroke={color}
      strokeWidth="2"
      opacity="0.3"
      strokeLinecap="round"
    />
    <motion.line
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "150px 90px" }}
      x1="150"
      y1="90"
      x2="175"
      y2="90"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.2"
      strokeLinecap="round"
    />
    <circle cx="150" cy="90" r="4" fill={color} opacity="0.3" />
  </svg>,
  <svg
    key="expense"
    width="100%"
    height="100%"
    viewBox="0 0 300 180"
    fill="none"
  >
    <motion.circle
      animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 2, repeat: Infinity }}
      cx="90"
      cy="90"
      r="35"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.2"
    />
    <motion.circle
      animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.25, 0.12] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      cx="210"
      cy="90"
      r="35"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.15"
    />
    <motion.path
      animate={{ x: [0, 5, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
      d="M125 90 L175 90"
      stroke={color}
      strokeWidth="2"
      opacity="0.25"
      strokeLinecap="round"
    />
    <motion.path
      animate={{ pathLength: [0, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      d="M165 82 L175 90 L165 98"
      stroke={color}
      strokeWidth="2"
      opacity="0.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  <svg
    key="payment"
    width="100%"
    height="100%"
    viewBox="0 0 300 180"
    fill="none"
  >
    <motion.rect
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      x="60"
      y="50"
      width="180"
      height="100"
      rx="8"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.2"
    />
    <motion.line
      animate={{ x: [0, 3, 0] }}
      transition={{ duration: 1.8, repeat: Infinity }}
      x1="70"
      y1="80"
      x2="230"
      y2="80"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.15"
    />
    <motion.rect
      animate={{ opacity: [0.1, 0.25, 0.1] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      x="70"
      y="95"
      width="80"
      height="6"
      rx="3"
      fill={color}
      opacity="0.15"
    />
    <motion.circle
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      cx="200"
      cy="125"
      r="10"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.25"
    />
  </svg>,
];

const techStack = [
  { name: "react", label: "React" },
  { name: "materialui", label: "Material UI" },
  { name: "vitejs", label: "Vite" },
  { name: "redux", label: "Redux" },
  { name: "reactquery", label: "React Query" },
  { name: "nodejs", label: "Node.js" },
  { name: "prisma", label: "Prisma" },
  { name: "supabase", label: "Supabase" },
  { name: "figma", label: "Figma" },
  { name: "swagger", label: "Swagger" },
  { name: "stripe", label: "Stripe" },
];

const screenshots = [screen1, screen2, screen3, screen4];

const sectionVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const floatVariants = {
  animate: (d = 0) => ({
    y: [0, -8, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: d },
  }),
};

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease: "easeOut" },
  }),
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (d = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: d, ease: "easeOut" },
  }),
};

const OnboardingContent = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const mainColor = theme.palette.primary.main;
  const svgIllustrations = createSvgIllustrations(mainColor);

  const handleDashboard = () => navigate("/dashboard", { replace: true });
  const handleGuide = () =>
    window.open("https://gspeed.mintlify.app", "_blank");

  const products = [
    {
      icon: moduleIcons.pos,
      label: "Point of Sale",
      title: "Transaksi Kasir",
      desc: "Catat setiap transaksi dengan cepat dan akurat. Dukungan penuh untuk pembayaran tunai maupun QRIS, lengkap dengan manajemen shift kasir dan perhitungan pajak otomatis. Semua tercatat real-time tanpa perlu kertas lagi.",
      tags: ["Cash & QRIS", "Shift", "Pajak Otomatis"],
      svg: svgIllustrations[0],
      size: "large",
    },
    {
      icon: moduleIcons.mechanic,
      label: "Assign & Tracking",
      title: "Manajemen Mekanik",
      desc: "Alokasikan pekerjaan servis ke mekanik yang tersedia secara terstruktur. Pantau progres pengerjaan dari awal hingga selesai, dan biarkan sistem menghitung komisi secara otomatis berdasarkan jenis servis yang dikerjakan.",
      svg: svgIllustrations[1],
      size: "small",
    },
    {
      icon: moduleIcons.inventory,
      label: "Kontrol Stok",
      title: "Inventaris Sparepart",
      desc: "Pantau pergerakan stok sparepart secara otomatis setiap kali ada transaksi atau retur. Dapatkan notifikasi saat stok menipis dan lacak riwayat mutasi barang dengan detail untuk menghindari kehilangan inventaris.",
      svg: svgIllustrations[2],
      size: "small",
    },
    {
      icon: moduleIcons.crm,
      label: "Database Terpusat",
      title: "Pelanggan & Kendaraan",
      desc: "Simpan semua informasi pelanggan dan kendaraan mereka dalam satu tempat yang mudah diakses. Lengkap dengan riwayat servis, preferensi pelanggan, dan pengingat jadwal servis berkala untuk meningkatkan loyalitas.",
      svg: svgIllustrations[3],
      size: "small",
    },
    {
      icon: moduleIcons.report,
      label: "Keuangan & Performa",
      title: "Laporan & Analitik",
      desc: "Dapatkan gambaran lengkap kesehatan bisnis bengkel Anda melalui dashboard analitik. Rekapitulasi pendapatan harian, rekonsiliasi kasir, dan analisis performa mekanik tersaji dalam grafik yang mudah dipahami.",
      svg: svgIllustrations[4],
      size: "small",
    },
    {
      icon: moduleIcons.auth,
      label: "Multi-role System",
      title: "Keamanan & Akses",
      desc: "Batasi akses berdasarkan peran pengguna — Admin, Kasir, atau Mekanik. Setiap tindakan tercatat dalam audit trail yang transparan, dan notifikasi sistem memastikan Anda selalu tahu apa yang terjadi di bengkel.",
      tags: ["RBAC", "Audit Trail", "Notifikasi"],
      svg: svgIllustrations[5],
      size: "small",
    },
    {
      icon: moduleIcons.shift,
      label: "Shift Management",
      title: "Shift & Jam Kerja",
      desc: "Kelola jadwal buka-tutup kasir dengan sistem shift yang fleksibel. Tracking jam kerja otomatis membantu Anda memantau produktivitas tim dan menyusun laporan per shift dengan lebih mudah.",
      svg: svgIllustrations[6],
      size: "small",
    },
    {
      icon: moduleIcons.expense,
      label: "Pengeluaran",
      title: "Manajemen Biaya",
      desc: "Catat setiap pengeluaran operasional bengkel mulai dari pembelian sparepart, listrik, hingga gaji mekanik. Kategorisasi biaya yang rapi memudahkan Anda memonitor budget dan mengidentifikasi area penghematan.",
      svg: svgIllustrations[7],
      size: "small",
    },
    {
      icon: moduleIcons.payment,
      label: "Pembayaran",
      title: "Multi Metode Bayar",
      desc: "Terima pembayaran dari pelanggan melalui berbagai metode — tunai, QRIS, atau transfer bank. Setiap pembayaran tercatat otomatis dan siap direkonsiliasi kapan saja tanpa repot.",
      svg: svgIllustrations[8],
      size: "small",
    },
  ];

  return (
    <>
      {/** ========== HERO ========== */}
      <Box
        id="hero"
        component={motion.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        sx={{
          position: "relative",
          overflow: "hidden",
          pt: { xs: 14, sm: 16, md: 20 },
          pb: { xs: 8, sm: 10, md: 14 },
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "70%",
            height: "140%",
            background: `radial-gradient(ellipse at center, ${alpha(
              mainColor,
              0.05
            )} 0%, transparent 70%)`,
            animation: `${glowPulse} 6s ease-in-out infinite`,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-10%",
            left: "-5%",
            width: "50%",
            height: "80%",
            background: `radial-gradient(ellipse at center, ${alpha(
              mainColor,
              0.03
            )} 0%, transparent 70%)`,
            animation: `${glowPulse} 8s ease-in-out infinite 3s`,
            pointerEvents: "none",
          }}
        />

        <Grid
          container
          spacing={{ xs: 6, sm: 8, md: 10 }}
          sx={{ alignItems: "center", position: "relative", zIndex: 1 }}
        >
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={{ xs: 4, sm: 5, md: 6 }}>
              <motion.div
                variants={fadeInUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 500,
                    fontSize: {
                      xs: "1.75rem",
                      sm: "2.25rem",
                      md: "3rem",
                      lg: "3.5rem",
                    },
                    lineHeight: 1.2,
                    letterSpacing: "-0.03em",
                    color: "text.primary",
                  }}
                >
                  Sistem Operasional{" "}
                  <Box
                    component="span"
                    sx={{
                      background: `linear-gradient(135deg, ${mainColor}, ${alpha(
                        mainColor,
                        0.7
                      )})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Bengkel
                  </Box>{" "}
                  G-Speed
                </Typography>
              </motion.div>
              <motion.div
                variants={fadeInUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0.2}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                    lineHeight: 1.85,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    maxWidth: 540,
                    fontWeight: 400,
                  }}
                >
                  Solusi digital terpadu untuk mengelola seluruh operasional
                  bengkel dalam satu platform. Catat transaksi kasir, alokasikan
                  pekerjaan ke mekanik, pantau stok sparepart, dan rekam riwayat
                  servis — semua dengan akses berbasis peran yang aman.
                </Typography>
              </motion.div>
              <motion.div
                variants={fadeInUpVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0.4}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 2, sm: 3 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleDashboard}
                    sx={{
                      minWidth: { xs: 200, sm: 200 },
                      alignSelf: { xs: "flex-start", sm: "auto" },
                    }}
                  >
                    Masuk ke Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleGuide}
                    sx={{
                      minWidth: { xs: 200, sm: 200 },
                      alignSelf: { xs: "flex-start", sm: "auto" },
                    }}
                  >
                    Panduan Penggunaan
                  </Button>
                </Stack>
              </motion.div>
            </Stack>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 6 }}
            sx={{
              order: { xs: -1, lg: 0 },
              position: "relative",
              px: { xs: 0, sm: 2, md: 4 },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                overflow: "visible",
                pointerEvents: "none",
                zIndex: 3,
                display: { xs: "none", lg: "block" },
              }}
            >
              {[
                {
                  top: "6%",
                  left: "2%",
                  label: "Point of Sale",
                  desc: "Transaksi & Shift",
                  w: 130,
                  delay: 0,
                },
                {
                  bottom: "12%",
                  right: "2%",
                  label: "Mekanik & Servis",
                  desc: "Alokasi & Tracking",
                  w: 140,
                  delay: 1.5,
                },
                {
                  top: "45%",
                  right: "-2%",
                  label: "Inventaris",
                  desc: "Stok & Mutasi",
                  w: 120,
                  delay: 0.8,
                },
              ].map((f, i) => (
                <Box
                  key={i}
                  component={motion.div}
                  variants={floatVariants}
                  animate="animate"
                  custom={f.delay}
                  sx={{
                    position: "absolute",
                    top: f.top,
                    bottom: f.bottom,
                    left: f.left,
                    right: f.right,
                    bgcolor: "background.paper",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    px: 2.5,
                    py: 1.5,
                    maxWidth: f.w,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    pointerEvents: "auto",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                      fontSize: "0.8rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {f.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: "0.7rem",
                      lineHeight: 1.4,
                      fontWeight: 400,
                    }}
                  >
                    {f.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: "-10%",
                  background: `radial-gradient(ellipse at center, ${alpha(
                    mainColor,
                    0.08
                  )} 0%, transparent 70%)`,
                  filter: "blur(20px)",
                  animation: `${glowPulse} 4s ease-in-out infinite`,
                  pointerEvents: "none",
                }}
              />
              <motion.div
                variants={scaleInVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0.3}
                style={{ position: "relative", zIndex: 1 }}
              >
                <Box
                  component="img"
                  src={hero}
                  alt="G-Speed Dashboard"
                  sx={{ width: "100%", height: "auto", display: "block" }}
                />
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/** ========== PRODUCTS ========== */}
      <Box
        id="products"
        component={motion.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        sx={{
          position: "relative",
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "40%",
            background: `radial-gradient(ellipse at bottom, ${alpha(
              mainColor,
              0.03
            )} 0%, transparent 70%)`,
            animation: `${glowPulse} 7s ease-in-out infinite 1s`,
            pointerEvents: "none",
          }}
        />

        <Stack
          spacing={{ xs: 6, sm: 8, md: 10 }}
          sx={{ alignItems: "center", position: "relative", zIndex: 1 }}
        >
          <motion.div
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Stack
              spacing={2}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2.2rem" },
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(135deg, ${
                    theme.palette.text.primary
                  } 40%, ${alpha(theme.palette.text.primary, 0.6)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.4,
                }}
              >
                Satu Platform, Seluruh Operasional
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 560,
                  mx: "auto",
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  lineHeight: 1.85,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 400,
                }}
              >
                Sembilan modul yang saling terintegrasi — gunakan satu per satu
                atau sekaligus. Dirancang khusus untuk bengkel modern yang
                menginginkan efisiensi maksimal, kontrol penuh, dan kemudahan
                pengelolaan operasional sehari-hari.
              </Typography>
            </Stack>
          </motion.div>

          <Grid container spacing={{ xs: 3, sm: 4 }} sx={{ maxWidth: 1100 }}>
            {products.map((product, index) => {
              const isLarge = product.size === "large";
              return (
                <Grid key={index} size={{ xs: 12, lg: isLarge ? 12 : 6 }}>
                  <motion.div
                    variants={fadeInUpVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0.1 + index * 0.05}
                    style={{ height: "100%" }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: { xs: 2.5, md: 4 },
                        p: { xs: 2.5, sm: 3, md: 4 },
                        borderRadius: `${theme.shape.borderRadius}px`,
                        alignItems: { md: "center" },
                      }}
                    >
                      <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{ alignItems: "center" }}
                        >
                          <Box
                            sx={{
                              color: alpha(theme.palette.text.primary, 0.5),
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {product.icon}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 400,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: alpha(theme.palette.text.primary, 0.4),
                              fontSize: "0.7rem",
                            }}
                          >
                            {product.label}
                          </Typography>
                        </Stack>
                        <Typography
                          variant={isLarge ? "h4" : "h6"}
                          sx={{
                            fontWeight: 500,
                            color: "text.primary",
                            lineHeight: 1.35,
                          }}
                        >
                          {product.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            lineHeight: 1.85,
                            color: alpha(theme.palette.text.secondary, 0.65),
                            fontWeight: 400,
                          }}
                        >
                          {product.desc}
                        </Typography>
                        {product.tags && (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            useFlexGap
                            sx={{ flexWrap: "wrap" }}
                          >
                            {product.tags.map((tag) => (
                              <Typography
                                key={tag}
                                variant="caption"
                                sx={{
                                  px: 2,
                                  py: 0.75,
                                  borderRadius: 50,
                                  fontWeight: 400,
                                  fontSize: "0.75rem",
                                  color: alpha(theme.palette.text.primary, 0.5),
                                }}
                              >
                                {tag}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                      <Box
                        sx={{
                          flexShrink: 0,
                          width: { xs: "100%", md: isLarge ? 320 : 240 },
                          height: { xs: 140, md: isLarge ? 200 : 160 },
                          color: mainColor,
                          opacity: 0.3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {product.svg}
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </Box>

      {/** ========== BENEFITS ========== */}
      <Box
        id="benefits"
        component={motion.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        sx={{
          position: "relative",
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${alpha(
              theme.palette.divider,
              0.4
            )}, transparent)`,
          }}
        />

        <Stack
          spacing={{ xs: 6, sm: 8, md: 10 }}
          sx={{ alignItems: "center", position: "relative", zIndex: 1 }}
        >
          <motion.div
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Stack
              spacing={2}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2.2rem" },
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(135deg, ${
                    theme.palette.text.primary
                  } 40%, ${alpha(theme.palette.text.primary, 0.6)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.4,
                }}
              >
                Dibangun untuk Menggantikan Cara Lama
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 560,
                  mx: "auto",
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  lineHeight: 1.85,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 400,
                }}
              >
                Lupakan pencatatan manual di kertas dan spreadsheet yang rentan
                terhadap kesalahan. G-Speed hadir dengan sistem digital yang
                membuat operasional bengkel menjadi lebih transparan, efisien,
                dan bebas dari kerumitan administrasi.
              </Typography>
            </Stack>
          </motion.div>

          <Grid container spacing={3} sx={{ maxWidth: 900 }}>
            {[
              {
                title: "Sinkronisasi Real-time",
                desc: "Data tersinkronisasi secara instan di semua perangkat tanpa perlu menunggu. Setiap transaksi yang dicatat kasir langsung terlihat di dashboard admin, memastikan seluruh tim selalu bekerja dengan informasi terkini tanpa delay.",
              },
              {
                title: "Keamanan Berlapis",
                desc: "Akses diatur berdasarkan peran pengguna — Admin, Kasir, atau Mekanik — sehingga setiap orang hanya melihat dan mengakses fitur yang relevan dengan tugasnya. Ditambah enkripsi end-to-end dan pencatatan audit trail yang mencatat setiap aktivitas.",
              },
              {
                title: "Manajemen Shift Otomatis",
                desc: "Atur jadwal buka-tutup kasir dengan sistem shift yang terstruktur. Tracking jam kerja berjalan otomatis, memudahkan Anda menghitung produktivitas tim dan menyusun laporan per shift tanpa perhitungan manual.",
              },
              {
                title: "Laporan Bisnis Mendalam",
                desc: "Dashboard analitik menampilkan performa bengkel secara visual — dari pendapatan harian, tren penjualan sparepart, hingga performa masing-masing mekanik. Data yang biasanya tersebar kini terpusat dalam satu tampilan.",
              },
              {
                title: "Kolaborasi Multi-pengguna",
                desc: "Admin, kasir, dan mekanik bekerja dalam satu platform yang sama namun dengan tampilan dan akses yang berbeda sesuai kebutuhan. Tidak perlu berganti aplikasi atau saling menunggu informasi — semuanya tersedia real-time.",
              },
              {
                title: "Akses dari Mana Saja",
                desc: "Antarmuka responsif memungkinkan Anda mengakses dashboard dari desktop di kantor, tablet di area bengkel, atau smartphone saat sedang di luar. Pengalaman pengguna tetap optimal di semua ukuran layar.",
              },
            ].map((item, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div
                  variants={fadeInUpVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0.1 + index * 0.08}
                  style={{ height: "100%" }}
                >
                  <Card
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      height: "100%",
                      minHeight: { xs: "auto", md: 240 },
                      borderRadius: `${theme.shape.borderRadius}px`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[2],
                      },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                        lineHeight: 1.3,
                        fontSize: "1rem",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.85,
                        color: alpha(theme.palette.text.secondary, 0.65),
                        fontWeight: 400,
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>

      {/** ========== SCREENSHOTS ========== */}
      <Box
        id="screenshots"
        component={motion.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        sx={{
          position: "relative",
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70%",
            height: "60%",
            background: `radial-gradient(ellipse, ${alpha(
              mainColor,
              0.03
            )} 0%, transparent 70%)`,
            animation: `${glowPulse} 5s ease-in-out infinite 2s`,
            pointerEvents: "none",
          }}
        />
        <Stack
          spacing={{ xs: 6, sm: 8, md: 10 }}
          sx={{ alignItems: "center", textAlign: "center" }}
        >
          <motion.div
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Stack spacing={2}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2rem" },
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(135deg, ${
                    theme.palette.text.primary
                  } 40%, ${alpha(theme.palette.text.primary, 0.6)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.4,
                }}
              >
                Tampilan Antar Muka yang Intuitif
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 520,
                  mx: "auto",
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  lineHeight: 1.75,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 400,
                }}
              >
                Dashboard yang bersih dan mudah dinavigasi. Setiap modul
                dirancang agar tim Anda dapat langsung produktif tanpa pelatihan
                panjang — dari kasir yang melayani pelanggan hingga admin yang
                memantau performa bisnis.
              </Typography>
            </Stack>
          </motion.div>
          <Box sx={{ width: "100%", maxWidth: 1100 }}>
            <Swiper
              modules={[Autoplay]}
              spaceBetween={24}
              slidesPerView={1.2}
              centeredSlides
              loop
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 1.5, spaceBetween: 24 },
                768: { slidesPerView: 2, spaceBetween: 32 },
                1024: { slidesPerView: 2.5, spaceBetween: 40 },
              }}
              style={{ padding: "60px 0" }}
              onSlideChange={(s) => {
                s.slides.forEach((sl) => {
                  sl.style.transition = "all 0.5s ease";
                  sl.style.transform = "scale(0.85)";
                  sl.style.opacity = "0.5";
                  sl.style.filter = "brightness(0.7)";
                });
                const a = s.slides[s.activeIndex];
                if (a) {
                  a.style.transform = "scale(1)";
                  a.style.opacity = "1";
                  a.style.filter = "brightness(1)";
                  a.style.zIndex = "2";
                }
              }}
              onSwiper={(s) => {
                s.slides.forEach((sl) => {
                  sl.style.transition = "all 0.5s ease";
                  sl.style.transform = "scale(0.85)";
                  sl.style.opacity = "0.5";
                  sl.style.filter = "brightness(0.7)";
                });
                const a = s.slides[s.activeIndex];
                if (a) {
                  a.style.transform = "scale(1)";
                  a.style.opacity = "1";
                  a.style.filter = "brightness(1)";
                  a.style.zIndex = "2";
                }
              }}
            >
              {[...screenshots, ...screenshots].map((img, i) => (
                <SwiperSlide key={i}>
                  <Box
                    sx={{
                      borderRadius: `${theme.shape.borderRadius}px`,
                      overflow: "hidden",
                      border: `1px solid ${theme.palette.divider}`,
                      aspectRatio: "4/3",
                    }}
                  >
                    <Box
                      component="img"
                      src={img}
                      alt={`Screen ${i + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Box>
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        </Stack>
      </Box>

      {/** ========== TECH STACK ========== */}
      <Box
        id="tech-stack"
        component={motion.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        sx={{
          position: "relative",
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Stack
          spacing={{ xs: 6, sm: 8, md: 10 }}
          sx={{ alignItems: "center", textAlign: "center" }}
        >
          <motion.div
            variants={fadeInUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Stack spacing={2}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2rem" },
                  letterSpacing: "-0.02em",
                  background: `linear-gradient(135deg, ${
                    theme.palette.text.primary
                  } 40%, ${alpha(theme.palette.text.primary, 0.6)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.4,
                }}
              >
                Ditenagai Teknologi Modern
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 520,
                  mx: "auto",
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  lineHeight: 1.75,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 400,
                }}
              >
                Kami memilih stack teknologi terbaik untuk memastikan performa
                tinggi, keamanan data yang ketat, dan kemudahan pengembangan
                fitur baru secara berkelanjutan sesuai kebutuhan bengkel Anda.
              </Typography>
            </Stack>
          </motion.div>
          <Box
            sx={{
              width: "100%",
              overflow: "hidden",
              position: "relative",
              maskImage:
                "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: { xs: 3, sm: 4, md: 5 },
                width: "max-content",
                animation: `${smoothRunning} 30s linear infinite`,
                willChange: "transform",
              }}
            >
              {[...techStack, ...techStack].map((tech, index) => (
                <Box
                  key={`${tech.name}-${index}`}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    minWidth: { xs: 80, sm: 90, md: 100 },
                    flexShrink: 0,
                    py: 2,
                  }}
                >
                  <StackIcon
                    name={tech.name}
                    style={{
                      width: 36,
                      height: 36,
                      color: theme.palette.text.disabled,
                      filter: "grayscale(1)",
                      opacity: 0.6,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontSize: "0.65rem", fontWeight: 400 }}
                  >
                    {tech.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Stack>
      </Box>

      {/** ========== CTA ========== */}
      <Box
        component={motion.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        sx={{
          position: "relative",
          py: { xs: 8, sm: 10, md: 14 },
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${alpha(
              theme.palette.divider,
              0.5
            )}, transparent)`,
          }}
        />
        <Container
          maxWidth="sm"
          sx={{ textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <Stack spacing={4} sx={{ alignItems: "center" }}>
            <motion.div
              variants={fadeInUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1.3rem", sm: "1.6rem", md: "1.8rem" },
                  letterSpacing: "-0.02em",
                  color: "text.primary",
                  lineHeight: 1.4,
                }}
              >
                Siap mengelola bengkel dengan lebih efisien?
              </Typography>
            </motion.div>
            <motion.div
              variants={fadeInUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0.2}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  lineHeight: 1.75,
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 400,
                }}
              >
                Akses dashboard sekarang dan rasakan kemudahan mengelola
                operasional bengkel dalam satu platform terintegrasi. Tidak
                perlu instalasi — cukup login dan langsung mulai.
              </Typography>
            </motion.div>
            <motion.div
              variants={fadeInUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0.4}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleDashboard}
                  sx={{ minWidth: 200 }}
                >
                  Masuk ke Dashboard
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGuide}
                  sx={{ minWidth: 200 }}
                >
                  Panduan Penggunaan
                </Button>
              </Stack>
            </motion.div>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default OnboardingContent;
