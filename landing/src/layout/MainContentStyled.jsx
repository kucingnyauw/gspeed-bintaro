import { styled } from "@mui/material/styles";

const MainContentStyled = styled("main")(({ theme }) => ({
  flexGrow: 1,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
  width: "100%",
  overflowX: "hidden",

  /* ==================== BASE / MOBILE (0 - 600px) ==================== */
  paddingTop: `calc(64px + ${theme.spacing(2.5)} + ${theme.spacing(4)})`,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(4),

  /* ==================== TABLET (600px - 900px) ==================== */
  [theme.breakpoints.up("sm")]: {
    paddingTop: `calc(64px + ${theme.spacing(2.5)} + ${theme.spacing(5)})`,
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    paddingBottom: theme.spacing(5),
  },

  /* ==================== DESKTOP (900px - 1200px) ==================== */
  [theme.breakpoints.up("md")]: {
    paddingTop: `calc(64px + ${theme.spacing(2.5)} + ${theme.spacing(6)})`,
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
    paddingBottom: theme.spacing(6),
  },

  /* ==================== LARGE DESKTOP (1200px - 1536px) ==================== */
  [theme.breakpoints.up("lg")]: {
    paddingTop: `calc(64px + ${theme.spacing(2.5)} + ${theme.spacing(8)})`,
    paddingLeft: `max(${theme.spacing(8)}, calc((100vw - 1400px) / 2))`,
    paddingRight: `max(${theme.spacing(8)}, calc((100vw - 1400px) / 2))`,
    paddingBottom: theme.spacing(8),
    maxWidth: 1400,
    margin: "0 auto",
  },

  /* ==================== ULTRA WIDE (1536px+) ==================== */
  [theme.breakpoints.up("xl")]: {
    paddingTop: `calc(64px + ${theme.spacing(2.5)} + ${theme.spacing(10)})`,
    paddingLeft: `max(${theme.spacing(10)}, calc((100vw - 1400px) / 2))`,
    paddingRight: `max(${theme.spacing(10)}, calc((100vw - 1400px) / 2))`,
    paddingBottom: theme.spacing(10),
  },
}));

export default MainContentStyled;