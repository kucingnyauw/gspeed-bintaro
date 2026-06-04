import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Checkbox,
  IconButton,
  Stack,
  TextField,
  Typography,
  Button,
  useTheme,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import {
  addTodo,
  toggleTodoStatus,
  deleteTodo,
  clearCompletedTodos,
} from "@store/todo/todoSlices.js";
import {
  selectTodos,
  selectPendingTodos,
  selectCompletedTodos,
} from "@store/todo/todoSelector.js";

/**
 * EmptyState - Tampilan saat belum ada catatan.
 */
const EmptyState = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 10,
        gap: 3,
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.secondary.main, 0.06),
          border: `2px dashed ${alpha(theme.palette.secondary.main, 0.15)}`,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.palette.secondary.main}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </Box>
      <Box sx={{ textAlign: "center", maxWidth: 260 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            mb: 0.75,
          }}
        >
          Belum ada catatan
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.disabled",
            lineHeight: 1.6,
          }}
        >
          Tulis catatan baru untuk memulai
        </Typography>
      </Box>
    </Box>
  );
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, height: 0 },
  visible: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Todo - Dialog catatan cepat dengan fitur tambah, checklist, hapus, dan bersihkan.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 */
const Todo = ({ open, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const todos = useSelector(selectTodos);
  const pendingTodos = useSelector(selectPendingTodos);
  const completedTodos = useSelector(selectCompletedTodos);
  const [text, setText] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch(addTodo(trimmed));
    setText("");
  }, [text, dispatch]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") handleAdd();
    },
    [handleAdd]
  );

  const handleToggle = useCallback(
    (id) => dispatch(toggleTodoStatus(id)),
    [dispatch]
  );

  const handleDelete = useCallback(
    (id) => dispatch(deleteTodo(id)),
    [dispatch]
  );

  const handleClearCompleted = useCallback(
    () => dispatch(clearCompletedTodos()),
    [dispatch]
  );

  return (
    <Box
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Catatan Cepat"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal + 2,
        display: open ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: alpha(theme.palette.common.black, 0.45),
        backdropFilter: "blur(8px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "100%", sm: 500 },
          maxWidth: 500,
          minHeight: 460,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          bgcolor: "background.paper",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.2)}`,
          overflow: "hidden",
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
            bgcolor: alpha(theme.palette.background.default, 0.6),
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                fontSize: "1.0625rem",
                letterSpacing: "-0.01em",
              }}
            >
              Catatan Cepat
            </Typography>
            {todos.length > 0 && (
              <Box
                sx={{
                  px: 1.25,
                  py: 0.375,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "secondary.main",
                    fontSize: "0.75rem",
                  }}
                >
                  {pendingTodos.length} belum
                </Typography>
              </Box>
            )}
          </Stack>
          <Tooltip title="Tutup" arrow>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Tutup catatan"
              sx={{
                color: "text.secondary",
                borderRadius: 2,
                "&:hover": {
                  color: "error.main",
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              <X size={20} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* BODY */}
        <Box
          sx={{
            p: 3,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* INPUT ROW */}
          <Stack
            direction="row"
            sx={{ gap: 1.5, mb: 3, flexShrink: 0 }}
          >
            <TextField
              fullWidth
              size="medium"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis catatan baru..."
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "background.default",
                  fontSize: "0.9375rem",
                  "& fieldset": {
                    borderColor: "divider",
                  },
                  "&:hover fieldset": {
                    borderColor: "secondary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "secondary.main",
                    borderWidth: 1,
                  },
                },
              }}
            />
            <Tooltip title="Tambah catatan" arrow>
              <IconButton
                onClick={handleAdd}
                disabled={!text.trim()}
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  color: "secondary.contrastText",
                  bgcolor: "secondary.main",
                  boxShadow: `0 4px 14px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  transition: (t) =>
                    t.transitions.create(
                      ["background-color", "transform", "box-shadow"],
                      { duration: t.transitions.duration.shorter }
                    ),
                  "&:hover": {
                    bgcolor: "secondary.dark",
                    boxShadow: `0 6px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  },
                  "&:active": {
                    transform: "scale(0.94)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "action.disabledBackground",
                    color: "action.disabled",
                    boxShadow: "none",
                  },
                }}
              >
                <Plus size={24} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* EMPTY STATE */}
          {todos.length === 0 ? (
            <EmptyState />
          ) : (
            /* TODO LIST */
            <Stack
              sx={{
                gap: 0.5,
                flex: 1,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "divider",
                  borderRadius: 10,
                },
              }}
            >
              <AnimatePresence>
                {[...pendingTodos, ...completedTodos].map((todo) => (
                  <Box
                    key={todo.id}
                    component={motion.div}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        gap: 1.5,
                        py: 1.75,
                        px: 2,
                        borderRadius: 2,
                        transition: (t) =>
                          t.transitions.create("background-color", {
                            duration: t.transitions.duration.shorter,
                          }),
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                        "&:hover .delete-btn": {
                          opacity: 1,
                        },
                      }}
                    >
                      {/* Custom outlined checkbox via SVG */}
                      <Box
                        onClick={() => handleToggle(todo.id)}
                        sx={{
                          width: 22,
                          height: 22,
                          flexShrink: 0,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill={todo.isCompleted ? theme.palette.success.main : "none"}
                          stroke={
                            todo.isCompleted
                              ? theme.palette.success.main
                              : alpha(theme.palette.secondary.main, 0.4)
                          }
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                          {todo.isCompleted && (
                            <polyline points="8 12 11 15 16 9" />
                          )}
                        </svg>
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          flex: 1,
                          textDecoration: todo.isCompleted
                            ? "line-through"
                            : "none",
                          color: todo.isCompleted
                            ? "text.disabled"
                            : "text.primary",
                          fontSize: "0.9375rem",
                          lineHeight: 1.5,
                        }}
                      >
                        {todo.text}
                      </Typography>

                      <Tooltip title="Hapus" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(todo.id)}
                          className="delete-btn"
                          sx={{
                            opacity: 0,
                            transition: (t) =>
                              t.transitions.create(
                                ["opacity", "background-color"],
                                { duration: t.transitions.duration.shorter }
                              ),
                            color: "text.secondary",
                            p: 0.75,
                            borderRadius: 2,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                              color: "error.main",
                            },
                          }}
                        >
                          <X size={16} strokeWidth={2} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </AnimatePresence>
            </Stack>
          )}

          {/* CLEAR COMPLETED */}
          {completedTodos.length > 0 && (
            <Box
              sx={{
                mt: 3,
                pt: 2.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <Button
                onClick={handleClearCompleted}
                sx={{
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  color: "error.main",
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.06),
                  },
                }}
              >
                Bersihkan yang selesai ({completedTodos.length})
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Todo;