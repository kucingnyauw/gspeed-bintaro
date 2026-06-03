import { Box, Typography, useTheme } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import INFO from "@data/Info.js";

const Privacy = () => {
  const theme = useTheme();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const sections = [
    {
      title: "1. Informasi yang Kami Kumpulkan",
      content: `Saat Anda menggunakan website ${INFO.name} atau menghubungi kami melalui WhatsApp, kami dapat mengumpulkan informasi berupa:\n• Nama\n• Nomor telepon\n• Informasi kendaraan (tipe Vespa, plat nomor)\n• Data layanan yang diminati`,
    },
    {
      title: "2. Penggunaan Informasi",
      content: "Informasi yang kami kumpulkan digunakan untuk:\n• Merespon pertanyaan dan permintaan layanan Anda\n• Memberikan estimasi biaya dan waktu pengerjaan\n• Komunikasi terkait status servis kendaraan\n• Meningkatkan kualitas layanan kami",
    },
    {
      title: "3. Penyimpanan Data",
      content: "Data pelanggan disimpan dengan aman dan hanya dapat diakses oleh staf yang berwenang. Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda dari akses yang tidak sah.",
    },
    {
      title: "4. Berbagi Data",
      content: `Kami tidak akan menjual, membagikan, atau menyewakan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum yang berlaku.`,
    },
    {
      title: "5. Cookie dan Analytics",
      content: "Website ini dapat menggunakan cookie untuk meningkatkan pengalaman browsing Anda. Kami juga dapat menggunakan layanan analytics pihak ketiga untuk memahami bagaimana pengguna berinteraksi dengan website kami. Data yang dikumpulkan bersifat anonim.",
    },
    {
      title: "6. Tautan ke Website Lain",
      content: "Website kami mungkin menyertakan tautan ke website eksternal (Instagram, WhatsApp, Google Maps). Kami tidak bertanggung jawab atas kebijakan privasi atau konten dari website tersebut. Kami menyarankan Anda membaca kebijakan privasi masing-masing website yang Anda kunjungi.",
    },
    {
      title: "7. Hak Anda",
      content: "Anda berhak untuk:\n• Meminta informasi data pribadi yang kami simpan\n• Meminta koreksi data yang tidak akurat\n• Meminta penghapusan data pribadi Anda\nSilakan hubungi kami untuk menggunakan hak-hak tersebut.",
    },
    {
      title: "8. Perubahan Kebijakan Privasi",
      content: "Kebijakan privasi ini dapat berubah sewaktu-waktu. Perubahan akan diinformasikan melalui halaman ini. Kami menyarankan Anda untuk memeriksa halaman ini secara berkala.",
    },
    {
      title: "9. Kontak",
      content: `Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi kami di ${INFO.phone} atau melalui email ${INFO.email}.`,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Kebijakan Privasi | {INFO.name}</title>
        <meta name="description" content={`Kebijakan privasi ${INFO.name} - Perlindungan data pelanggan`} />
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
            Kebijakan Privasi
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

export default Privacy;