/**
 * BarChart - Reusable bar chart component with theme integration and responsive layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string[]} [props.labels=[]] - Chart labels
 * @param {Object[]} [props.datasets=[]] - Chart datasets
 * @param {string} [props.title=""] - Chart title
 * @param {boolean} [props.legend=true] - Show legend
 * @param {number} [props.height=300] - Chart height in pixels
 * @param {boolean} [props.stacked=false] - Enable stacked bars
 * @param {boolean} [props.horizontal=false] - Enable horizontal bars
 * @param {boolean} [props.isCurrency=false] - Format Y axis and tooltip as IDR currency
 * @returns {JSX.Element} Rendered bar chart
 */
import { memo, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Bar as BarChartJs } from "react-chartjs-2";
import { useTheme, Box } from "@mui/material";
import { formatToIdr } from "@shared/utils";
import { datasetShape, enrichDatasets, baseOptions } from "./ChartConfig";

const BarChart = memo(({
  labels = [],
  datasets = [],
  title = "",
  legend = true,
  height = 300,
  stacked = false,
  horizontal = false,
  isCurrency = false,
}) => {
  const theme = useTheme();
  const chartRef = useRef(null);

  useEffect(() => () => {
    if (chartRef.current) chartRef.current.destroy();
  }, []);

  const enriched = useMemo(() =>
    enrichDatasets(datasets, theme).map((ds) => ({
      ...ds,
      borderRadius: horizontal ? 0 : ds.borderRadius,
    })),
    [datasets, theme, horizontal]
  );

  const options = useMemo(() => {
    const base = baseOptions(theme, title, legend);
    base.scales.x.stacked = stacked;
    base.scales.y.stacked = stacked;
    base.indexAxis = horizontal ? "y" : "x";
    base.interaction = stacked
      ? { mode: "index" }
      : { mode: "nearest", intersect: true };

    if (isCurrency) {
      const axis = horizontal ? "x" : "y";
      base.scales[axis].ticks.callback = (value) => formatToIdr(value);
      base.plugins.tooltip.callbacks = {
        label: (context) => ` ${context.dataset.label || ""}: ${formatToIdr(context.raw)}`,
      };
    }

    return base;
  }, [theme, title, legend, stacked, horizontal, isCurrency]);

  return (
    <Box sx={{ height, position: "relative", width: "100%" }}>
      <BarChartJs ref={chartRef} data={{ labels, datasets: enriched }} options={options} redraw />
    </Box>
  );
});

BarChart.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(datasetShape),
  title: PropTypes.string,
  legend: PropTypes.bool,
  height: PropTypes.number,
  stacked: PropTypes.bool,
  horizontal: PropTypes.bool,
  isCurrency: PropTypes.bool,
};

export default BarChart;