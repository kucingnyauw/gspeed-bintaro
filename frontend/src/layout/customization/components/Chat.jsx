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
  Collapse,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { X, Send, Bot, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useChat } from "@layout/customization/hooks";
import { selectUser } from "@store/auth/authSelector.js";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const jumpDots = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
`;

/**
 * @param {Object} props
 * @param {string} props.content
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
 * @param {Object} props
 * @param {string} props.content
 */
const MarkdownContent = ({ content }) => {
  const theme = useTheme();

  const markdownStyles = {
    "& p": {
      m: 0,
      lineHeight: 1.7,
      color: "inherit",
    },
    "& p:not(:last-child)": {
      mb: 1,
    },
    "& ul, & ol": {
      m: 0,
      pl: 2.5,
      lineHeight: 1.7,
      color: "inherit",
    },
    "& li:not(:last-child)": {
      mb: 0.25,
    },
    "& strong": {
      fontWeight: theme.typography.fontWeightBold,
      color: "inherit",
    },
    "& em": {
      fontStyle: "italic",
    },
    "& del": {
      textDecoration: "line-through",
      opacity: 0.7,
    },
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
    "& hr": {
      my: 1.5,
      border: "none",
      borderTop: `1px solid rgba(0,0,0,0.1)`,
    },
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      m: 0,
      mt: 1.25,
      mb: 0.75,
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: 1.3,
      color: "inherit",
      "&:first-of-type": {
        mt: 0,
      },
    },
    "& h3": {
      fontSize: theme.typography.h6.fontSize,
    },
    "& h4": {
      fontSize: theme.typography.body1.fontSize,
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
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
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

  const firstName = user?.fullName?.split(" ")[0] || "Sobat";

  const [selectedItem, setSelectedItem] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const suggestionsMap = {
    ADMIN: [
      { label: "Bagaimana kabar bengkel hari ini?", icon: "🏍️" },
      { label: "Siapa mekanik dengan performa terbaik?", icon: "⭐" },
      { label: "Sparepart apa yang paling laris?", icon: "🔥" },
      { label: "Bagaimana target revenue bulan ini?", icon: "🎯" },
    ],
    CASHIER: [
      { label: "Bagaimana penjualan saya hari ini?", icon: "💰" },
      { label: "Shift saya sedang apa?", icon: "🔄" },
    ],
    MECHANIC: [
      { label: "Job apa yang sedang saya kerjakan?", icon: "🔧" },
      { label: "Bagaimana performa saya?", icon: "📊" },
    ],
  };

  const availableSuggestions = suggestionsMap[user?.role] || [];

  useEffect(() => {
    if (open) {
      initChat();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, initChat]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * @param {Object} suggestion
   */
  const handleSelectSuggestion = (suggestion) => {
    setSelectedItem(suggestion);
    setInput(suggestion.label);
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClearItem = () => {
    setSelectedItem(null);
    setInput("");
    setShowSuggestions(true);
    inputRef.current?.focus();
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
        alignItems: { xs: "flex-end", sm: "flex-end" },
        justifyContent: { xs: "center", sm: "flex-end" },
        p: { xs: theme.spacing(2), sm: theme.spacing(3) },
        bgcolor: "rgba(0,0,0,0.4)",
        backdropFilter: `blur(6px)`,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "100%", sm: 420 },
          maxWidth: 420,
          height: { xs: "90vh", sm: 580 },
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: `${theme.shape.borderRadius}px`,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[4],
          overflow: "hidden",
          animation: `${fadeInUp} ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: theme.spacing(3),
            py: theme.spacing(3),
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.default,
            flexShrink: 0,
          }}
        >
          <Stack
            direction="row"
            sx={{ gap: theme.spacing(2), alignItems: "center" }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                borderRadius: "50%",
                border: "none",
              }}
            >
              <Bot size={22} strokeWidth={1.5} />
            </Avatar>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: theme.typography.fontWeightBold,
                  lineHeight: 1.4,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                }}
              >
                G-Speed Copilot
              </Typography>
              <Stack
                direction="row"
                sx={{ gap: theme.spacing(1), alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: theme.palette.success.main,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.fontWeightRegular,
                    lineHeight: 1,
                  }}
                >
                  Online
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Tutup Chat"
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                color: theme.palette.text.primary,
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            px: theme.spacing(3),
            py: theme.spacing(3),
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2.5),
          }}
        >
          {messages.length === 0 && !isPending && (
            <Stack
              sx={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing(3),
                py: theme.spacing(8),
              }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  borderRadius: "50%",
                  border: "none",
                }}
              >
                <Bot size={36} strokeWidth={1.5} />
              </Avatar>
              <MarkdownContent
                content={`Halo **${firstName}**! 👋\n\nSelamat datang di **G-Speed Copilot**, asisten AI yang siap membantu operasional bengkel.\n\nKamu bisa tanya seputar performa bengkel, penjualan, stok barang, atau progress pekerjaan.\n\nYuk, mulai dengan pilih saran di bawah atau ketik langsung pertanyaanmu! 🚀`}
              />
            </Stack>
          )}

          {messages.map((msg, i) => {
            const isAgent = msg.role === "AGENT";
            const isLastAgentMessage =
              isAgent && i === messages.length - 1 && !isPending;

            return (
              <Stack
                key={`msg-${i}`}
                direction="row"
                sx={{
                  justifyContent: isAgent ? "flex-start" : "flex-end",
                  alignItems: "flex-end",
                  gap: theme.spacing(1.5),
                  animation: `${fadeInUp} ${theme.transitions.duration.shorter}ms ${theme.transitions.easing.easeOut}`,
                }}
              >
                {isAgent && (
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: theme.palette.secondary.main,
                      color: theme.palette.secondary.contrastText,
                      flexShrink: 0,
                      borderRadius: "50%",
                      border: "none",
                      mb: 0.5,
                    }}
                  >
                    <Bot size={15} strokeWidth={1.5} />
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: isAgent ? "82%" : "75%",
                    px: theme.spacing(2),
                    py: theme.spacing(1.5),
                    borderRadius: isAgent
                      ? `4px ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 4px`
                      : `${theme.shape.borderRadius}px 4px 4px ${theme.shape.borderRadius}px`,
                    bgcolor: isAgent
                      ? theme.palette.action.hover
                      : theme.palette.secondary.main,
                    color: isAgent
                      ? theme.palette.text.primary
                      : theme.palette.secondary.contrastText,
                    ...(msg.isError && {
                      bgcolor: theme.palette.error.main,
                      color: theme.palette.error.contrastText,
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

          {isPending && (
            <Stack
              direction="row"
              sx={{
                alignItems: "flex-end",
                gap: theme.spacing(1.5),
                animation: `${fadeInUp} ${theme.transitions.duration.shorter}ms ${theme.transitions.easing.easeOut}`,
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  flexShrink: 0,
                  borderRadius: "50%",
                  border: "none",
                  mb: 0.5,
                }}
              >
                <Bot size={15} strokeWidth={1.5} />
              </Avatar>
              <Box
                sx={{
                  px: theme.spacing(2.5),
                  py: theme.spacing(2),
                  borderRadius: `4px ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 4px`,
                  bgcolor: theme.palette.action.hover,
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing(0.75),
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={`dot-${i}`}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: theme.palette.secondary.main,
                      opacity: theme.palette.action.disabledOpacity,
                      animation: `${jumpDots} 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                ))}
              </Box>
            </Stack>
          )}

          <Box sx={{ height: theme.spacing(0.5), flexShrink: 0 }} />
        </Box>

        {selectedItem && (
          <Box
            sx={{
              px: theme.spacing(3),
              py: theme.spacing(2),
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.default,
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: theme.spacing(1.5),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: theme.typography.fontWeightMedium,
                  color: theme.palette.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                }}
              >
                Pertanyaan terpilih
              </Typography>
              <IconButton
                onClick={handleClearItem}
                size="small"
                aria-label="Hapus pertanyaan"
                sx={{
                  width: 22,
                  height: 22,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.error.main,
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <X size={14} strokeWidth={1.5} />
              </IconButton>
            </Stack>
            <Box
              sx={{
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(1),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              >
                {selectedItem.icon} {selectedItem.label}
              </Typography>
            </Box>
          </Box>
        )}

        <Collapse
          in={
            showSuggestions && !selectedItem && availableSuggestions.length > 0
          }
        >
          <Box
            sx={{
              px: theme.spacing(3),
              pt: theme.spacing(2.5),
              pb: theme.spacing(2.5),
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.default,
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: theme.spacing(2),
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: theme.typography.fontWeightMedium,
                  fontSize: theme.typography.caption.fontSize,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Saran Pertanyaan
              </Typography>
              <IconButton
                onClick={() => setShowSuggestions(false)}
                size="small"
                aria-label="Sembunyikan saran"
                sx={{
                  width: 22,
                  height: 22,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.text.primary,
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ChevronDown size={14} strokeWidth={1.5} />
              </IconButton>
            </Stack>
            <Stack direction="column" sx={{ gap: theme.spacing(1.25) }}>
              {availableSuggestions.map((suggestion, idx) => (
                <Box
                  key={`suggestion-${idx}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectSuggestion(suggestion);
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(2),
                    px: theme.spacing(2),
                    py: theme.spacing(1.5),
                    borderRadius: `${theme.shape.borderRadius}px`,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                    cursor: "pointer",
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "transform"],
                      {
                        duration: theme.transitions.duration.shorter,
                      }
                    ),
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                      borderColor: theme.palette.secondary.main,
                      transform: "translateX(4px)",
                    },
                    "&:active": {
                      transform: "translateX(2px) scale(0.99)",
                    },
                    "&:focus-visible": {
                      outline: "none",
                      borderColor: theme.palette.secondary.main,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: theme.palette.action.hover,
                      borderRadius: "50%",
                      border: "none",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {suggestion.icon}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: theme.typography.fontWeightRegular,
                      lineHeight: 1.5,
                      color: theme.palette.text.primary,
                      fontSize: theme.typography.body2.fontSize,
                    }}
                  >
                    {suggestion.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>

        {!showSuggestions &&
          !selectedItem &&
          availableSuggestions.length > 0 && (
            <Box
              sx={{
                px: theme.spacing(3),
                py: theme.spacing(2),
                bgcolor: theme.palette.background.default,
                borderTop: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                onClick={() => setShowSuggestions(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowSuggestions(true);
                  }
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: theme.spacing(1),
                  px: theme.spacing(2),
                  py: theme.spacing(1),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  cursor: "pointer",
                  color: theme.palette.secondary.main,
                  transition: theme.transitions.create(["background-color"], {
                    duration: theme.transitions.duration.shorter,
                  }),
                  "&:hover": {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ChevronUp size={14} strokeWidth={1.5} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: theme.typography.fontWeightMedium,
                    fontSize: theme.typography.caption.fontSize,
                  }}
                >
                  Saran pertanyaan
                </Typography>
              </Box>
            </Box>
          )}

        <Stack
          direction="row"
          sx={{
            alignItems: "flex-end",
            gap: theme.spacing(1.5),
            px: theme.spacing(3),
            py: theme.spacing(2.5),
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.default,
            flexShrink: 0,
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan sesuatu..."
            inputRef={inputRef}
            disabled={isPending}
            multiline
            maxRows={4}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: theme.palette.background.paper,
                "& fieldset": {
                  borderColor: theme.palette.divider,
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.secondary.main,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.secondary.main,
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
                        width: 36,
                        height: 36,
                        bgcolor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        borderRadius: "50%",
                        transition: theme.transitions.create(
                          ["background-color"],
                          {
                            duration: theme.transitions.duration.shorter,
                          }
                        ),
                        "&:hover": {
                          bgcolor: theme.palette.secondary.dark,
                        },
                        "&.Mui-disabled": {
                          bgcolor: theme.palette.action.disabledBackground,
                          color: theme.palette.action.disabled,
                        },
                      }}
                    >
                      <Send size={15} strokeWidth={2} />
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
