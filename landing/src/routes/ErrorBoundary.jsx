import { Component } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, onReset }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        px: theme.spacing(3),
        py: theme.spacing(8),
        gap: theme.spacing(3),
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: theme.palette.error.light,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: theme.spacing(2),
        }}
      >
        <AlertTriangle size={40} color={theme.palette.error.main} />
      </Box>

      <Typography
        variant="h4"
        sx={{
          fontWeight: theme.typography.fontWeightBold,
          color: theme.palette.text.primary,
        }}
      >
        Oops! Terjadi Kesalahan
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          maxWidth: 500,
          lineHeight: 1.8,
        }}
      >
        Maaf, halaman ini mengalami kendala teknis. Tim kami akan segera memperbaikinya.
        Silakan coba lagi dalam beberapa saat.
      </Typography>

      {error?.message && (
        <Box
          sx={{
            bgcolor: theme.palette.grey[100],
            borderRadius: theme.shape.borderRadius,
            p: theme.spacing(2),
            maxWidth: 600,
            width: "100%",
            wordBreak: "break-word",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.error.main,
              fontFamily: "monospace",
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            {error.message}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: theme.spacing(2), mt: theme.spacing(2), flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshCw size={18} />}
          onClick={onReset}
          sx={{ borderRadius: theme.shape.borderRadius }}
        >
          Coba Lagi
        </Button>
        <Button
          variant="outlined"
          startIcon={<Home size={18} />}
          component={Link}
          to="/"
          sx={{ borderRadius: theme.shape.borderRadius }}
        >
          Kembali ke Beranda
        </Button>
      </Box>
    </Box>
  );
};

const ErrorBoundary = ({ children }) => {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary;