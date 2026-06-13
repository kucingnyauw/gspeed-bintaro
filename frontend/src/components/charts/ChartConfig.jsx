/**
 * Chart Configuration & Helpers
 * Ultra-minimalist theme integration, zero hardcoded values, MUI v9 compatible.
 * Designed for clean, borderless, and razor-thin aesthetics.
 *
 * @module chartConfig
 */
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler,
  Legend, LinearScale, LineElement, PointElement, RadialLinearScale,
  Title, Tooltip,
} from "chart.js";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler
);

/** @type {number} */
const DEFAULT_LINE_TENSION = 0.4;

/** @type {number} */
const DEFAULT_POINT_RADIUS = 5;

/** @type {number} */
const DEFAULT_HOVER_RADIUS = 7;

/** @type {number} */
const DEFAULT_HIT_RADIUS = 10;

/** @type {number} */
const DEFAULT_MAX_BAR_THICKNESS = 32;

/**
 * Extracts a numeric value from theme spacing or borderRadius strings.
 *
 * @param {string|number} value - The theme value to parse.
 * @returns {number} The numeric representation in pixels.
 */
const getNumericValue = (value) => {
  if (typeof value === "number") return value;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 4 : parsed;
};

/**
 * React PropTypes shape for validating chart dataset objects.
 *
 * @type {PropTypes.Requireable<PropTypes.InferProps>}
 */
export const datasetShape = PropTypes.shape({
  label: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  backgroundColor: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  borderColor: PropTypes.string,
});

/**
 * Generates an array of default colors from the MUI theme palette.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @returns {string[]} An array of color strings.
 */
export const defaultColors = (theme) => [
  theme.palette.primary.main,
  theme.palette.text.primary,
  theme.palette.success.main,
  theme.palette.warning.main,
  theme.palette.info.main,
  theme.palette.error.main,
];

/**
 * Generates an array of default colors with applied alpha transparency.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @param {number} [opacity=0.1] - The alpha opacity value (0 to 1).
 * @returns {string[]} An array of rgba color strings.
 */
export const defaultColorsAlpha = (theme, opacity = 0.1) =>
  defaultColors(theme).map((color) => alpha(color, opacity));

/**
 * Enriches standard datasets with theme-aware styling for an ultra-minimalist look.
 *
 * @param {Object[]} datasets - Array of standard Chart.js datasets.
 * @param {Object} theme - The initialized MUI theme object.
 * @returns {Object[]} The enriched datasets with applied theme styles.
 */
export const enrichDatasets = (datasets, theme) => {
  const colors = defaultColors(theme);
  const br = getNumericValue(theme.shape.borderRadius);

  return datasets.map((ds, i) => {
    const assignedColor = colors[i % colors.length];
    const isBubbleOrScatter = Array.isArray(ds.data) && typeof ds.data[0] === "object";
    const isBar = ds.type === "bar" || (!ds.type && ds.backgroundColor !== "transparent" && !isBubbleOrScatter);

    return {
      ...ds,
      backgroundColor: ds.backgroundColor || (isBar ? alpha(assignedColor, 0.85) : alpha(assignedColor, 0.5)),
      hoverBackgroundColor: assignedColor,
      borderColor: ds.borderColor || assignedColor,
      borderWidth: isBar ? 0 : 2,
      tension: ds.tension ?? DEFAULT_LINE_TENSION,
      fill: ds.fill || false,
      pointBackgroundColor: ds.pointBackgroundColor || alpha(assignedColor, 0.8),
      pointBorderColor: ds.pointBorderColor || assignedColor,
      pointBorderWidth: 1.5,
      pointRadius: ds.pointRadius ?? DEFAULT_POINT_RADIUS,
      pointHoverRadius: DEFAULT_HOVER_RADIUS,
      hitRadius: DEFAULT_HIT_RADIUS,
      pointHoverBackgroundColor: assignedColor,
      pointHoverBorderColor: theme.palette.background.paper,
      pointHoverBorderWidth: 2,
      borderRadius: ds.borderRadius ?? br,
      borderSkipped: false,
      maxBarThickness: ds.maxBarThickness ?? DEFAULT_MAX_BAR_THICKNESS,
    };
  });
};

/**
 * Creates consistent legend configuration for all chart types.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @param {boolean} visible - Display legend or not.
 * @returns {Object} Legend configuration object.
 */
const createLegendConfig = (theme, visible) => ({
  display: visible,
  position: "bottom",
  align: "center",
  labels: {
    usePointStyle: true,
    pointStyleWidth: 7,
    pointStyleHeight: 7,
    boxWidth: 7,
    boxHeight: 7,
    padding: 20,
    useBorderRadius: true,
    borderRadius: 50,
    font: { size: 12, family: theme.typography.fontFamily, weight: 500 },
    color: alpha(theme.palette.text.primary, 0.7),
  },
});

/**
 * Creates consistent legend config for circular charts (Pie, Doughnut, PolarArea).
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @param {boolean} visible - Display legend or not.
 * @returns {Object} Legend configuration object.
 */
