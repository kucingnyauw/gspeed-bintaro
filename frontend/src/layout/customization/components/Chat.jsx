/**
 * Chat - Chatbot dialog dengan typewriter effect, markdown rendering, dan fullscreen mobile.
 *
 * Fitur:
 * - Fullscreen di mobile untuk UX yang lebih baik
 * - Typewriter effect untuk pesan terakhir dari agent
 * - Markdown rendering dengan GitHub Flavored Markdown
 * - Empty state dengan sapaan personal (nama user)
 * - Loading dots animation saat menunggu response
 * - Auto-focus input saat dialog dibuka
 * - Riwayat chat persisten selama sesi (tidak reset saat tutup)
 * - Scroll otomatis ke bawah saat ada pesan baru
 * - Send button dengan animasi hover
 * - Error state untuk pesan gagal (warna merah)
 *
 * @param {Object} props
 * @param {boolean} props.open - Status dialog terbuka/tutup
 * @param {Function} props.onClose - Handler untuk menutup dialog
 */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
  Avatar,
  InputAdornment,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { X, Send, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useChat } from "@layout/customization/hooks";
import { selectUser } from "@store/auth/authSelector.js";

/**
 * Keyframe animasi fade-in dari bawah.
 *
 * @type {Object}
 */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * Keyframe animasi jumping dots untuk loading indicator.
 *
 * @type {Object}
 */
