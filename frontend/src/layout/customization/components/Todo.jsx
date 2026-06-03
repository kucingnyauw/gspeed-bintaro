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

const EmptyState = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: theme.spacing(8),
        gap: theme.spacing(3),
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.secondary.main, 0.06),
          fontSize: "2rem",
        }}
      >
        📝
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.secondary,
            mb: 0.75,
          }}
        >
          Belum ada catatan
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.disabled,
            fontSize: theme.typography.body2.fontSize,
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
        bgcolor: alpha(theme.palette.common.black, 0.3),
        backdropFilter: "blur(4px)",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: "94vw", sm: 480 },
          maxWidth: 480,
          minHeight: 420,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: `${theme.shape.borderRadius * 1.5}px`,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[12],
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: theme.spacing(3),
            py: theme.spacing(2.5),
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            flexShrink: 0,
          }}
        >
          <Stack direction="row" sx={{ gap: theme.spacing(1.5), alignItems: "center" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: theme.typography.fontWeightBold,
                color: theme.palette.text.primary,
                fontSize: "1rem",
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
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    color: theme.palette.secondary.main,
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
                width: 32,
                height: 32,
                color: theme.palette.text.secondary,
                "&:hover": {
                  color: theme.palette.text.primary,
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={{ p: theme.spacing(3), flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Stack direction="row" sx={{ gap: theme.spacing(1.5), mb: theme.spacing(3), flexShrink: 0 }}>
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
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: theme.palette.background.default,
                  fontSize: "0.9375rem",
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
            />
            <Tooltip title="Tambah catatan" arrow>
              <IconButton
                onClick={handleAdd}
                disabled={!text.trim()}
                size="medium"
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  color: theme.palette.secondary.contrastText,
                  bgcolor: theme.palette.secondary.main,
                  transition: theme.transitions.create(
                    ["background-color", "transform"],
                    { duration: theme.transitions.duration.shorter }
                  ),
                  "&:hover": {
                    bgcolor: theme.palette.secondary.dark,
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                <Plus size={22} strokeWidth={2} />
              </IconButton>
            </Tooltip>
          </Stack>

          {todos.length === 0 ? (
            <EmptyState />
          ) : (
            <Stack
              sx={{
                gap: 0.5,
                flex: 1,
                overflowY: "auto",
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
                        gap: theme.spacing(1.5),
                        py: theme.spacing(1.5),
                        px: theme.spacing(1.5),
                        borderRadius: `${theme.shape.borderRadius}px`,
                        transition: theme.transitions.create(["background-color"], {
                          duration: theme.transitions.duration.shorter,
                        }),
                        "&:hover": {
                          bgcolor: theme.palette.action.hover,
                        },
                        "&:hover .delete-btn": {
                          opacity: 1,
                        },
                      }}
                    >
                      <Checkbox
                        size="medium"
                        checked={todo.isCompleted}
                        onChange={() => handleToggle(todo.id)}
                        sx={{
                          color: alpha(theme.palette.secondary.main, 0.4),
                          "&.Mui-checked": {
                            color: theme.palette.success.main,
                          },
                        }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          flex: 1,
                          textDecoration: todo.isCompleted ? "line-through" : "none",
                          color: todo.isCompleted
                            ? theme.palette.text.disabled
                            : theme.palette.text.primary,
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
                            transition: theme.transitions.create(["opacity", "background-color"], {
                              duration: theme.transitions.duration.shorter,
                            }),
                            color: theme.palette.text.secondary,
                            p: 0.75,
                            borderRadius: `${theme.shape.borderRadius}px`,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                              color: theme.palette.error.main,
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

          {completedTodos.length > 0 && (
            <Box
              sx={{
                mt: theme.spacing(3),
                pt: theme.spacing(2.5),
                borderTop: `1px solid ${theme.palette.divider}`,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <Button
                size="medium"
                onClick={handleClearCompleted}
                sx={{
                  fontWeight: theme.typography.fontWeightMedium,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  color: theme.palette.error.main,
                  px: theme.spacing(3),
                  py: theme.spacing(1),
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