const createCircularLegendConfig = (theme, visible) => ({
  ...createLegendConfig(theme, visible),
  labels: {
    ...createLegendConfig(theme, visible).labels,
    generateLabels: (chart) => {
      const { labels, datasets } = chart.data;
      if (!labels.length || !datasets.length) return [];

      const dataset = datasets[0];
      return labels.map((label, i) => ({
        text: label,
        fillStyle: Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor[i]
          : dataset.backgroundColor,
        strokeStyle: "transparent",
        lineWidth: 0,
        hidden: false,
        index: i,
        pointStyle: "circle",
        pointStyleWidth: 7,
        pointStyleHeight: 7,
        borderRadius: 50,
        fontColor: alpha(theme.palette.text.primary, 0.7),
      }));
    },
  },
});

/**
 * Creates consistent tooltip configuration for all chart types.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @returns {Object} Tooltip configuration object.
 */
const createTooltipConfig = (theme) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.85),
  titleColor: alpha(theme.palette.text.primary, 0.6),
  bodyColor: alpha(theme.palette.text.primary, 0.95),
  borderColor: alpha(theme.palette.divider, 0.2),
  borderWidth: 1,
  padding: { top: 10, right: 14, bottom: 10, left: 14 },
  cornerRadius: getNumericValue(theme.shape.borderRadius),
  caretSize: 0,
  titleFont: { size: 12, weight: 500, family: theme.typography.fontFamily },
  bodyFont: { size: 13, weight: 700, family: theme.typography.fontFamily },
  boxPadding: 6,
  usePointStyle: true,
  callbacks: {
    labelColor: (context) => ({
      borderColor: "transparent",
      backgroundColor: context.dataset.borderColor || context.dataset.backgroundColor,
    }),
  },
});

/**
 * Provides base configuration options for Line, Bar, and Bubble charts.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @param {string} [title] - The title of the chart.
 * @param {boolean} [legend=true] - Determines if the legend should be rendered.
 * @returns {Object} Chart.js options object.
 */
export const baseOptions = (theme, title, legend = true) => {
  const { fontFamily } = theme.typography;
  const br = getNumericValue(theme.shape.borderRadius);

  return {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      bar: { borderRadius: br, borderWidth: 0 },
      line: { borderCapStyle: "round", borderJoinStyle: "round" },
    },
    plugins: {
      legend: createLegendConfig(theme, legend),
      title: {
        display: !!title,
        text: title,
        align: "start",
        font: { size: 14, weight: 600, family: fontFamily },
        color: alpha(theme.palette.text.primary, 0.85),
        padding: { bottom: 24 },
      },
      tooltip: createTooltipConfig(theme),
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          font: { size: 11, family: fontFamily, weight: 500 },
          color: alpha(theme.palette.text.primary, 0.45),
          padding: 12,
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.divider, 0.1),
          borderDash: [4, 4],
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          font: { size: 11, family: fontFamily, weight: 500 },
          color: alpha(theme.palette.text.primary, 0.45),
          padding: 16,
          maxTicksLimit: 6,
        },
        border: { display: false },
      },
    },
    layout: { padding: 0 },
    interaction: { mode: "index", intersect: false },
  };
};

/**
 * Provides base configuration options for Doughnut, Pie, and PolarArea charts.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @param {string} [title] - The title of the chart.
 * @param {boolean} [legend=true] - Determines if the legend should be rendered.
 * @returns {Object} Chart.js options object.
 */
export const circularBaseOptions = (theme, title, legend = true) => {
  const { fontFamily } = theme.typography;
  const br = getNumericValue(theme.shape.borderRadius);

  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "85%",
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: theme.palette.background.paper,
        borderRadius: br > 4 ? 4 : br,
        hoverOffset: 4,
      },
    },
    scales: {
      r: {
        ticks: { display: false, backdropColor: "transparent" },
        grid: {
          color: alpha(theme.palette.divider, 0.1),
          borderDash: [4, 4],
          circular: true,
          lineWidth: 1,
        },
        angleLines: { display: false },
        border: { display: false },
        pointLabels: { display: false },
      },
    },
    plugins: {
      legend: createCircularLegendConfig(theme, legend),
      title: {
        display: !!title,
        text: title,
        align: "start",
        font: { size: 14, weight: 600, family: fontFamily },
        color: alpha(theme.palette.text.primary, 0.85),
        padding: { bottom: 24 },
      },
      tooltip: createTooltipConfig(theme),
    },
  };
};

/**
 * Provides base configuration options for Radar charts.
 *
 * @param {Object} theme - The initialized MUI theme object.
 * @param {string} [title] - The title of the chart.
 * @param {boolean} [legend=true] - Determines if the legend should be rendered.
 * @returns {Object} Chart.js options object.
 */
export const radarBaseOptions = (theme, title, legend = true) => {
  const { fontFamily } = theme.typography;

  return {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { borderWidth: 1.5 },
      point: { radius: 0, hoverRadius: 5, hitRadius: 10 },
    },
    plugins: {
      legend: createLegendConfig(theme, legend),
      title: {
        display: !!title,
        text: title,
        align: "start",
        font: { size: 14, weight: 600, family: fontFamily },
        color: alpha(theme.palette.text.primary, 0.85),
      },
      tooltip: createTooltipConfig(theme),
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.divider, 0.1),
          borderDash: [4, 4],
          circular: true,
          lineWidth: 1,
        },
        angleLines: {
          color: alpha(theme.palette.divider, 0.1),
          borderDash: [4, 4],
          lineWidth: 1,
        },
        pointLabels: {
          font: { size: 11, family: fontFamily, weight: 500 },
          color: alpha(theme.palette.text.primary, 0.5),
        },
        ticks: { display: false },
      },
    },
  };
};