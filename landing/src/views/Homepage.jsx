import React, { useState } from "react";
import { Box, Typography, Button, useTheme, Rating, Collapse, IconButton } from "@mui/material";
import { Masonry } from "@mui/lab";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SEO from "@data/seo.js";
import INFO from "@data/Info.js";
import reviewsMock from "@mock/reviewMock.js";
import featuresMock from "@mock/featuresMock.js";
import processMock from "@mock/processMock.js";
import whyUsMock from "@mock/whyUsMock.js";
import faqMock from "@mock/faqMock.js";
import vespa from "@assets/vespa.png";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: "easeOut" },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, ease: "easeOut" },
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, ease: "easeOut" },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const FaqSection = ({ items }) => {
  const theme = useTheme();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2), maxWidth: 800, mx: "auto" }}>
      {items.map((item, index) => {
        const isExpanded = expandedIndex === index;
        
        return (
          <Box
            key={index}
            sx={{
              border: `2px solid ${isExpanded ? theme.palette.primary.main : theme.palette.divider}`,
              bgcolor: isExpanded ? theme.palette.primary.light : theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              transition: `all ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
              cursor: "pointer",
            }}
            onClick={() => handleToggle(index)}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: theme.spacing(3),
                gap: theme.spacing(2),
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  color: theme.palette.text.primary,
                }}
              >
                {item.question}
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
                  transition: `transform ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
                  color: isExpanded ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: theme.typography.fontWeightLight, lineHeight: 1 }}>
                  +
                </Typography>
              </Box>
            </Box>
            <Collapse in={isExpanded}>
              <Box sx={{ px: theme.spacing(3), pb: theme.spacing(3) }}>
                <Box
                  sx={{
                    borderTop: `1px solid ${theme.palette.divider}`,
                    pt: theme.spacing(2),
                  }}
                >
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.8 }}>
                    {item.answer}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

const Homepage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const homeData = SEO.find((page) => page.path === "/");
  const { hero, sections, meta } = homeData;

  const handleWhatsAppBooking = () => {
    const phoneNumber = INFO.phone.replace("+", "");
    const message = encodeURIComponent(
      `Halo ${INFO.name}, saya ingin melakukan reservasi jadwal untuk tuning Vespa. Apakah ada jadwal yang tersedia?`
    );
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  const handleBookingRedirect = () => {
    const phoneNumber = INFO.phone.replace("+", "");
    const message = encodeURIComponent(
      `Halo ${INFO.name},\n\nSaya tertarik untuk meningkatkan performa Vespa saya. Saya ingin melakukan reservasi jadwal tuning. Mohon informasikan jadwal yang tersedia.\n\nTerima kasih.`
    );
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(waUrl, "_blank");
  };

  const handleCekPaketUpgrade = () => {
    navigate("/products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mid = Math.ceil(reviewsMock.length / 2);
  const column1Reviews = reviewsMock.slice(0, mid);
  const column2Reviews = reviewsMock.slice(mid);

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
        }}
      >
        {/* Hero Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: { xs: theme.spacing(4), md: theme.spacing(6) },
          }}
        >
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
            <motion.div {...fadeInLeft}>
              <Box
                sx={{
                  display: "inline-flex",
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.primary.light,
                  px: theme.spacing(2),
                  py: theme.spacing(0.5),
                  mb: theme.spacing(3),
                  boxShadow: theme.shadows[2],
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    color: theme.palette.text.primary,
                    textTransform: "uppercase",
                  }}
                >
                  Spesialis Performa & Tuning Vespa
                </Typography>
              </Box>
            </motion.div>

            <motion.div {...fadeInUp}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  fontSize: { xs: theme.typography.h2.fontSize, sm: theme.typography.h1.fontSize, md: "4rem" },
                  lineHeight: 1.1,
                  mb: theme.spacing(2),
                  color: theme.palette.text.primary,
                  textTransform: "uppercase",
                }}
              >
                BAWA PERFORMA VESPA ANDA KE <br />
                <Box
                  component="span"
                  sx={{
                    color: theme.palette.primary.main,
                    textShadow: `2px 2px 0px ${theme.palette.divider}`,
                  }}
                >
                  LEVEL BERIKUTNYA.
                </Box>
              </Typography>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.15 }}>
              <Typography
                variant="body1"
                sx={{
                  mb: theme.spacing(4),
                  fontSize: { xs: theme.typography.body1.fontSize, sm: theme.typography.h6.fontSize },
                  color: theme.palette.text.secondary,
                  maxWidth: "600px",
                  mx: { xs: "auto", md: 0 },
                }}
              >
                {hero.subtitle}
              </Typography>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: 0.3 }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: theme.spacing(2),
                  flexWrap: "wrap",
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                <Button
                            onClick={handleWhatsAppBooking}
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ borderRadius: theme.shape.borderRadius }}
                >
                  {hero.ctaPrimary.text}
                </Button>
                <Button
                   onClick={handleCekPaketUpgrade}
     
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ borderRadius: theme.shape.borderRadius }}
                >
                  {hero.ctaSecondary.text}
                </Button>
              </Box>
            </motion.div>
          </Box>

          <motion.div
            {...fadeInRight}
            style={{
              flex: 0.7,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: { xs: theme.spacing(4), md: 0 },
              }}
            >
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Box
                  component="img"
                  src={vespa}
                  alt="Gspeed Tuning"
                  sx={{
                    width: { xs: 220, sm: 280, md: 360 },
                    height: 300,
                    objectFit: "contain",
                    border: `3px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.secondary.main,
                    boxShadow: theme.shadows[8],
                    transform: "rotate(2deg)",
                    transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    "&:hover": {
                      transform: "rotate(0deg) translate(-6px, -6px)",
                      boxShadow: theme.shadows[12],
                      bgcolor: theme.palette.primary.light,
                    },
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    top: { xs: -15, sm: -20 },
                    right: { xs: -15, sm: -30 },
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.warning.main,
                    px: theme.spacing(2),
                    py: theme.spacing(1),
                    boxShadow: theme.shadows[4],
                    transform: "rotate(6deg)",
                    zIndex: 2,
                    transition: `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    "&:hover": { transform: "rotate(0deg) scale(1.05)" },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      color: theme.palette.text.primary,
                      textTransform: "uppercase",
                    }}
                  >
                    500+ Vespa Tuned
                  </Typography>
                </Box>

                <Box
                  sx={{
                    position: "absolute",
                    bottom: { xs: 20, sm: 40 },
                    left: { xs: -20, sm: -40 },
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    px: theme.spacing(2),
                    py: theme.spacing(1),
                    boxShadow: theme.shadows[4],
                    transform: "rotate(-4deg)",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(1),
                    transition: `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    "&:hover": { transform: "rotate(0deg) scale(1.05)" },
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", fontWeight: theme.typography.fontWeightBold, lineHeight: 1 }}
                    >
                      TERPERCAYA
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary, fontWeight: theme.typography.fontWeightBold }}
                    >
                      1000+ Klien Puas
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Features Section */}
        <motion.div {...fadeInUp}>
          <Box sx={{ py: { xs: theme.spacing(2), sm: theme.spacing(3) } }}>
            <Box sx={{ textAlign: "center", mb: { xs: theme.spacing(4), sm: theme.spacing(6) } }}>
              <Typography
                variant="h2"
                sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(1), color: theme.palette.text.primary, textTransform: "uppercase" }}
              >
                {sections[0].title}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: "800px", mx: "auto" }}>
                {sections[0].subtitle}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: theme.spacing(3),
              }}
            >
              {featuresMock.map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    p: { xs: theme.spacing(3), sm: theme.spacing(4) },
                    textAlign: "center",
                    boxShadow: theme.shadows[3],
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    "&:hover": {
                      transform: "translate(-4px, -4px)",
                      boxShadow: theme.shadows[7],
                      bgcolor: theme.palette.primary.light,
                    },
                  }}
                >
                  <Box
                    sx={{
                      border: `2px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      width: 48,
                      height: 48,
                      mx: "auto",
                      mb: theme.spacing(2),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: theme.typography.fontWeightBold,
                      fontSize: theme.typography.h6.fontSize,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(1) }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Process Section */}
        <motion.div {...fadeInUp}>
          <Box
            sx={{
              border: `4px solid ${theme.palette.primary.main}`,
              borderRadius: theme.shape.borderRadius,
              p: { xs: theme.spacing(4), sm: theme.spacing(6) },
              bgcolor: theme.palette.text.primary,
              color: theme.palette.background.paper,
              boxShadow: `8px 8px 0px ${theme.palette.primary.main}`,
            }}
          >
            <Box sx={{ textAlign: "center", mb: theme.spacing(6) }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(1), color: "inherit", textTransform: "uppercase" }}
              >
                {sections[1].title}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.background.default, maxWidth: "600px", mx: "auto" }}>
                {sections[1].subtitle}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: theme.spacing(3),
              }}
            >
              {processMock.map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: theme.spacing(2),
                    p: { xs: theme.spacing(3), sm: theme.spacing(4) },
                    height: "100%",
                    border: `2px solid ${theme.palette.background.paper}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.text.primary,
                    transition: `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    "&:hover": {
                      transform: "translate(-4px, -4px)",
                      boxShadow: `6px 6px 0px ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      border: `2px solid ${theme.palette.background.paper}`,
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `4px 4px 0px ${theme.palette.background.paper}`,
                      mb: theme.spacing(1),
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                      {i + 1}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold, color: "inherit", textTransform: "uppercase" }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.background.default, flexGrow: 1 }}>
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Why Us Section */}
        <motion.div {...fadeInUp}>
          <Box sx={{ py: { xs: theme.spacing(2), sm: theme.spacing(3) } }}>
            <Box sx={{ textAlign: "center", mb: { xs: theme.spacing(4), sm: theme.spacing(6) } }}>
              <Box
                sx={{
                  display: "inline-flex",
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.warning.main,
                  px: theme.spacing(2),
                  py: theme.spacing(0.5),
                  mb: theme.spacing(2),
                  boxShadow: theme.shadows[2],
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    color: theme.palette.getContrastText(theme.palette.warning.main),
                    textTransform: "uppercase",
                  }}
                >
                  Kenapa Harus Kami
                </Typography>
              </Box>
              <Typography
                variant="h2"
                sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(1), color: theme.palette.text.primary, textTransform: "uppercase" }}
              >
                Yang Membedakan G-Speed
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: "800px", mx: "auto" }}>
                Bukan sekadar bengkel tuning biasa. Ini alasan kenapa ratusan pemilik Vespa mempercayakan motor kesayangannya pada kami.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: theme.spacing(3),
              }}
            >
              {whyUsMock.map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: theme.palette.background.paper,
                    p: { xs: theme.spacing(3), sm: theme.spacing(4) },
                    boxShadow: theme.shadows[3],
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing(2),
                    position: "relative",
                    transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    "&:hover": {
                      transform: "translate(-4px, -4px)",
                      boxShadow: theme.shadows[7],
                      bgcolor: theme.palette.primary.light,
                    },
                  }}
                >
                  <Box
                    sx={{
                      border: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: theme.shape.borderRadius,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      px: theme.spacing(1.5),
                      py: theme.spacing(0.5),
                      alignSelf: "flex-start",
                      fontWeight: theme.typography.fontWeightBold,
                      fontSize: theme.typography.caption.fontSize,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.highlight}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, flexGrow: 1 }}>
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div {...fadeInUp}>
          <Box sx={{ py: { xs: theme.spacing(2), sm: theme.spacing(3) } }}>
            <Box sx={{ textAlign: "center", mb: { xs: theme.spacing(4), sm: theme.spacing(6) } }}>
              <Typography
                variant="h2"
                sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(1), color: theme.palette.text.primary, textTransform: "uppercase" }}
              >
                {sections[3].title}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: "800px", mx: "auto" }}>
                {sections[3].subtitle}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: theme.spacing(4),
              }}
            >
              <Masonry columns={{ xs: 1, sm: 1 }} spacing={4}>
                {column1Reviews.map((item, i) => (
                  <motion.div key={i} {...fadeInUp}>
                    <Box
                      sx={{
                        border: `2px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                        bgcolor: theme.palette.background.paper,
                        p: theme.spacing(4),
                        boxShadow: theme.shadows[3],
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing(2),
                        position: "relative",
                        transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                        "&:hover": {
                          transform: "translate(-4px, -4px)",
                          boxShadow: theme.shadows[7],
                          bgcolor: theme.palette.primary.light,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          left: 24,
                          border: `2px solid ${theme.palette.divider}`,
                          borderRadius: theme.shape.borderRadius,
                          bgcolor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: theme.shadows[2],
                        }}
                      >
                        <Typography variant="h5" sx={{color : theme.palette.text.secondary, fontWeight: theme.typography.fontWeightBold, lineHeight: 1, mt: 1 }}>
                          "
                        </Typography>
                      </Box>

                      <Rating value={item.rating} readOnly precision={0.5} sx={{ mt: theme.spacing(2) }} />

                      <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: theme.typography.fontWeightBold }}>
                        "{item.review}"
                      </Typography>

                      <Box sx={{ mt: theme.spacing(2), pt: theme.spacing(2), borderTop: `2px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold, textTransform: "uppercase" }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: theme.typography.fontWeightBold }}>
                          {item.car}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Masonry>

              <Masonry columns={{ xs: 1, sm: 1 }} spacing={4}>
                {column2Reviews.map((item, i) => (
                  <motion.div key={i} {...fadeInUp}>
                    <Box
                      sx={{
                        border: `2px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                        bgcolor: theme.palette.background.paper,
                        p: theme.spacing(4),
                        boxShadow: theme.shadows[3],
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing(2),
                        position: "relative",
                        transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                        "&:hover": {
                          transform: "translate(-4px, -4px)",
                          boxShadow: theme.shadows[7],
                          bgcolor: theme.palette.primary.light,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          left: 24,
                          border: `2px solid ${theme.palette.divider}`,
                          borderRadius: theme.shape.borderRadius,
                          bgcolor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: theme.shadows[2],
                        }}
                      >
                        <Typography variant="h5" sx={{ color : theme.palette.text.secondary, fontWeight: theme.typography.fontWeightBold, lineHeight: 1, mt: 1 }}>
                          "
                        </Typography>
                      </Box>

                      <Rating value={item.rating} readOnly precision={0.5} sx={{ mt: theme.spacing(2) }} />

                      <Typography variant="body1" sx={{ flexGrow: 1, fontWeight: theme.typography.fontWeightBold }}>
                        "{item.review}"
                      </Typography>

                      <Box sx={{ mt: theme.spacing(2), pt: theme.spacing(2), borderTop: `2px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" sx={{ fontWeight: theme.typography.fontWeightBold, textTransform: "uppercase" }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: theme.typography.fontWeightBold }}>
                          {item.car}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Masonry>
            </Box>
          </Box>
        </motion.div>

        {/* FAQ Section */}
        <motion.div {...fadeInUp}>
          <Box sx={{ py: { xs: theme.spacing(2), sm: theme.spacing(3) } }}>
            <Box sx={{ textAlign: "center", mb: { xs: theme.spacing(4), sm: theme.spacing(6) } }}>
              <Box
                sx={{
                  display: "inline-flex",
                  border: `2px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.secondary.main,
                  px: theme.spacing(2),
                  py: theme.spacing(0.5),
                  mb: theme.spacing(2),
                  boxShadow: theme.shadows[2],
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    color: theme.palette.secondary.contrastText,
                    textTransform: "uppercase",
                  }}
                >
                  FAQ
                </Typography>
              </Box>
              <Typography
                variant="h2"
                sx={{ fontWeight: theme.typography.fontWeightBold, mb: theme.spacing(1), color: theme.palette.text.primary, textTransform: "uppercase" }}
              >
                Pertanyaan yang Sering Diajukan
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: "800px", mx: "auto" }}>
                Masih ragu? Cek dulu jawaban dari pertanyaan yang paling sering kami terima.
              </Typography>
            </Box>

            <FaqSection items={faqMock} />
          </Box>
        </motion.div>

        {/* CTA Section */}
        <motion.div {...scaleIn}>
          <Box
            sx={{
              border: `2px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              p: { xs: theme.spacing(5), sm: theme.spacing(6) },
              textAlign: "center",
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              position: "relative",
              overflow: "hidden",
              boxShadow: theme.shadows[5],
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: { xs: -20, sm: 20 },
                bottom: -20,
                border: `4px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                bgcolor: theme.palette.warning.main,
                width: 100,
                height: 100,
                transform: "rotate(15deg)",
                opacity: 0.8,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                left: { xs: -20, sm: 40 },
                top: -20,
                border: `4px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                bgcolor: theme.palette.secondary.main,
                width: 80,
                height: 80,
                transform: "rotate(-10deg)",
                opacity: 0.8,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: theme.typography.fontWeightBold,
                mb: theme.spacing(3),
                position: "relative",
                zIndex: 1,
                textShadow: `2px 2px 0px ${theme.palette.divider}`,
              }}
            >
              SIAP TINGKATKAN TENAGA VESPA ANDA?
            </Typography>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <Button
                onClick={handleBookingRedirect}
                variant="contained"
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  "&:hover": {
                    bgcolor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                  },
                }}
                size="large"
              >
                RESERVASI JADWAL SEKARANG
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Box>
    </>
  );
};

export default Homepage;