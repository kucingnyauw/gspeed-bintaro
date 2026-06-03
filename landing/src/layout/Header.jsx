import { AppBar, Toolbar, useTheme, Box } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import MenuItems from "@menu/menuItems.js";

const Header = () => {
  const theme = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: { xs: theme.spacing(1.5), sm: theme.spacing(2.5) },
        left: "50%",
        transform: "translateX(-50%)",
        width: "fit-content",
        maxWidth: { xs: `calc(100% - ${theme.spacing(2)})`, sm: `calc(100% - ${theme.spacing(4)})`, md: "fit-content" },
        borderRadius: theme.shape.borderRadius * 6,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        boxShadow: theme.shadows[4],
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          justifyContent: "center",
          minHeight: { xs: 48, sm: 56, md: 64 },
          height: { xs: 48, sm: 56, md: 64 },
          px: { xs: theme.spacing(0.5), sm: theme.spacing(1), md: theme.spacing(3) },
          gap: { xs: 0, sm: theme.spacing(0.25), md: theme.spacing(0.5) },
          overflowX: "auto",
          flexWrap: "nowrap",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {MenuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Box
              key={item.name}
              component={RouterLink}
              to={item.path}
              sx={{
                color: active
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                backgroundColor: active
                  ? theme.palette.primary.light
                  : "transparent",
                fontWeight: active
                  ? theme.typography.fontWeightBold
                  : theme.typography.fontWeightRegular,
                px: { xs: theme.spacing(1), sm: theme.spacing(1.5), md: theme.spacing(2) },
                py: { xs: theme.spacing(0.75), sm: theme.spacing(1) },
                whiteSpace: "nowrap",
                flexShrink: 0,
                minWidth: "auto",
                fontSize: { xs: "0.75rem", sm: theme.typography.body2.fontSize, md: theme.typography.body1.fontSize },
                textDecoration: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                borderRadius: theme.shape.borderRadius * 6,
                transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                "&:hover": {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary.light,
                },
              }}
            >
              {item.name}
            </Box>
          );
        })}
      </Toolbar>
    </AppBar>
  );
};

export default Header;