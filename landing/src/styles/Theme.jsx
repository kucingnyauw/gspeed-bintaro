import { createTheme } from "@mui/material/styles";
import Colors from "@styles/Colors.jsx";
import Size from "@styles/Size.jsx";
import Shape from "@styles/Shape.jsx";
import Shadows from "@styles/Shadows.jsx";
import Typographies from "@styles/Typographies.jsx";

/**
 * @module theme
 * @description Tema Neo Brutalism - Bold, high contrast, raw, dan berani.
 * Ciri khas: border hitam tebal (2px solid #0F172A), shadow solid offset,
 * warna bold, tipografi bold/black, tanpa blur/transparency, border-radius 0.
 * Animasi: hover = translate(-2px, -2px), active = translate(2px, 2px).
 *
 * @constant
 * @type {import('@mui/material/styles').Theme}
 */
const theme = createTheme({
  palette: {
    primary: {
      main: Colors.primary,
      dark: Colors.primaryDark,
      light: Colors.primaryLight,
      contrastText: Colors.surface,
    },
    secondary: {
      main: Colors.secondary,
      dark: Colors.secondaryDark,
      contrastText: Colors.surface,
    },
    error: { main: Colors.error },
    success: { main: Colors.success },
    info: { main: Colors.info },
    warning: { main: Colors.warning },
    text: {
      primary: Colors.textPrimary,
      secondary: Colors.textSecondary,
      disabled: Colors.disabled,
    },
    background: {
      default: Colors.background,
      paper: Colors.surface,
    },
    divider: Colors.secondary,
    action: {
      active: Colors.textPrimary,
      hover: Colors.primary,
      selected: Colors.primaryLight,
      disabled: Colors.disabled,
      disabledBackground: Colors.border,
    },
  },

  typography: {
    fontFamily: Typographies.fontFamily,
    htmlFontSize: Typographies.htmlFontSize,
    h1: { ...Typographies.h1, color: Colors.textPrimary },
    h2: { ...Typographies.h2, color: Colors.textPrimary },
    h3: { ...Typographies.h3, color: Colors.textPrimary },
    h4: { ...Typographies.h4, color: Colors.textPrimary },
    h5: { ...Typographies.h5, color: Colors.textPrimary },
    h6: { ...Typographies.h6, color: Colors.textPrimary },
    body1: { ...Typographies.body1, color: Colors.textPrimary },
    body2: { ...Typographies.body2, color: Colors.textSecondary },
    subtitle1: { ...Typographies.subtitle1, color: Colors.textPrimary },
    subtitle2: { ...Typographies.subtitle2, color: Colors.textSecondary },
    caption: { ...Typographies.caption, color: Colors.textSecondary },
    overline: { ...Typographies.overline, color: Colors.textSecondary },
    button: { ...Typographies.button },
  },

  shape: {
    borderRadius: Shape.borderRadiusMedium,
  },

  spacing: (factor) => `${8 * factor}px`,

  shadows: Shadows,

  components: {
    // ==================== CSS BASELINE ====================
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          color: Colors.textPrimary,
          fontFamily: Typographies.fontFamily,
          fontSize: Size.fontMedium,
          lineHeight: 1.6,
          fontWeight: 500,
          backgroundColor: Colors.background,
        },
        a: {
          textDecoration: "none",
          color: "inherit",
        },
        "::selection": {
          background: Colors.primaryLight,
          color: Colors.textPrimary,
        },
        "::-webkit-scrollbar": { width: 10, height: 10 },
        "::-webkit-scrollbar-track": {
          background: Colors.surface,
          borderLeft: `2px solid ${Colors.secondary}`,
        },
        "::-webkit-scrollbar-thumb": {
          background: Colors.primary,
          border: `2px solid ${Colors.secondary}`,
        },
      },
    },

    // ==================== PAPER & SURFACE ====================
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `2px solid ${Colors.secondary}`,
          borderRadius: 0,
          boxShadow: Shadows[3],
        },
        elevation1: { boxShadow: Shadows[1] },
        elevation2: { boxShadow: Shadows[2] },
        elevation3: { boxShadow: Shadows[3] },
        elevation4: { boxShadow: Shadows[4] },
        elevation8: { boxShadow: Shadows[8] },
        elevation12: { boxShadow: Shadows[12] },
        elevation16: { boxShadow: Shadows[16] },
        elevation24: { boxShadow: Shadows[24] },
      },
    },

    // ==================== CARD ====================
    MuiCard: {
      styleOverrides: {
        root: {
          border: `2px solid ${Colors.secondary}`,
          borderRadius: 0,
          boxShadow: Shadows[3],
          backgroundColor: Colors.surface,
          transition: "box-shadow 0.15s ease, transform 0.15s ease",
          "&:hover": {
            boxShadow: Shadows[7],
            transform: "translate(-2px, -2px)",
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: Size.paddingLarge,
          "&:last-child": { paddingBottom: Size.paddingLarge },
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: `${Size.paddingMedium}px ${Size.paddingLarge}px`,
          borderTop: `2px solid ${Colors.secondary}`,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { padding: Size.paddingLarge, paddingBottom: Size.paddingMedium },
        title: { fontWeight: 800, fontSize: "1.25rem", color: Colors.textPrimary },
        subheader: { fontWeight: 600, marginTop: 4, color: Colors.textSecondary },
      },
    },

    // ==================== BUTTONS ====================
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: "uppercase",
          fontWeight: 700,
          letterSpacing: "0.05em",
          padding: "10px 24px",
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[3],
          transition: "all 0.1s ease",
          "&:hover": {
            boxShadow: Shadows[5],
            transform: "translate(-2px, -2px)",
          },
          "&:active": {
            boxShadow: Shadows[1],
            transform: "translate(2px, 2px)",
          },
          "&:focus-visible": {
            outline: `3px solid ${Colors.secondary}`,
            outlineOffset: 2,
          },
          "&.Mui-disabled": {
            border: `2px solid ${Colors.disabled}`,
            boxShadow: "none",
            color: Colors.disabled,
            backgroundColor: Colors.border,
          },
        },
        containedPrimary: {
          backgroundColor: Colors.primary,
          color: Colors.surface,
          "&:hover": {
            backgroundColor: Colors.primaryDark,
            color: Colors.surface,
          },
        },
        outlinedPrimary: {
          backgroundColor: Colors.surface,
          color: Colors.textPrimary,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            color: Colors.textPrimary,
          },
        },
        textPrimary: {
          border: "2px solid transparent",
          boxShadow: "none",
          color: Colors.textPrimary,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            border: `2px solid ${Colors.secondary}`,
            boxShadow: Shadows[3],
            color: Colors.textPrimary,
          },
        },
        containedSecondary: {
          backgroundColor: Colors.secondary,
          color: Colors.surface,
          "&:hover": {
            backgroundColor: Colors.secondaryDark,
            color: Colors.surface,
          },
        },
        outlinedSecondary: {
          backgroundColor: Colors.surface,
          color: Colors.secondary,
          border: `2px solid ${Colors.secondary}`,
          "&:hover": {
            backgroundColor: Colors.secondary,
            color: Colors.surface,
          },
        },
        textSecondary: {
          border: "2px solid transparent",
          boxShadow: "none",
          color: Colors.textSecondary,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            border: `2px solid ${Colors.secondary}`,
            boxShadow: Shadows[3],
            color: Colors.textPrimary,
          },
        },
        containedError: {
          backgroundColor: Colors.error,
          color: Colors.surface,
          "&:hover": {
            backgroundColor: "#DC2626",
            color: Colors.surface,
          },
        },
        containedSuccess: {
          backgroundColor: Colors.success,
          color: Colors.surface,
          "&:hover": {
            backgroundColor: "#059669",
            color: Colors.surface,
          },
        },
        sizeSmall: {
          fontSize: Size.fontSmall,
          padding: "6px 16px",
        },
        sizeMedium: {
          fontSize: Size.fontMedium,
          padding: "10px 24px",
        },
        sizeLarge: {
          fontSize: Size.fontLarge,
          padding: "14px 32px",
        },
      },
    },

    // ==================== BUTTON GROUP ====================
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[3],
          "& .MuiButton-root": {
            border: "none",
            boxShadow: "none",
            "&:not(:last-child)": {
              borderRight: `2px solid ${Colors.secondary}`,
            },
            "&:hover": {
              transform: "none",
              boxShadow: "none",
            },
          },
        },
      },
    },

    // ==================== ICON BUTTON ====================
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: Colors.textPrimary,
          border: `2px solid transparent`,
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            border: `2px solid ${Colors.secondary}`,
            transform: "translate(-1px, -1px)",
            boxShadow: Shadows[2],
          },
          "&:active": {
            transform: "translate(1px, 1px)",
            boxShadow: "none",
          },
          "&.Mui-disabled": {
            border: `2px solid ${Colors.disabled}`,
            color: Colors.disabled,
          },
        },
        sizeSmall: { padding: 4 },
        sizeMedium: { padding: 8 },
        sizeLarge: { padding: 12 },
      },
    },

    // ==================== FAB ====================
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[5],
          transition: "all 0.1s ease",
          "&:hover": {
            boxShadow: Shadows[8],
            transform: "translate(-2px, -2px)",
          },
          "&:active": {
            boxShadow: Shadows[2],
            transform: "translate(2px, 2px)",
          },
        },
        primary: {
          backgroundColor: Colors.primary,
          color: Colors.surface,
          "&:hover": { backgroundColor: Colors.primaryDark },
        },
        secondary: {
          backgroundColor: Colors.secondary,
          color: Colors.surface,
          "&:hover": { backgroundColor: Colors.secondaryDark },
        },
      },
    },

    // ==================== TEXT FIELD ====================
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 0,
            backgroundColor: Colors.surface,
            border: `2px solid ${Colors.secondary}`,
            transition: "all 0.1s ease",
            "& fieldset": {
              border: "none",
            },
            "&:hover": {
              borderColor: Colors.primary,
            },
            "&.Mui-focused": {
              borderColor: Colors.primary,
              boxShadow: Shadows[3],
            },
            "&.Mui-error": {
              borderColor: Colors.error,
            },
            "&.Mui-disabled": {
              borderColor: Colors.disabled,
              backgroundColor: Colors.border,
            },
          },
          "& .MuiInputLabel-root": {
            color: Colors.textSecondary,
            fontWeight: 600,
            "&.Mui-focused": { color: Colors.primary },
            "&.Mui-error": { color: Colors.error },
          },
          "& .MuiFormHelperText-root": {
            fontWeight: 600,
            marginLeft: 0,
            marginRight: 0,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
        input: {
          padding: "12px 16px",
          fontWeight: 600,
          "&::placeholder": {
            color: Colors.disabled,
            fontWeight: 500,
          },
        },
        notchedOutline: {
          border: "none",
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: Colors.background,
          border: `2px solid ${Colors.secondary}`,
          "&:before, &:after": { display: "none" },
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: Colors.primaryLight,
          },
          "&.Mui-focused": {
            backgroundColor: Colors.surface,
            borderColor: Colors.primary,
            boxShadow: Shadows[3],
          },
          "&.Mui-error": {
            borderColor: Colors.error,
          },
          "&.Mui-disabled": {
            borderColor: Colors.disabled,
            backgroundColor: Colors.border,
          },
        },
        input: {
          padding: "12px 16px",
          fontWeight: 600,
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          "&:before": {
            borderBottom: `2px solid ${Colors.secondary}`,
          },
          "&:after": {
            borderBottom: `2px solid ${Colors.primary}`,
          },
          "&:hover:not(.Mui-disabled):before": {
            borderBottom: `2px solid ${Colors.primary}`,
          },
        },
      },
    },

    // ==================== FORM CONTROLS ====================
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: Colors.textSecondary,
          "&.Mui-focused": {
            color: Colors.primary,
          },
          "&.Mui-error": {
            color: Colors.error,
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontWeight: 600,
        },
      },
    },

    // ==================== CHECKBOX ====================
    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: Colors.secondary,
          padding: 8,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
          },
          "&.Mui-checked": {
            color: Colors.primary,
          },
        },
      },
    },

    // ==================== RADIO ====================
    MuiRadio: {
      styleOverrides: {
        root: {
          color: Colors.secondary,
          padding: 8,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
          },
          "&.Mui-checked": {
            color: Colors.primary,
          },
        },
      },
    },

    // ==================== SWITCH ====================
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 48,
          height: 28,
          padding: 0,
        },
        switchBase: {
          padding: 2,
          "&.Mui-checked": {
            transform: "translateX(20px)",
            color: Colors.surface,
            "& + .MuiSwitch-track": {
              backgroundColor: Colors.primary,
              opacity: 1,
              border: `2px solid ${Colors.secondary}`,
            },
          },
        },
        thumb: {
          width: 20,
          height: 20,
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          backgroundColor: Colors.surface,
        },
        track: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          backgroundColor: Colors.border,
          opacity: 1,
        },
      },
    },

    // ==================== SELECT ====================
    MuiSelect: {
      styleOverrides: {
        select: {
          fontWeight: 600,
          padding: "12px 16px",
        },
        icon: {
          color: Colors.secondary,
        },
      },
    },

    // ==================== AUTOCOMPLETE ====================
    MuiAutocomplete: {
      styleOverrides: {
        tag: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          fontWeight: 600,
          backgroundColor: Colors.surface,
        },
      },
    },

    // ==================== APP BAR ====================
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: Colors.surface,
          color: Colors.textPrimary,
          boxShadow: "none",
          border: `2px solid ${Colors.secondary}`,
          borderRadius: 0,
        },
        colorPrimary: {
          backgroundColor: Colors.primary,
          color: Colors.surface,
        },
        colorSecondary: {
          backgroundColor: Colors.secondary,
          color: Colors.surface,
        },
      },
    },

    // ==================== TOOLBAR ====================
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          padding: "0 16px",
        },
      },
    },

    // ==================== DRAWER ====================
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          backgroundColor: Colors.surface,
        },
      },
    },

    // ==================== TABS ====================
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `2px solid ${Colors.secondary}`,
          minHeight: 48,
        },
        indicator: {
          backgroundColor: Colors.primary,
          height: 4,
        },
        flexContainer: {
          gap: 0,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          textTransform: "uppercase",
          color: Colors.textSecondary,
          minHeight: 48,
          padding: "12px 24px",
          borderRadius: 0,
          transition: "all 0.1s ease",
          "&:hover": {
            color: Colors.textPrimary,
            backgroundColor: Colors.primaryLight,
          },
          "&.Mui-selected": {
            color: Colors.primary,
            fontWeight: 800,
          },
        },
      },
    },

    // ==================== BREADCRUMBS ====================
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: {
          color: Colors.secondary,
          fontWeight: 700,
        },
        li: {
          fontWeight: 600,
          fontSize: Size.fontSmall,
          "& a": {
            color: Colors.textSecondary,
            transition: "all 0.1s ease",
            "&:hover": {
              color: Colors.primary,
              textDecoration: "underline",
              textDecorationThickness: 2,
            },
          },
        },
      },
    },

    // ==================== MENU ====================
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[7],
          marginTop: 8,
        },
        list: { padding: "4px" },
      },
    },

    // ==================== MENU ITEM ====================
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 600,
          margin: "2px 4px",
          padding: "8px 12px",
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            transform: "translate(2px, 0)",
          },
          "&.Mui-selected": {
            backgroundColor: Colors.primaryLight,
            color: Colors.primary,
            fontWeight: 700,
            "&:hover": {
              backgroundColor: Colors.primaryLight,
            },
          },
        },
      },
    },

    // ==================== LIST ====================
    MuiList: {
      styleOverrides: {
        root: {
          padding: "4px",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 4,
          paddingBottom: 4,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: "2px 4px",
          padding: "8px 16px",
          fontWeight: 600,
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            transform: "translate(2px, 0)",
          },
          "&.Mui-selected": {
            backgroundColor: Colors.primaryLight,
            color: Colors.primary,
            fontWeight: 700,
            "&:hover": {
              backgroundColor: Colors.primaryLight,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: Colors.textSecondary,
          minWidth: 36,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 600,
        },
        secondary: {
          fontWeight: 500,
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          textTransform: "uppercase",
          borderRadius: 0,
        },
      },
    },

    // ==================== DIVIDER ====================
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: Colors.secondary,
          borderWidth: 2,
        },
      },
    },

    // ==================== TABLE ====================
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[3],
          backgroundColor: Colors.surface,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "collapse",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 800,
            textTransform: "uppercase",
            backgroundColor: Colors.secondary,
            color: Colors.surface,
            borderBottom: `2px solid ${Colors.secondary}`,
            fontSize: Size.fontSmall,
            letterSpacing: "0.05em",
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            "&:nth-of-type(even)": {
              backgroundColor: Colors.background,
            },
            "&:hover": {
              backgroundColor: Colors.primaryLight,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderBottom: `1px solid ${Colors.border}`,
          padding: "12px 16px",
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderTop: `2px solid ${Colors.secondary}`,
        },
      },
    },

    // ==================== AVATAR ====================
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          fontWeight: 700,
          backgroundColor: Colors.primaryLight,
          color: Colors.textPrimary,
        },
      },
    },
    MuiAvatarGroup: {
      styleOverrides: {
        avatar: {
          border: `2px solid ${Colors.secondary}`,
        },
      },
    },

    // ==================== CHIP ====================
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 700,
          fontSize: "0.75rem",
          border: `2px solid ${Colors.secondary}`,
          transition: "all 0.1s ease",
          "&:hover": {
            transform: "translate(-1px, -1px)",
            boxShadow: Shadows[2],
          },
          "&:active": {
            transform: "translate(1px, 1px)",
            boxShadow: "none",
          },
        },
        filled: {
          backgroundColor: Colors.surface,
          color: Colors.textPrimary,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
          },
        },
        outlined: {
          backgroundColor: "transparent",
          border: `2px solid ${Colors.secondary}`,
          color: Colors.textPrimary,
          "&:hover": {
            backgroundColor: Colors.primaryLight,
          },
        },
        colorPrimary: {
          backgroundColor: Colors.primary,
          color: Colors.surface,
          border: `2px solid ${Colors.secondary}`,
          "&:hover": {
            backgroundColor: Colors.primaryDark,
          },
        },
        deleteIcon: {
          color: Colors.secondary,
          margin: "0 4px 0 0",
        },
        sizeSmall: {
          fontSize: "0.7rem",
          height: 24,
        },
        sizeMedium: {
          fontSize: "0.75rem",
          height: 32,
        },
      },
    },

    // ==================== BADGE ====================
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: 0,
          fontWeight: 800,
          fontSize: "0.7rem",
          border: `2px solid ${Colors.secondary}`,
        },
        colorPrimary: {
          backgroundColor: Colors.primary,
          color: Colors.surface,
        },
        colorSecondary: {
          backgroundColor: Colors.secondary,
          color: Colors.surface,
        },
        colorError: {
          backgroundColor: Colors.error,
          color: Colors.surface,
        },
      },
    },

    // ==================== TOOLTIP ====================
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 0,
          backgroundColor: Colors.secondary,
          color: Colors.surface,
          fontWeight: 700,
          fontSize: "0.75rem",
          padding: "8px 12px",
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[3],
        },
        arrow: {
          color: Colors.secondary,
          "&::before": {
            border: `2px solid ${Colors.secondary}`,
          },
        },
      },
    },

    // ==================== DIALOG ====================
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[15],
          padding: Size.paddingSmall,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          fontSize: "1.25rem",
          textTransform: "uppercase",
          padding: `${Size.paddingMedium}px ${Size.paddingMedium}px ${Size.paddingSmall}px`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: `${Size.paddingSmall}px ${Size.paddingMedium}px`,
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: `${Size.paddingSmall}px ${Size.paddingMedium}px ${Size.paddingMedium}px`,
          gap: 8,
        },
      },
    },

    // ==================== BACKDROP ====================
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "none",
        },
      },
    },

    // ==================== ALERT ====================
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 600,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[3],
          padding: "12px 16px",
        },
        standardError: {
          backgroundColor: "#FEF2F2",
          color: Colors.error,
          border: `2px solid ${Colors.error}`,
        },
        standardWarning: {
          backgroundColor: "#FFFBEB",
          color: Colors.warning,
          border: `2px solid ${Colors.warning}`,
        },
        standardInfo: {
          backgroundColor: "#EFF6FF",
          color: Colors.info,
          border: `2px solid ${Colors.info}`,
        },
        standardSuccess: {
          backgroundColor: "#ECFDF5",
          color: Colors.success,
          border: `2px solid ${Colors.success}`,
        },
        filledError: {
          backgroundColor: Colors.error,
          color: Colors.surface,
        },
        filledWarning: {
          backgroundColor: Colors.warning,
          color: Colors.textPrimary,
        },
        filledInfo: {
          backgroundColor: Colors.info,
          color: Colors.surface,
        },
        filledSuccess: {
          backgroundColor: Colors.success,
          color: Colors.surface,
        },
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          textTransform: "uppercase",
        },
      },
    },

    // ==================== SKELETON ====================
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: Colors.border,
        },
      },
    },

    // ==================== PROGRESS ====================
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: 8,
          backgroundColor: Colors.border,
          border: `2px solid ${Colors.secondary}`,
        },
        bar: {
          borderRadius: 0,
          backgroundColor: Colors.primary,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: Colors.primary,
        },
      },
    },

    // ==================== ACCORDION ====================
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          backgroundColor: Colors.surface,
          boxShadow: "none",
          margin: "0 0 8px 0",
          "&:before": { display: "none" },
          transition: "all 0.1s ease",
          "&.Mui-expanded": {
            margin: "0 0 8px 0",
            boxShadow: Shadows[3],
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          minHeight: 48,
          "&.Mui-expanded": {
            minHeight: 48,
            borderBottom: `2px solid ${Colors.secondary}`,
          },
        },
        content: {
          "&.Mui-expanded": {
            margin: "12px 0",
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: "16px",
          fontWeight: 500,
        },
      },
    },

    // ==================== PAGINATION ====================
    MuiPagination: {
      styleOverrides: {
        root: {
          "& .MuiPagination-ul": {
            gap: 4,
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 700,
          border: `2px solid ${Colors.secondary}`,
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: Colors.primaryLight,
            transform: "translate(-1px, -1px)",
            boxShadow: Shadows[2],
          },
          "&.Mui-selected": {
            backgroundColor: Colors.primary,
            color: Colors.surface,
            fontWeight: 800,
            "&:hover": {
              backgroundColor: Colors.primaryDark,
            },
          },
        },
      },
    },

    // ==================== STEPPER ====================
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: "16px 0",
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight: 600,
          "&.Mui-active": {
            fontWeight: 800,
            color: Colors.primary,
          },
          "&.Mui-completed": {
            fontWeight: 700,
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          "&.Mui-active": {
            color: Colors.primary,
          },
          "&.Mui-completed": {
            color: Colors.success,
          },
        },
        text: {
          fontWeight: 800,
        },
      },
    },

    // ==================== RATING ====================
    MuiRating: {
      styleOverrides: {
        root: {
          color: Colors.warning,
        },
        iconEmpty: {
          color: Colors.border,
        },
      },
    },

    // ==================== SLIDER ====================
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 0,
        },
        thumb: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          backgroundColor: Colors.surface,
          boxShadow: Shadows[2],
          "&:hover": {
            boxShadow: Shadows[4],
          },
        },
        track: {
          borderRadius: 0,
          border: "none",
          backgroundColor: Colors.primary,
        },
        rail: {
          borderRadius: 0,
          backgroundColor: Colors.border,
          border: `2px solid ${Colors.secondary}`,
        },
        mark: {
          borderRadius: 0,
          backgroundColor: Colors.secondary,
        },
        markLabel: {
          fontWeight: 600,
          fontSize: Size.fontSmall,
        },
        valueLabel: {
          borderRadius: 0,
          backgroundColor: Colors.secondary,
          color: Colors.surface,
          fontWeight: 700,
        },
      },
    },

    // ==================== SPEED DIAL ====================
    MuiSpeedDial: {
      styleOverrides: {
        actions: {
          gap: 8,
        },
      },
    },
    MuiSpeedDialAction: {
      styleOverrides: {
        fab: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
        },
      },
    },

    // ==================== TOGGLE BUTTON ====================
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 700,
          textTransform: "uppercase",
          border: `2px solid ${Colors.secondary}`,
          color: Colors.textPrimary,
          transition: "all 0.1s ease",
          "&:hover": {
            backgroundColor: Colors.primaryLight,
          },
          "&.Mui-selected": {
            backgroundColor: Colors.primary,
            color: Colors.surface,
            "&:hover": {
              backgroundColor: Colors.primaryDark,
            },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          gap: 0,
        },
      },
    },

    // ==================== SNACKBAR ====================
    MuiSnackbar: {
      styleOverrides: {
        root: {},
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
          boxShadow: Shadows[5],
          fontWeight: 600,
        },
      },
    },

    // ==================== BOTTOM NAVIGATION ====================
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: `2px solid ${Colors.secondary}`,
          backgroundColor: Colors.surface,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: Colors.textSecondary,
          "&.Mui-selected": {
            color: Colors.primary,
            fontWeight: 800,
          },
        },
      },
    },

    // ==================== LINK ====================
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textDecorationColor: Colors.primary,
          textDecorationThickness: 2,
          textUnderlineOffset: 4,
          transition: "all 0.1s ease",
          "&:hover": {
            color: Colors.primary,
            textDecorationColor: Colors.secondary,
          },
        },
      },
    },

    // ==================== IMAGE LIST ====================
    MuiImageList: {
      styleOverrides: {
        root: {
          gap: 8,
        },
      },
    },
    MuiImageListItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${Colors.secondary}`,
        },
        img: {
          borderRadius: 0,
        },
      },
    },
  },
});

export default theme;