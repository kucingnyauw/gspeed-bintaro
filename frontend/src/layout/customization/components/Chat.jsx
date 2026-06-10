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
 * - Error state untuk pesan gagal
 * - Desain minimalis dengan spacing yang lega
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
import { alpha, keyframes } from "@mui/material/styles";
import { X, Send, Bot, Sparkles } from "lucide-react";
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
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

/**
 * Keyframe animasi jumping dots untuk loading indicator.
 *
 * @type {Object}
 */
const jumpDots = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
`;

/**
 * TypewriterMessage - Menampilkan teks dengan efek ketik karakter per karakter.
 *
 * @param {Object} props
 * @param {string} props.content - Konten teks yang akan dianimasikan
 * @returns {JSX.Element} Komponen typewriter
 */
const TypewriterMessage = ({ content }) => {
  const [displayed, setDisplayed] = useState("");

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
 * MarkdownContent - Render markdown dengan styling minimalis.
 *
 * @param {Object} props
 * @param {string} props.content - Konten markdown
 * @returns {JSX.Element} Konten markdown yang sudah dirender
 */
const MarkdownContent = ({ content }) => {
  const theme = useTheme();

  const markdownStyles = {
    "& p": { m: 0, lineHeight: 1.65, color: "inherit", fontSize: "0.9375rem" },
    "& p:not(:last-child)": { mb: 1.25 },
    "& ul, & ol": { m: 0, pl: 2.5, lineHeight: 1.65, color: "inherit" },
    "& li:not(:last-child)": { mb: 0.25 },
    "& strong": { fontWeight: 600, color: "inherit" },
    "& em": { fontStyle: "italic" },
    "& code": {
      px: 0.75,
      py: 0.25,
      borderRadius: 1,
      fontSize: "0.8125rem",
      fontFamily: "monospace",
      bgcolor: alpha(theme.palette.common.black, 0.06),
      color: "inherit",
    },
    "& pre": {
      m: 0,
      p: 1.5,
      borderRadius: 1.5,
      fontSize: "0.8125rem",
      fontFamily: "monospace",
      bgcolor: alpha(theme.palette.common.black, 0.06),
      overflow: "auto",
    },
    "& blockquote": {
      m: 0,
      pl: 2,
      py: 0.25,
      borderLeft: `2px solid ${alpha(theme.palette.secondary.main, 0.5)}`,
      opacity: 0.85,
      fontStyle: "italic",
    },
    "& hr": { my: 1.5, border: "none", borderTop: `1px solid ${theme.palette.divider}` },
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      m: 0,
      mt: 1.25,
      mb: 0.5,
      fontWeight: 600,
      lineHeight: 1.3,
      color: "inherit",
      "&:first-of-type": { mt: 0 },
    },
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
 * Chat - Dialog chatbot fullscreen di mobile, minimalis di desktop.
 *
 * @param {Object} props
 * @param {boolean} props.open - Status dialog
 * @param {Function} props.onClose - Handler tutup dialog
 * @returns {JSX.Element} Dialog chatbot
 */
const Chat = ({ open, onClose }) => {
  const theme = useTheme();
  const user = useSelector(selectUser);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    initChat,
    isPending,
    scrollRef,
  } = useChat();

  const inputRef = useRef(null);
  const hasInitialized = useRef(false);
  const firstName = user?.fullName?.split(" ")[0] || "Sobat";
  const borderRadius = `${theme.shape.borderRadius}px`;

  useEffect(() => {
    if (open && !hasInitialized.current) {
      initChat();
      hasInitialized.current = true;
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, initChat]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
        bgcolor: { xs: "background.paper", sm: alpha(theme.palette.common.black, 0.35) },
        backdropFilter: { xs: "none", sm: "blur(4px)" },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "100%", sm: 520 },
          maxWidth: { xs: "100%", sm: 520 },
          height: { xs: "100%", sm: 640 },
          maxHeight: { xs: "100%", sm: "90vh" },
          display: "flex",
          flexDirection: "column",
          borderRadius: { xs: 0, sm: borderRadius },
          bgcolor: "background.paper",
          border: { xs: "none", sm: `1px solid ${theme.palette.divider}` },
          boxShadow: { xs: "none", sm: `0 24px 64px ${alpha(theme.palette.common.black, 0.12)}` },
          overflow: "hidden",
          animation: `${fadeInUp} 0.3s ${theme.transitions.easing.easeOut}`,
        }}
      >
        {/* HEADER - Minimalis */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: borderRadius,
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                color: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} strokeWidth={1.5} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: "0.9375rem" }}>
                G-Speed Copilot
              </Typography>
              <Typography variant="caption" color="text.secondary">
                AI Assistant
              </Typography>
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
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        {/* MESSAGES AREA */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2.5, sm: 3 },
            py: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha(theme.palette.divider, 0.5),
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
                gap: 4,
                py: 6,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  color: "secondary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={28} strokeWidth={1.5} />
              </Box>
              <Box sx={{ maxWidth: 300 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: "1.125rem" }}>
                  Hai, {firstName}!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Tanyakan apapun seputar performa, penjualan, stok, atau progress pekerjaan bengkel.
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
                  gap: 1,
                  animation: `${fadeInUp} 0.25s ${theme.transitions.easing.easeOut}`,
                }}
              >
                {isAgent && (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: borderRadius,
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      color: "secondary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mb: 0.25,
                    }}
                  >
                    <Sparkles size={14} strokeWidth={1.5} />
                  </Box>
                )}

                <Box
                  sx={{
                    maxWidth: isAgent ? "80%" : "70%",
                    px: 2,
                    py: 1.5,
                    borderRadius: isAgent
                      ? `${borderRadius} ${borderRadius} ${borderRadius} 4px`
                      : `${borderRadius} ${borderRadius} 4px ${borderRadius}`,
                    bgcolor: isAgent
                      ? alpha(theme.palette.secondary.main, 0.04)
                      : alpha(theme.palette.secondary.main, 0.1),
                    color: "text.primary",
                    border: isAgent
                      ? `1px solid ${alpha(theme.palette.divider, 0.4)}`
                      : "1px solid transparent",
                    ...(msg.isError && {
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      borderColor: alpha(theme.palette.error.main, 0.2),
                      color: "error.main",
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
                gap: 1,
                animation: `${fadeInUp} 0.25s ${theme.transitions.easing.easeOut}`,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: borderRadius,
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  color: "secondary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mb: 0.25,
                }}
              >
                <Sparkles size={14} strokeWidth={1.5} />
              </Box>
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  borderRadius: `${borderRadius} ${borderRadius} ${borderRadius} 4px`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={`dot-${i}`}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: "text.secondary",
                      opacity: 0.4,
                      animation: `${jumpDots} 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                ))}
              </Box>
            </Stack>
          )}

          <Box sx={{ height: 4, flexShrink: 0 }} />
        </Box>

        {/* INPUT AREA - Minimalis */}
        <Stack
          direction="row"
          sx={{
            alignItems: "flex-end",
            gap: 1.5,
            px: { xs: 2.5, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
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
                bgcolor: alpha(theme.palette.secondary.main, 0.03),
                fontSize: "0.9375rem",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: alpha(theme.palette.secondary.main, 0.2) },
                "&.Mui-focused fieldset": {
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  borderWidth: 1,
                },
              },
              "& .MuiOutlinedInput-input": {
                py: 1.25,
                "&::placeholder": {
                  color: "text.disabled",
                  opacity: 0.7,
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
                        width: 36,
                        height: 36,
                        bgcolor: input.trim() ? "secondary.main" : "transparent",
                        color: input.trim() ? "secondary.contrastText" : "text.disabled",
                        borderRadius: borderRadius,
                        transition: (t) =>
                          t.transitions.create(["background-color", "transform", "color"], {
                            duration: t.transitions.duration.shorter,
                          }),
                        "&:hover": {
                          bgcolor: input.trim() ? "secondary.dark" : "action.hover",
                          transform: input.trim() ? "scale(1.05)" : "none",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "transparent",
                          color: "text.disabled",
                        },
                      }}
                    >
                      <Send size={16} strokeWidth={2} />
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