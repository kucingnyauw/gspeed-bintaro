import { Box, Typography, useTheme } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import INFO from "@data/Info.js";

const Terms = () => {
  const theme = useTheme();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const sections = [
    {
      title: "1. Penerimaan Syarat",
      content: `Dengan mengakses dan menggunakan website ${INFO.name}, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku. Jika Anda tidak menyetujui, mohon untuk tidak menggunakan website ini.`,
    },
    {
      title: "2. Layanan",
      content: `${INFO.name} adalah bengkel spesialis Vespa yang menyediakan informasi mengenai layanan servis, tuning performa, dan sparepart. Website ini bersifat informatif dan sebagai sarana komunikasi dengan pelanggan.`,
    },
    {
      title: "3. Konten Website",
      content: "Seluruh konten dalam website ini, termasuk teks, gambar, logo, dan informasi layanan adalah milik G-Speed dan dilindungi oleh hukum hak cipta. Dilarang memperbanyak, mendistribusikan, atau menggunakan konten tanpa izin tertulis dari kami.",
    },
    {
      title: "4. Informasi Layanan",
      content: "Informasi mengenai layanan, harga, dan estimasi yang tercantum di website ini dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Untuk informasi terkini, silakan hubungi kami langsung.",
    },
    {
      title: "5. Tautan Eksternal",
      content: "Website ini mungkin menyertakan tautan ke website pihak ketiga (seperti Instagram, Google Maps). Kami tidak bertanggung jawab atas konten atau kebijakan privasi dari website pihak ketiga tersebut.",
    },
    {
      title: "6. Batasan Tanggung Jawab",
      content: `${INFO.name} tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan website ini, termasuk kesalahan informasi atau gangguan teknis yang mungkin terjadi.`,
    },
    {
      title: "7. Perubahan Syarat & Ketentuan",
      content: "Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan berlaku efektif sejak dipublikasikan di halaman ini. Pengguna disarankan untuk memeriksa halaman ini secara berkala.",
    },
    {
      title: "8. Kontak",
      content: `Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami di ${INFO.phone} atau melalui email ${INFO.email}.`,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Syarat & Ketentuan | {INFO.name}</title>
        <meta name="description" content={`Syarat dan ketentuan penggunaan website ${INFO.name}`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <Box
        
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: theme.typography.fontWeightBold,
              fontSize: {
                xs: theme.typography.h4.fontSize,
                sm: theme.typography.h3.fontSize,
              },
              mb: theme.spacing(1),
              color: theme.palette.text.primary,
            }}
          >
            Syarat & Ketentuan
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: theme.spacing(4) }}
          >
            Terakhir diperbarui: 30 Mei 2026
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(4),
            }}
          >
            {sections.map((section, index) => (
              <Box key={index}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    mb: theme.spacing(1),
                    color: theme.palette.text.primary,
                  }}
                >
                  {section.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.8,
                    whiteSpace: "pre-line",
                  }}
                >
                  {section.content}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </motion.div>
    </>
  );
};

export default Terms;