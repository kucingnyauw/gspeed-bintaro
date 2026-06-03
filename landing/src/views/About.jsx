import React from "react";
import { Box, Typography, Button, useTheme, Avatar, Chip } from "@mui/material";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import valuesMock from "@mock/valuesMock.js";
import teamMock from "@mock/teamMock.js";
import SEO from "@data/seo.js";
import INFO from "@data/Info.js";

const About = () => {
  const theme = useTheme();
  const aboutData = SEO.find((page) => page.path === "/about");
  const { hero, sections, meta } = aboutData;

  const teamMembers = teamMock;
  const values = valuesMock;

  const handleWhatsAppContact = () => {
    const phoneNumber = INFO.phone.replace("+", "");
    const message = encodeURIComponent(
      `Halo ${INFO.name}, saya tertarik dengan profil bengkel G-Speed. Apakah saya bisa konsultasi tentang Vespa saya?`
    );
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  const handleOpenMaps = () => {
    window.open(INFO.googleMapsUrl, "_blank");
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="robots" content={meta.robots} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:type" content={meta.ogType} />
      </Helmet>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: theme.spacing(6), sm: theme.spacing(8), md: theme.spacing(10) },
          overflow: "hidden",
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: { xs: theme.spacing(4), md: theme.spacing(6) },
              py: { xs: theme.spacing(2), sm: theme.spacing(4) },
            }}
          >
            <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" }, minWidth: 0 }}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Chip
                  label="Tentang Kami"
                  size="small"
                  sx={{
                    mb: theme.spacing(2),
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.text.primary,
                    fontWeight: theme.typography.fontWeightBold,
                    borderRadius: theme.shape.borderRadius,
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    fontSize: { xs: theme.typography.h3.fontSize, sm: theme.typography.h2.fontSize, md: theme.typography.h1.fontSize },
                    lineHeight: 1.2,
                    mb: theme.spacing(3),
                    color: theme.palette.text.primary,
                  }}
                >
                  {hero.title}
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: theme.typography.body1.fontSize, sm: theme.typography.h6.fontSize },
                    color: theme.palette.text.secondary,
                    lineHeight: 1.6,
                  }}
                >
                  {hero.subtitle}
                </Typography>
              </motion.div>
            </Box>

            <Box
              sx={{
                flex: 0.6,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", delay: 0.3 }}
                whileHover={{ scale: 1.02, rotate: 2 }}
              >
                <Box
                  sx={{
                    width: { xs: 180, sm: 240, md: 300 },
                    height: { xs: 180, sm: 240, md: 300 },
                    borderRadius: "50%",
                    bgcolor: theme.palette.background.paper,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: theme.shadows[8],
                    border: `4px solid ${theme.palette.divider}`,
                    overflow: "hidden",
                    p: theme.spacing(4),
                  }}
                >
                  <Box
                    component="img"
                    src={INFO.logoUrl}
                    alt={INFO.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: theme.spacing(4), md: theme.spacing(6) },
              py: { xs: theme.spacing(2), sm: theme.spacing(3) },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  fontSize: { xs: theme.typography.h4.fontSize, sm: theme.typography.h3.fontSize, md: theme.typography.h2.fontSize },
                  mb: theme.spacing(2),
                  color: theme.palette.text.primary,
                }}
              >
                {sections[0].title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                }}
              >
                {sections[0].content}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  sx={{
                    p: theme.spacing(4),
                    bgcolor: theme.palette.primary.light,
                    borderRadius: theme.shape.borderRadius,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontStyle: "italic",
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    "Dari garasi kecil hingga menjadi rujukan Vespisti se-Tangerang, 
                    perjalanan G-Speed adalah bukti bahwa passion dan kerja keras 
                    bisa mengubah hobi menjadi profesi yang membanggakan."
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <Box
            sx={{
              bgcolor: theme.palette.primary.light,
              borderRadius: theme.shape.borderRadius,
              p: { xs: theme.spacing(3), sm: theme.spacing(5) },
            }}
          >
            <Box sx={{ textAlign: "center", mb: { xs: theme.spacing(4), sm: theme.spacing(5) } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  fontSize: { xs: theme.typography.h4.fontSize, sm: theme.typography.h3.fontSize, md: theme.typography.h2.fontSize },
                  mb: theme.spacing(1),
                  color: theme.palette.text.primary,
                }}
              >
                {sections[1].title}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: theme.palette.text.secondary, maxWidth: "600px", mx: "auto" }}
              >
                {sections[1].subtitle}
              </Typography>
            </Box>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: theme.spacing(4),
                }}
              >
                {teamMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    variants={fadeInUp}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        bgcolor: theme.palette.background.paper,
                        p: theme.spacing(4),
                        textAlign: "center",
                        borderRadius: theme.shape.borderRadius,
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar
                          sx={{
                            width: 100,
                            height: 100,
                            mx: "auto",
                            mb: theme.spacing(2),
                            bgcolor: theme.palette.primary.main,
                            fontSize: theme.typography.h4.fontSize,
                            fontWeight: theme.typography.fontWeightBold,
                          }}
                        >
                          {member.avatarFallback}
                        </Avatar>
                      </motion.div>
                      <Typography variant="h5" sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(0.5) }}>
                        {member.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: theme.typography.fontWeightBold, display: "block", mb: theme.spacing(1.5) }}>
                        {member.role}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {member.bio}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          </Box>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: theme.spacing(4), md: theme.spacing(6) },
            }}
          >
            <Box
              sx={{
                flex: 0.8,
                p: { xs: theme.spacing(3), sm: theme.spacing(4) },
                bgcolor: theme.palette.primary.light,
                borderRadius: theme.shape.borderRadius,
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  fontSize: { xs: theme.typography.h4.fontSize, sm: theme.typography.h3.fontSize, md: theme.typography.h2.fontSize },
                  mb: theme.spacing(2),
                  color: theme.palette.text.primary,
                }}
              >
                {sections[2].title}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                Prinsip yang kami pegang teguh dalam melayani setiap pelanggan.
              </Typography>
            </Box>

            <Box sx={{ flex: 1.2, display: "flex", flexDirection: "column", gap: theme.spacing(3), minWidth: 0 }}>
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ x: 8 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: theme.spacing(2),
                      alignItems: "flex-start",
                      p: theme.spacing(2),
                      borderRadius: theme.shape.borderRadius,
                      transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                      "&:hover": {
                        bgcolor: theme.palette.primary.light,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: theme.shape.borderRadius,
                        bgcolor: theme.palette.primary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: theme.palette.primary.contrastText, fontWeight: theme.typography.fontWeightBold }}>
                        {i + 1}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(0.5) }}>
                        {value.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {value.description}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Maps Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: theme.spacing(4), md: theme.spacing(6) },
              bgcolor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              overflow: "hidden",
              boxShadow: theme.shadows[3],
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ flex: 1, p: { xs: theme.spacing(3), sm: theme.spacing(4) }, minWidth: 0 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  fontSize: { xs: theme.typography.h4.fontSize, sm: theme.typography.h3.fontSize, md: theme.typography.h2.fontSize },
                  mb: theme.spacing(2),
                  color: theme.palette.text.primary,
                }}
              >
                Lokasi Bengkel Kami
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: theme.spacing(2),
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}
              >
                {INFO.address}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: theme.spacing(3),
                }}
              >
                Jam Operasional: {INFO.businessHours.workingDays} | {INFO.businessHours.open} - {INFO.businessHours.close}
              </Typography>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ display: "inline-block" }}
              >
                <Button
                  onClick={handleOpenMaps}
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: theme.shape.borderRadius }}
                >
                  Buka di Google Maps
                </Button>
              </motion.div>
            </Box>

            <Box sx={{ flex: 1, minHeight: { xs: 250, sm: 300, md: 350 }, maxWidth: "100%" }}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ height: "100%", width: "100%" }}
              >
                <iframe
                  src={INFO.googleMapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "250px", maxWidth: "100%" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps - Lokasi G-Speed"
                />
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* Contact Info Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: theme.spacing(3),
            }}
          >
            {[
              { label: "Telepon", value: INFO.phone },
              { label: "Email", value: INFO.email },
              { label: "Jam Kerja", value: `${INFO.businessHours.workingDays}\n${INFO.businessHours.open} - ${INFO.businessHours.close}` },
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  p: theme.spacing(3),
                  textAlign: "center",
                  bgcolor: theme.palette.primary.light,
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(0.5) }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, whiteSpace: "pre-line" }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <Box
            sx={{
              border: `2px solid ${theme.palette.primary.main}`,
              borderRadius: theme.shape.borderRadius,
              p: { xs: theme.spacing(4), sm: theme.spacing(6) },
              textAlign: "center",
              bgcolor: theme.palette.background.paper,
              position: "relative",
              overflow: "hidden",
              boxShadow: theme.shadows[3],
            }}
          >
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    fontSize: { xs: theme.typography.h5.fontSize, sm: theme.typography.h4.fontSize, md: theme.typography.h3.fontSize },
                    mb: theme.spacing(2),
                    color: theme.palette.text.primary,
                  }}
                >
                  Siap Membawa Vespa Anda ke Level Berikutnya?
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    mb: theme.spacing(3),
                    color: theme.palette.text.secondary,
                    maxWidth: 500,
                    mx: "auto",
                  }}
                >
                  Konsultasikan Vespa Anda dengan tim mekanik profesional kami.
                </Typography>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: "inline-block" }}
              >
                <Button
                  onClick={handleWhatsAppContact}
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ borderRadius: theme.shape.borderRadius }}
                >
                  Hubungi Tim Kami
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </>
  );
};

export default About;