const jumpDots = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
`;

/**
 * TypewriterMessage - Menampilkan teks dengan efek ketik karakter per karakter.
 *
 * @param {Object} props
 * @param {string} props.content - Konten teks yang akan dianimasikan
 * @returns {JSX.Element} Komponen typewriter
 */
const TypewriterMessage = ({ content }) => {
  /**
   * Teks yang sudah ditampilkan sejauh ini.
   *
   * @type {[string, Function]}
   */
  const [displayed, setDisplayed] = useState("");

  /**
   * Effect: Animasi ketik karakter per karakter.
   * Reset jika konten berubah menjadi lebih pendek.
   */
  useEffect(() => {
    if (!content || content.length < displayed.length) {
      setDisplayed("");
      return;
    }

    if (displayed.length < content.length) {
      const timeout = setTimeout(() => {
        setDisplayed(content.slice(0, displayed.length + 1));
      }, 12);
      return () => clearTimeout(timeout);
    }
  }, [content, displayed]);

  return <MarkdownContent content={displayed} />;
};

/**
 * MarkdownContent - Render markdown dengan styling yang menyesuaikan theme.
 *
 * Mendukung:
 * - Paragraph, heading (h1-h6)
 * - List (ordered & unordered)
 * - Bold, italic, strikethrough
 * - Inline code & code blocks
 * - Table
 * - Blockquote
 * - Horizontal rule
 *
 * @param {Object} props
 * @param {string} props.content - Konten markdown
 * @returns {JSX.Element} Konten markdown yang sudah dirender
 */
const MarkdownContent = ({ content }) => {
  const theme = useTheme();

  /**
   * Style untuk elemen-elemen markdown.
   *
   * @type {Object}
   */
  const markdownStyles = {
    "& p": { m: 0, lineHeight: 1.7, color: "inherit" },
    "& p:not(:last-child)": { mb: 1 },
    "& ul, & ol": { m: 0, pl: 2.5, lineHeight: 1.7, color: "inherit" },
    "& li:not(:last-child)": { mb: 0.25 },
    "& strong": { fontWeight: theme.typography.fontWeightBold, color: "inherit" },
    "& em": { fontStyle: "italic" },
    "& del": { textDecoration: "line-through", opacity: 0.7 },
    "& code": {
      px: 0.75,
      py: 0.25,
      borderRadius: 1,
      fontSize: "0.8125rem",
      fontFamily: "monospace",
      bgcolor: "rgba(0,0,0,0.08)",
      color: "inherit",
    },
    "& pre": {
      m: 0,
      p: 1.5,
      borderRadius: 1.5,
      fontSize: "0.8125rem",
      fontFamily: "monospace",
      bgcolor: "rgba(0,0,0,0.08)",
      overflow: "auto",
    },
    "& table": {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: theme.typography.body2.fontSize,
    },
    "& th, & td": {
      px: 1.25,
      py: 0.75,
      textAlign: "left",
      borderBottom: `1px solid rgba(0,0,0,0.1)`,
    },
    "& th": {
      fontWeight: theme.typography.fontWeightMedium,
      fontSize: theme.typography.caption.fontSize,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      opacity: 0.7,
    },
    "& blockquote": {
      m: 0,
      pl: 2,
      py: 0.25,
      borderLeft: `3px solid ${theme.palette.secondary.main}`,
      opacity: 0.8,
      fontStyle: "italic",
    },
    "& hr": { my: 1.5, border: "none", borderTop: `1px solid rgba(0,0,0,0.1)` },
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      m: 0,
      mt: 1.25,
      mb: 0.75,
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: 1.3,
      color: "inherit",
      "&:first-of-type": { mt: 0 },
    },
    "& h3": { fontSize: theme.typography.h6.fontSize },
    "& h4": { fontSize: theme.typography.body1.fontSize },
  };

  return (
    <Box sx={markdownStyles}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
};

/**
 * Chat - Dialog chatbot fullscreen di mobile.
 *
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element} Dialog chatbot
 */
const Chat = ({ open, onClose }) => {
  const theme = useTheme();

  /**
   * Data user dari Redux store.
   *
   * @type {Object}
   */
  const user = useSelector(selectUser);

  /**
   * Hook chat yang menyediakan messages, input, dan handler.
   */
  const {
    messages,
    input,
    setInput,
    sendMessage,
    initChat,
    isPending,
    scrollRef,
  } = useChat();

  /**
   * Ref untuk input field.
   *
   * @type {React.RefObject<HTMLInputElement>}
   */
  const inputRef = useRef(null);

  /**
   * Flag untuk menandai apakah chat sudah pernah diinisialisasi.
   * Hanya panggil initChat() sekali saat pertama kali komponen mount.
   *
   * @type {React.MutableRefObject<boolean>}
   */
  const hasInitialized = useRef(false);

  /**
   * Nama depan user untuk sapaan personal.
   *
   * @type {string}
   */
  const firstName = user?.fullName?.split(" ")[0] || "Sobat";

  /**
   * Effect: Inisialisasi chat saat dialog pertama kali dibuka.
   * Auto-focus input field setelah dialog terbuka.
   */
  useEffect(() => {
    if (open && !hasInitialized.current) {
      initChat();
      hasInitialized.current = true;
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, initChat]);

  /**
   * Handler keyboard: Kirim pesan saat Enter (tanpa Shift).
   *
   * @param {React.KeyboardEvent} e - Event keyboard
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /** @type {string} Nilai border radius dari theme */
  const borderRadius = `${theme.shape.borderRadius}px`;

  return (
    <Box
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chatbot Dialog"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal + 1,
        display: open ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: { xs: "background.paper", sm: "rgba(0,0,0,0.4)" },
        backdropFilter: { xs: "none", sm: "blur(6px)" },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "100%", sm: 460 },
          maxWidth: { xs: "100%", sm: 460 },
          height: { xs: "100%", sm: 620 },
          maxHeight: { xs: "100%", sm: "92vh" },
          display: "flex",
          flexDirection: "column",
          borderRadius: { xs: 0, sm: borderRadius },
          bgcolor: "background.paper",
          border: { xs: "none", sm: `1px solid ${theme.palette.divider}` },
          boxShadow: { xs: "none", sm: `0 16px 48px rgba(0,0,0,0.18)` },
          overflow: "hidden",
          animation: `${fadeInUp} 0.35s ${theme.transitions.easing.easeOut}`,
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.default",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
                borderRadius: "50%",
              }}
            >
              <Bot size={24} strokeWidth={1.5} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                G-Speed Copilot
              </Typography>
              <Stack direction="row" sx={{ gap: 1, alignItems: "center", mt: 0.25 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    boxShadow: `0 0 0 3px rgba(46, 125, 50, 0.2)`,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Online &bull; Siap membantu
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Tutup Chat"
            sx={{
              color: "text.secondary",
              borderRadius: borderRadius,
              "&:hover": { color: "text.primary", bgcolor: "action.hover" },
            }}
          >
            <X size={20} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        {/* MESSAGES AREA */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2, sm: 3 },
            py: 3,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            "&::-webkit-scrollbar": { width: 5 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: 10,
            },
          }}
        >
          {/* EMPTY STATE */}
          {messages.length === 0 && !isPending && (
            <Stack
              sx={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                py: 6,
                textAlign: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  borderRadius: "50%",
                  boxShadow: `0 8px 24px rgba(0,0,0,0.12)`,
                }}
              >
                <Bot size={40} strokeWidth={1.5} />
              </Avatar>
              <Box sx={{ maxWidth: 320 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Hai, {firstName}! 👋
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Aku asisten AI-mu untuk operasional bengkel. Tanyakan apapun
                  seputar performa, penjualan, stok, atau progress pekerjaan.
                </Typography>
              </Box>
            </Stack>
          )}

          {/* MESSAGES */}
          {messages.map((msg, i) => {
            const isAgent = msg.role === "AGENT";
            const isLastAgentMessage = isAgent && i === messages.length - 1 && !isPending;

            return (
              <Stack
                key={`msg-${i}`}
                direction="row"
                sx={{
                  justifyContent: isAgent ? "flex-start" : "flex-end",
                  alignItems: "flex-end",
                  gap: 1.5,
                  animation: `${fadeInUp} 0.25s ${theme.transitions.easing.easeOut}`,
                }}
              >
                {isAgent && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                      flexShrink: 0,
                      borderRadius: "50%",
                      mb: 0.25,
                    }}
                  >
                    <Bot size={16} strokeWidth={1.5} />
                  </Avatar>
                )}

                <Box
                  sx={{
                    maxWidth: isAgent ? "82%" : "72%",
                    px: 2.5,
                    py: 2,
                    borderRadius: isAgent
                      ? `6px 20px 20px 6px`
                      : `20px 6px 6px 20px`,
                    bgcolor: isAgent ? "action.hover" : "secondary.main",
                    color: isAgent ? "text.primary" : "secondary.contrastText",
                    boxShadow: isAgent
                      ? "none"
                      : `0 4px 12px rgba(0,0,0,0.1)`,
                    ...(msg.isError && {
                      bgcolor: "error.main",
                      color: "error.contrastText",
                    }),
                  }}
                >
                  {isAgent ? (
                    isLastAgentMessage ? (
                      <TypewriterMessage content={msg.content} />
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )
                  ) : (
                    <MarkdownContent content={msg.content} />
                  )}
                </Box>
              </Stack>
            );
          })}

          {/* LOADING DOTS */}
          {isPending && (
            <Stack
              direction="row"
              sx={{
                alignItems: "flex-end",
                gap: 1.5,
                animation: `${fadeInUp} 0.25s ${theme.transitions.easing.easeOut}`,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  flexShrink: 0,
                  borderRadius: "50%",
                  mb: 0.25,
                }}
              >
                <Bot size={16} strokeWidth={1.5} />
              </Avatar>
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  borderRadius: `6px 20px 20px 6px`,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={`dot-${i}`}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "secondary.main",
                      opacity: 0.5,
                      animation: `${jumpDots} 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.18}s`,
                    }}
                  />
                ))}
              </Box>
            </Stack>
          )}

          {/* Bottom spacer */}
          <Box sx={{ height: 4, flexShrink: 0 }} />
        </Box>

        {/* INPUT AREA */}
        <Stack
          direction="row"
          sx={{
            alignItems: "flex-end",
            gap: 1.5,
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.default",
            flexShrink: 0,
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            inputRef={inputRef}
            disabled={isPending}
            multiline
            maxRows={4}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: borderRadius,
                bgcolor: "background.paper",
                "& fieldset": { borderColor: "divider" },
                "&:hover fieldset": { borderColor: "secondary.main" },
                "&.Mui-focused fieldset": {
                  borderColor: "secondary.main",
                  borderWidth: 1,
                },
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={sendMessage}
                      disabled={!input.trim() || isPending}
                      edge="end"
                      size="small"
                      aria-label="Kirim pesan"
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        borderRadius: "50%",
                        boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
                        transition: (t) =>
                          t.transitions.create(["background-color", "transform"], {
                            duration: t.transitions.duration.shorter,
                          }),
                        "&:hover": {
                          bgcolor: "secondary.dark",
                          transform: "scale(1.05)",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "action.disabledBackground",
                          color: "action.disabled",
                          boxShadow: "none",
                        },
                      }}
                    >
                      <Send size={18} strokeWidth={2} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default Chat;