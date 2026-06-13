/**
 * SummaryCard component for dashboard metrics.
 * Integrates with Framer Motion for animations and strictly adheres to the custom MUI theme configuration.
 * Features a modern SaaS aesthetic with dynamic typography scaling, subtle gradients,
 * and theme-compliant hover elevations.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.color="primary"] - Theme color key (primary, secondary, success, error, warning, info).
 * @param {import("react").ElementType} props.icon - Icon component to display (e.g., from lucide-react).
 * @param {number} [props.index=0] - Index for staggered Framer Motion animations.
 * @param {string} [props.subtitle] - Secondary text displayed below the main value.
 * @param {string} props.title - Primary label or title for the metric.
 * @param {"up" | "down"} [props.trend] - Direction of the trend indicator.
 * @param {string} [props.trendValue] - Text value for the trend.
 * @param {string|number} props.value - The main metric value to display.
 * @returns {JSX.Element} The rendered SummaryCard component.
 */
import { memo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const MotionCard = motion.create(Card);

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: index * 0.1, ease: "easeOut" },
  }),
};

const iconContainerVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.1,
    rotate: -8,
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
};

const SummaryCard = memo(
  ({
    color = "primary",
    icon: Icon,
    index = 0,
    subtitle,
    title,
    trend,
    trendValue,
    value,
  }) => {
    const theme = useTheme();
    const mainColor = theme.palette[color]?.main || theme.palette.primary.main;

    return (
      <MotionCard
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover="hover"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          boxShadow: theme.shadows[1],
    
          transition: theme.transitions.create(
            ["transform", "box-shadow"],
            { duration: theme.transitions.duration.short }
          ),
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[4],

          },
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2.5,
              width: "100%",
            }}
          >
            <Stack
              sx={{
                flex: 1,
                minWidth: 0,
                gap: 1.5,
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                noWrap
                sx={{
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "capitalize",
                }}
              >
                {title}
              </Typography>

              <Typography
                variant="h4"
                color="text.primary"
                noWrap
                sx={{
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>

              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1.5,
                  mt: 0.5,
                }}
              >
                {trendValue && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      bgcolor: alpha(
                        trend === "up"
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        0.12
                      ),
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color:
                          trend === "up"
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                      }}
                    >
                      {trend === "up" ? "↗" : "↘"}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: trend === "up" ? "success.main" : "error.main",
                      }}
                    >
                      {trendValue}
                    </Typography>
                  </Box>
                )}

                {subtitle && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      opacity: 0.8,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Box
              component={motion.div}
              variants={iconContainerVariants}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 48,
                height: 48,
                borderRadius: `${theme.shape.borderRadius}px`,
                backgroundColor: alpha(mainColor, 0.1),
                color: mainColor,
                boxShadow: `inset 0px 2px 4px ${alpha(
                  theme.palette.background.paper,
                  0.3
                )}`,
              }}
            >
              <Icon size={22} strokeWidth={2} />
            </Box>
          </Stack>
        </CardContent>
      </MotionCard>
    );
  }
);

SummaryCard.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  index: PropTypes.number,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(["up", "down"]),
  trendValue: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default SummaryCard;