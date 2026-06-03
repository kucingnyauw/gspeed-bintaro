import { useState, useRef } from "react";
import { Fab, Tooltip, Box, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator as CalcIcon,
  ListTodo,
  Bot,
  X,
  Plus,
} from "lucide-react";
import { Calculator, Chat, Todo } from "./components";

const menuItems = [
  { id: "calculator", icon: CalcIcon, label: "Kalkulator" },
  { id: "todos", icon: ListTodo, label: "Catatan Cepat" },
  { id: "chat", icon: Bot, label: "Chat" },
];

const menuVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.85 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      type: "spring",
      stiffness: 350,
      damping: 22,
    },
  }),
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.85,
    transition: { duration: 0.15 },
  },
};

/**
 * Komponen Customization untuk menampilkan akses cepat ke berbagai tools.
 */
const Customization = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [portalContent, setPortalContent] = useState(null);
  const fabRef = useRef(null);

  const handleMenuClick = (id) => {
    setPortalContent(id);
    setOpen(false);
  };

  const handleClosePortal = () => setPortalContent(null);

  return (
    <>
      <Box
        ref={fabRef}
        sx={{
          position: "fixed",
          top: "50%",
          transform: "translateY(-50%)",
          right: theme.spacing(1.5),
          zIndex: theme.zIndex.fab,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: 60,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: theme.spacing(1.25),
          }}
        >
          <AnimatePresence>
            {open &&
              menuItems.map((item, i) => (
                <Tooltip
                  key={item.id}
                  title={item.label}
                  placement="left"
                  arrow
                >
                  <Box
                    component={motion.div}
                    custom={i}
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Fab
                      size="small"
                      color="secondary"
                      onClick={() => handleMenuClick(item.id)}
                      sx={{
                        width: 44,
                        height: 44,
                        boxShadow: theme.shadows[3],
                        transition: theme.transitions.create(
                          ["transform", "box-shadow"],
                          { duration: theme.transitions.duration.shorter }
                        ),
                        "&:hover": {
                          transform: "scale(1.08)",
                          boxShadow: theme.shadows[6],
                        },
                        "&:active": {
                          transform: "scale(0.95)",
                        },
                      }}
                    >
                      <item.icon size={20} strokeWidth={1.5} />
                    </Fab>
                  </Box>
                </Tooltip>
              ))}
          </AnimatePresence>
        </Box>

        <Tooltip
          title={open ? "Tutup menu" : "Tools"}
          placement="left"
          arrow
        >
          <Fab
            color="secondary"
            onClick={() => setOpen(!open)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              boxShadow: theme.shadows[4],
              transition: theme.transitions.create(
                ["transform", "box-shadow", "border-radius"],
                { duration: theme.transitions.duration.standard }
              ),
              "&:hover": {
                transform: "scale(1.08)",
                boxShadow: theme.shadows[8],
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <motion.div
              animate={{ rotate: open ? 135 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={22} strokeWidth={2} />
            </motion.div>
          </Fab>
        </Tooltip>
      </Box>

      <Calculator
        open={portalContent === "calculator"}
        onClose={handleClosePortal}
      />
      <Todo open={portalContent === "todos"} onClose={handleClosePortal} />
      <Chat open={portalContent === "chat"} onClose={handleClosePortal} />
    </>
  );
};

export default Customization;