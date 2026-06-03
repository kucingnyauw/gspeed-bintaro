// src/main.jsx

/**
 * React
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/**
 * React Query
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * SEO
 */
import { HelmetProvider } from "react-helmet-async";

/**
 * Application
 */
import App from "./App.jsx";

/**
 * Fonts
 */
import "@fontsource/lexend";
import "@fontsource/public-sans";
import "@fontsource/inter";

/**
 * ============================================================
 * Configure React Query Client
 * ============================================================
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * ============================================================
 * Resolve Root Element
 * ============================================================
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element dengan id 'root' tidak ditemukan.");
}

/**
 * ============================================================
 * Render Application
 * ============================================================
 */
createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);