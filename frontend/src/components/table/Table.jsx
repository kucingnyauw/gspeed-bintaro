/**
 * AppTable - Komponen tabel reusable dengan fitur pencarian, pagination, tombol aksi,
 * salin via klik kanan, visibilitas kolom, expandable rows, multi-select checkbox,
 * navigasi keyboard, dan bulk action bar.
 *
 * Kompatibel MUI v9 | Integrasi theme penuh | Clean architecture styling
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Array<{color?: string, disabled?: boolean, hasTransitions?: boolean, icon: React.ElementType, isBulkAction?: boolean, label: string, onClick: Function}>} [props.actions=[]] - Daftar aksi
 * @param {number} props.count - Jumlah total halaman untuk pagination
 * @param {Array<Object>} [props.data=[]] - Data baris tabel
 * @param {string} [props.emptyStateMessage="Tidak ada data ditemukan."] - Pesan saat data kosong
 * @param {boolean} [props.enableMultiSelect=false] - Aktifkan multi-select checkbox
 * @param {string[]} [props.headers=[]] - Header kolom tabel
 * @param {boolean} [props.hideRowsPerPage=false] - Sembunyikan menu baris per halaman
 * @param {boolean} [props.isLoading=false] - Status loading
 * @param {number} [props.minWidth=900] - Minimal lebar tabel (px)
 * @param {Function} [props.onChange] - Handler perubahan halaman
 * @param {Function} [props.onRowClick] - Handler klik baris
 * @param {Function} [props.onRowDoubleClick] - Handler double-click baris
 * @param {Function} [props.onRowsPerPageChange] - Handler perubahan baris per halaman
 * @param {Function} [props.onSearchChange] - Handler perubahan pencarian
 * @param {Function} [props.onSelectionChange] - Handler perubahan seleksi
 * @param {number} [props.page=1] - Halaman aktif saat ini
 * @param {Function} [props.renderRow] - Render kustom untuk sel baris
 * @param {Function} [props.renderExpandableRow] - Render konten expandable
 * @param {number} [props.rowsPerPage=5] - Jumlah baris per halaman
 * @param {number[]} [props.rowsPerPageOptions=[5, 10, 25, 50]] - Opsi baris per halaman
 * @param {number} [props.rowsSkeletonCount=10] - Jumlah skeleton saat loading
 * @param {string} [props.searchPlaceholder="Cari..."] - Placeholder input pencarian
 * @param {string} [props.searchVal] - Nilai input pencarian (controlled)
 * @param {string|number} [props.selectedId] - ID baris yang dipilih (highlight)
 * @param {Array<string|number>} [props.selectedRows] - Array ID baris terpilih (controlled)
 * @param {{duration?: number, maxStack?: number, position?: "right"|"left"}} [props.snackbarProps] - Konfigurasi snackbar salin
 * @param {string} [props.subtitle] - Subtitle tabel
 * @param {string} [props.title] - Judul tabel
 * @returns {JSX.Element} Komponen tabel
 */
import {
  memo,
  useState,
  useCallback,
  Fragment,
  useRef,
  useEffect,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { Copy, Search, Rows, Columns, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Pagination,
  Popover,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDevice } from "@hooks/useDevice.js";

/**
 * Mengekstrak teks dari node React untuk keperluan copy.
 *
 * @param {*} node - Node React atau nilai primitif
 * @returns {string} Teks hasil ekstraksi
 */
const extractCellText = (node) => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractCellText).join("");
  if (node?.props?.children) return extractCellText(node.props.children);
  return "";
};

/**
 * Variants untuk animasi stacked snackbar.
 *
 * @type {Object}
 */
const stackedSnackbarVariants = {
  initial: () => ({
    opacity: 0,
    x: 120,
    scale: 0.92,
    y: -20,
  }),
  animate: (index) => ({
    opacity: 1 - index * 0.12,
    x: 0,
    scale: 1 - index * 0.025,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      delay: index * 0.05,
    },
  }),
  exit: () => ({
    opacity: 0,
    x: 120,
    scale: 0.92,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
};

/** @type {number} Counter untuk ID unik snackbar */
let snackbarIdCounter = 0;

const AppTable = memo(
  ({
    actions = [],
    count,
    data = [],
    emptyStateMessage = "Tidak ada data ditemukan.",
    enableMultiSelect = false,
    headers = [],
    hideRowsPerPage = false,
    isLoading = false,
    minWidth = 900,
    onChange,
    onRowClick,
    onRowDoubleClick,
    onRowsPerPageChange,
    onSearchChange,
    onSelectionChange,
    page = 1,
    renderRow,
    renderExpandableRow,
    rowsPerPage = 5,
    rowsPerPageOptions = [5, 10, 25, 50],
    rowsSkeletonCount = 10,
    searchPlaceholder = "Cari...",
    searchVal,
    selectedId,
    selectedRows: selectedRowsProp,
    snackbarProps,
    subtitle,
    title,
  }) => {
    const theme = useTheme();
    const { isMobile } = useDevice();
    const tableContainerRef = useRef(null);

    /** @type {number} Durasi snackbar */
    const snackbarDuration = snackbarProps?.duration || 3000;

    /** @type {number} Maksimal snackbar ditampilkan */
    const snackbarMaxStack = snackbarProps?.maxStack || 5;

    const [contextMenu, setContextMenu] = useState(null);
    const [highlightedCell, setHighlightedCell] = useState(null);
    const [snackbarQueue, setSnackbarQueue] = useState([]);
    const timeoutsRef = useRef({});

    const [hiddenColumns, setHiddenColumns] = useState(new Set());
    const [colToggleAnchor, setColToggleAnchor] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [internalSelectedRows, setInternalSelectedRows] = useState([]);

    const selectedRows =
      selectedRowsProp !== undefined ? selectedRowsProp : internalSelectedRows;
    const isControlled = selectedRowsProp !== undefined;

    /**
     * Menghapus snackbar berdasarkan ID.
     *
     * @param {number} id - ID snackbar
     */
    const removeSnackbar = useCallback((id) => {
      if (timeoutsRef.current[id]) {
        clearTimeout(timeoutsRef.current[id]);
        delete timeoutsRef.current[id];
      }
      setSnackbarQueue((prev) => prev.filter((s) => s.id !== id));
    }, []);

    /**
     * Menambahkan snackbar baru ke queue.
     */
    const addSnackbar = useCallback(() => {
      const id = ++snackbarIdCounter;
      setSnackbarQueue((prev) => {
        const next = [...prev, { id }];
        if (next.length > snackbarMaxStack) {
          const removed = next.shift();
          if (timeoutsRef.current[removed.id]) {
            clearTimeout(timeoutsRef.current[removed.id]);
            delete timeoutsRef.current[removed.id];
          }
        }
        return next;
      });

      timeoutsRef.current[id] = setTimeout(() => {
        removeSnackbar(id);
      }, snackbarDuration);
    }, [snackbarDuration, snackbarMaxStack, removeSnackbar]);

    useEffect(() => {
      return () => {
        Object.values(timeoutsRef.current).forEach(clearTimeout);
      };
    }, []);

    /**
     * Handler perubahan seleksi baris.
     *
     * @param {Array<string|number>} newSelection - Array ID baris terpilih
     */
    const handleSelectionChange = useCallback(
      (newSelection) => {
        if (!isControlled) {
          setInternalSelectedRows(newSelection);
        }
        onSelectionChange?.(newSelection);
      },
      [isControlled, onSelectionChange]
    );

    const hasHeader = title || subtitle || onSearchChange || actions.length > 0;
    const hasExpandable = Boolean(renderExpandableRow);
    const hasCheckbox = enableMultiSelect;

    /**
     * Jumlah kolom yang terlihat.
     *
     * @type {number}
     */
    const visibleColCount = useMemo(() => {
      let count = headers.length - hiddenColumns.size;
      if (hasExpandable) count += 1;
      if (hasCheckbox) count += 1;
      return count;
    }, [headers.length, hiddenColumns.size, hasExpandable, hasCheckbox]);

    /**
     * ID baris pada halaman saat ini.
     *
     * @type {Array<string|number>}
     */
    const currentPageRowIds = useMemo(() => {
      return data.map((row) => row.id ?? data.indexOf(row));
    }, [data]);

    /**
     * Apakah semua baris di halaman ini terpilih.
     *
     * @type {boolean}
     */
    const isAllSelected = useMemo(() => {
      if (!hasCheckbox || data.length === 0) return false;
      return currentPageRowIds.every((id) => selectedRows.includes(id));
    }, [hasCheckbox, data, currentPageRowIds, selectedRows]);

    /**
     * Apakah checkbox dalam state indeterminate.
     *
     * @type {boolean}
     */
    const isIndeterminate = useMemo(() => {
      if (!hasCheckbox || data.length === 0) return false;
      const selectedCount = currentPageRowIds.filter((id) =>
        selectedRows.includes(id)
      ).length;
      return selectedCount > 0 && selectedCount < currentPageRowIds.length;
    }, [hasCheckbox, data, currentPageRowIds, selectedRows]);

    const regularActions = actions.filter((action) => !action.isBulkAction);
    const bulkActions = actions.filter((action) => action.isBulkAction);

    /**
     * Handler select all checkbox.
     */
    const handleSelectAll = useCallback(() => {
      if (isAllSelected) {
        handleSelectionChange(
          selectedRows.filter((id) => !currentPageRowIds.includes(id))
        );
      } else {
        const newSet = new Set([...selectedRows, ...currentPageRowIds]);
        handleSelectionChange([...newSet]);
      }
    }, [isAllSelected, currentPageRowIds, selectedRows, handleSelectionChange]);

    /**
     * Handler select satu baris.
     *
     * @param {string|number} rowId - ID baris
     * @param {React.MouseEvent} e - Event klik
     */
    const handleSelectRow = useCallback(
      (rowId, e) => {
        e.stopPropagation();
        if (selectedRows.includes(rowId)) {
          handleSelectionChange(selectedRows.filter((id) => id !== rowId));
        } else {
          handleSelectionChange([...selectedRows, rowId]);
        }
      },
      [selectedRows, handleSelectionChange]
    );

    /**
     * Handler klik bulk action.
     *
     * @param {Object} action - Object aksi
     */
    const handleBulkActionClick = useCallback(
      (action) => {
        action.onClick?.(selectedRows);
      },
      [selectedRows]
    );

    /**
     * Handler keyboard navigasi.
     *
     * @param {React.KeyboardEvent} e - Event keyboard
     */
    const handleKeyDown = useCallback(
      (e) => {
        if (!data || data.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, data.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && focusedIndex >= 0) {
          e.preventDefault();
          const selectedRow = data[focusedIndex];
          if (hasExpandable) {
            handleToggleExpand(selectedRow.id ?? focusedIndex);
          }
          onRowClick?.(selectedRow);
        }
      },
      [data, focusedIndex, hasExpandable, onRowClick]
    );

    useEffect(() => {
      setFocusedIndex(-1);
    }, [data, page]);

    const handleOpenColToggle = (e) => setColToggleAnchor(e.currentTarget);
    const handleCloseColToggle = () => setColToggleAnchor(null);

    /**
     * Toggle visibilitas kolom.
     *
     * @param {number} idx - Index kolom
     */
    const toggleColumnVisibility = (idx) => {
      setHiddenColumns((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    };

    /**
     * Toggle expand baris.
     *
     * @param {string|number} rowId - ID baris
     */
    const handleToggleExpand = (rowId) => {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        if (next.has(rowId)) next.delete(rowId);
        else next.add(rowId);
        return next;
      });
    };

    /**
     * Handler context menu (klik kanan).
     *
     * @param {React.MouseEvent} e - Event klik kanan
     * @param {*} cellValue - Nilai sel
     * @param {string|number} rowId - ID baris
     * @param {number} colIdx - Index kolom
     * @param {string} rowText - Teks seluruh baris
     */
    const handleContextMenu = useCallback(
      (e, cellValue, rowId, colIdx, rowText) => {
        e.preventDefault();
        const cellText = extractCellText(cellValue);
        if (cellText || rowText) {
          setHighlightedCell(`${rowId}-${colIdx}`);
          setContextMenu({
            mouseX: e.clientX,
            mouseY: e.clientY,
            cellText,
            rowText,
            cellKey: `${rowId}-${colIdx}`,
          });
        }
      },
      []
    );

    const handleCloseContextMenu = useCallback(() => {
      setContextMenu(null);
      setHighlightedCell(null);
    }, []);

    /**
     * Menyalin teks ke clipboard.
     *
     * @param {string} text - Teks yang akan disalin
     */
    const copyToClipboard = useCallback(
      async (text) => {
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        addSnackbar();
        handleCloseContextMenu();
      },
      [addSnackbar, handleCloseContextMenu]
    );

    const handleCopyCell = () => copyToClipboard(contextMenu?.cellText);
    const handleCopyRow = () => copyToClipboard(contextMenu?.rowText);

    /**
     * Render header tabel.
     *
     * @returns {JSX.Element}
     */

    const renderedHeaders = (
      <TableRow>
        {hasExpandable && (
          <TableCell
            sx={{
              py: { xs: 1.75, sm: 2 },
              px: { xs: 2, sm: 2.5 },
              width: 48,
              backgroundColor: alpha(theme.palette.background.default, 0.6),
            }}
          />
        )}
        {hasCheckbox && (
          <TableCell
            padding="checkbox"
            sx={{
              py: { xs: 1.75, sm: 2 },
              px: { xs: 1, sm: 1.5 },
              width: 48,
              backgroundColor: alpha(theme.palette.background.default, 0.6),
            }}
          >
            {isLoading ? (
              <Skeleton
                variant="rounded"
                width={20}
                height={20}
                sx={{
                  borderRadius: `${theme.shape.borderRadius / 3}px`,
                  ml: 0.5,
                }}
              />
            ) : (
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
                size="small"
                sx={{
                  color: alpha(theme.palette.secondary.main, 0.5),
                  "&.Mui-checked": {
                    color: theme.palette.secondary.main,
                  },
                  "&.MuiCheckbox-indeterminate": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            )}
          </TableCell>
        )}
        {headers.map((header, idx) => {
          if (hiddenColumns.has(idx)) return null;
          return (
            <TableCell
              align="left"
              key={idx}
              sx={{
                py: { xs: 1.75, sm: 2 },
                px: { xs: 2, sm: 2.5 },
                fontWeight: 600,
                backgroundColor: alpha(theme.palette.background.default, 0.6),
              }}
            >
              {isLoading ? (
                <Skeleton
                  animation="wave"
                  height={16}
                  variant="text"
                  width={80}
                />
              ) : (
                header
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );

    /**
     * Render skeleton rows.
     *
     * @returns {JSX.Element[]}
     */
    const renderedSkeletons = Array.from({ length: rowsSkeletonCount }).map(
      (_, idx) => (
        <TableRow key={`skeleton-${idx}`}>
          {hasExpandable && (
            <TableCell sx={{ py: { xs: 1.75, sm: 2 }, px: { xs: 2, sm: 2.5 } }}>
              <Skeleton variant="circular" width={20} height={20} />
            </TableCell>
          )}
          {hasCheckbox && (
            <TableCell
              padding="checkbox"
              sx={{ py: { xs: 1.75, sm: 2 }, px: { xs: 1, sm: 1.5 } }}
            >
              <Skeleton
                variant="rounded"
                width={20}
                height={20}
                sx={{ borderRadius: `${theme.shape.borderRadius / 2}px` }}
              />
            </TableCell>
          )}
          {headers.map((_, i) => {
            if (hiddenColumns.has(i)) return null;
            return (
              <TableCell
                key={`cell-skeleton-${i}`}
                sx={{ py: { xs: 1.75, sm: 2 }, px: { xs: 2, sm: 2.5 } }}
              >
                <Skeleton
                  animation="wave"
                  height={20}
                  variant="text"
                  width={`${60 + Math.random() * 40}%`}
                />
              </TableCell>
            );
          })}
        </TableRow>
      )
    );

    let renderedRows;
    if (!isLoading && data.length === 0) {
      renderedRows = (
        <TableRow>
          <TableCell
            align="center"
            colSpan={visibleColCount}
            sx={{
              borderBottom: 0,
              py: { xs: 6, sm: 8 },
            }}
          >
            <Stack sx={{ gap: 1.5, alignItems: "center" }}>
              <Typography color="text.secondary" variant="h6" fontWeight={600}>
                {emptyStateMessage}
              </Typography>
              <Typography color="text.disabled" variant="caption">
                Silakan coba ubah filter atau tambahkan data baru
              </Typography>
            </Stack>
          </TableCell>
        </TableRow>
      );
    } else if (!isLoading && data.length > 0) {
      renderedRows = data.map((row, idx) => {
        const rowId = row.id ?? idx;
        const isSelected = selectedId === rowId;
        const isFocused = focusedIndex === idx;
        const isExpanded = expandedRows.has(rowId);
        const isChecked = selectedRows.includes(rowId);

        const rawCells = renderRow ? renderRow(row) : Object.values(row);
        const rowText = rawCells
          .map((val) => extractCellText(val))
          .filter(Boolean)
          .join(" \t ");

        return (
          <Fragment key={rowId}>
            <TableRow
              hover
              onClick={() => {
                setFocusedIndex(idx);
                if (hasExpandable) handleToggleExpand(rowId);
                onRowClick?.(row);
              }}
              onDoubleClick={() => onRowDoubleClick?.(row)}
              selected={isSelected}
              sx={{
                cursor:
                  onRowClick || onRowDoubleClick || hasExpandable
                    ? "pointer"
                    : "default",
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  },
                },
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                },
                ...(isChecked && {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                }),
                ...(isFocused && {
                  boxShadow: `inset 2px 0 0 0 ${theme.palette.primary.main}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }),
              }}
            >
              {hasExpandable && (
                <TableCell
                  sx={{
                    py: { xs: 1.75, sm: 2 },
                    px: { xs: 2, sm: 2.5 },
                    width: 48,
                    borderBottom: isExpanded ? "none" : undefined,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedIndex(idx);
                      handleToggleExpand(rowId);
                    }}
                    sx={{
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: theme.transitions.create("transform", {
                        duration: theme.transitions.duration.shortest,
                      }),
                    }}
                  >
                    <ChevronRight size={18} />
                  </IconButton>
                </TableCell>
              )}

              {hasCheckbox && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    py: { xs: 1.75, sm: 2 },
                    px: { xs: 1, sm: 1.5 },
                    width: 48,
                    borderBottom: isExpanded ? "none" : undefined,
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) => handleSelectRow(rowId, e)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    sx={{
                      color: alpha(theme.palette.secondary.main, 0.5),
                      "&.Mui-checked": {
                        color: theme.palette.secondary.main,
                      },
                    }}
                  />
                </TableCell>
              )}

              {rawCells.map((val, i) => {
                if (hiddenColumns.has(i)) return null;
                const cellKey = `${rowId}-${i}`;
                const isHighlighted = highlightedCell === cellKey;

                return (
                  <TableCell
                    key={i}
                    onContextMenu={(e) =>
                      handleContextMenu(e, val, rowId, i, rowText)
                    }
                    sx={{
                      py: { xs: 1.75, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                      userSelect: "none",
                      position: "relative",
                      borderBottom: isExpanded ? "none" : undefined,
                      transition: theme.transitions.create(
                        ["box-shadow", "border-color", "background-color"],
                        { duration: theme.transitions.duration.shorter }
                      ),
                      ...(isHighlighted && {
                        boxShadow: `inset 0 0 0 1.5px ${alpha(
                          theme.palette.secondary.main,
                          0.5
                        )}`,
                        borderColor: `${alpha(
                          theme.palette.secondary.main,
                          0.3
                        )} !important`,
                        backgroundColor: alpha(
                          theme.palette.secondary.main,
                          0.04
                        ),
                        borderRadius: `${theme.shape.borderRadius}px`,
                        zIndex: 1,
                      }),
                    }}
                  >
                    {val}
                  </TableCell>
                );
              })}
            </TableRow>

            {hasExpandable && (
              <TableRow>
                <TableCell
                  colSpan={visibleColCount}
                  sx={{
                    py: 0,
                    px: { xs: 2, sm: 2.5 },
                    borderBottom: isExpanded ? undefined : "none",
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.2
                    ),
                  }}
                >
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ py: 2 }}>{renderExpandableRow(row)}</Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        );
      });
    }

    const actionButtons = regularActions.map((action, idx) => {
      const {
        color = "primary",
        disabled,
        icon: Icon,
        label,
        onClick,
        hasTransitions = true,
      } = action;

      return (
        <Tooltip key={idx} arrow placement="top" title={label}>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              borderRadius: `${theme.shape.borderRadius}px`,
              border: "1px solid",
              borderColor: disabled
                ? alpha(theme.palette.divider, 0.4)
                : alpha(theme.palette.divider, 0.8),
              color: disabled
                ? theme.palette.action.disabled
                : theme.palette.text.secondary,
              transition: theme.transitions.create(
                ["background-color", "border-color", "color"],
                { duration: theme.transitions.duration.shorter }
              ),
              "&:hover":
                hasTransitions && !disabled
                  ? {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      color: theme.palette.secondary.main,
                    }
                  : {},
            }}
          >
            <IconButton
              color={color}
              disabled={disabled}
              onClick={onClick}
              size="small"
              aria-label={label}
              sx={{
                borderRadius: "inherit",
                minWidth: 38,
                minHeight: 38,
                p: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={18} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      );
    });
    return (
      <Card
        sx={{
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
          backgroundImage: "none",
          overflow: "visible",
        }}
      >
        {/* Bulk Action Bar */}
        {selectedRows.length > 0 && bulkActions.length > 0 && (
          <Box
            sx={{
              borderTopLeftRadius: `${theme.shape.borderRadius}px`,
              borderTopRightRadius: `${theme.shape.borderRadius}px`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1.5, sm: 1.5 },
                bgcolor: alpha(theme.palette.secondary.main, 0.06),
                borderBottom: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.12
                )}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
              >
                {selectedRows.length} baris dipilih
              </Typography>
              <Stack direction="row" spacing={1}>
                {bulkActions.map((action, idx) => {
                  const {
                    color = "error",
                    disabled,
                    icon: Icon,
                    label,
                  } = action;

                  return (
                    <Tooltip key={idx} arrow placement="top" title={label}>
                      <Button
                        size="small"
                        color={color}
                        variant="outlined"
                        disabled={disabled}
                        onClick={() => handleBulkActionClick(action)}
                        startIcon={<Icon size={16} strokeWidth={1.5} />}
                        sx={{
                          borderRadius: `${theme.shape.borderRadius}px`,
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.8125rem",
                        }}
                      >
                        {label}
                      </Button>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        )}

        {hasHeader && (
          <>
            <Stack
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: { xs: 2.5, sm: 2 },
                px: { xs: 2.5, sm: 3 },
                py: { xs: 2.5, sm: 2.5 },
              }}
            >
              <Box sx={{ minWidth: 0, width: "100%", flex: { sm: 1 } }}>
                {title && (
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              <Stack
                sx={{
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: { xs: 2, sm: 1.5 },
                  width: { xs: "100%", sm: "auto" },
                  flexShrink: 0,
                }}
              >
                <Stack
                  sx={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: "10px",
                    justifyContent: "flex-end",
                    order: { xs: 1, sm: 2 },
                  }}
                >
                  {headers.length > 0 && (
                    <Tooltip arrow placement="top" title="Atur Kolom">
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          borderRadius: `${theme.shape.borderRadius}px`,
                          border: "1px solid",
                          borderColor: Boolean(colToggleAnchor)
                            ? alpha(theme.palette.secondary.main, 0.4)
                            : alpha(theme.palette.divider, 0.8),
                          color: Boolean(colToggleAnchor)
                            ? theme.palette.secondary.main
                            : theme.palette.text.secondary,
                          bgcolor: Boolean(colToggleAnchor)
                            ? alpha(theme.palette.secondary.main, 0.08)
                            : "transparent",
                          transition: theme.transitions.create([
                            "background-color",
                            "border-color",
                            "color",
                          ]),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.secondary.main, 0.08),
                            borderColor: alpha(
                              theme.palette.secondary.main,
                              0.4
                            ),
                            color: theme.palette.secondary.main,
                          },
                        }}
                      >
                        <IconButton
                          onClick={handleOpenColToggle}
                          size="small"
                          aria-label="Toggle Columns"
                          sx={{
                            borderRadius: "inherit",
                            minWidth: 38,
                            minHeight: 38,
                            p: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Columns size={18} strokeWidth={1.5} />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  )}
                  {actionButtons}
                </Stack>

                {onSearchChange && (
                  <Box
                    sx={{
                      order: { xs: 2, sm: 1 },
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={searchVal || ""}
                      onChange={onSearchChange}
                      placeholder={searchPlaceholder}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 32,
                                height: 26,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                bgcolor: alpha(
                                  theme.palette.secondary.main,
                                  0.08
                                ),
                                color: theme.palette.secondary.main,
                                mr: 1,
                              }}
                            >
                              <Search size={15} strokeWidth={1.5} />
                            </Box>
                          ),
                        },
                      }}
                      sx={{
                        minWidth: { sm: 240 },
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </Stack>
            <Divider />
          </>
        )}

        <TableContainer
          ref={tableContainerRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          sx={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            outline: "none",
          }}
        >
          <Table sx={{ minWidth: { xs: "100%", sm: minWidth } }}>
            <TableHead>{renderedHeaders}</TableHead>
            <TableBody>
              {isLoading ? renderedSkeletons : renderedRows}
            </TableBody>
          </Table>
        </TableContainer>

        {(isLoading || count > 1) && (
          <>
            <Divider />
            <Stack
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: { xs: 2, sm: 2 },
                px: { xs: 2.5, sm: 3 },
                py: { xs: 2.5, sm: 2 },
              }}
            >
              <Box
                sx={{
                  order: { xs: 2, sm: 1 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {onRowsPerPageChange && !hideRowsPerPage && (
                  <Stack
                    sx={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: { xs: "center", sm: "flex-start" },
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap", fontWeight: 500 }}
                    >
                      Baris per halaman
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={rowsPerPage}
                      onChange={(e) =>
                        onRowsPerPageChange(Number(e.target.value))
                      }
                      slotProps={{ select: { native: true } }}
                      sx={{
                        minWidth: 85,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                        "& .MuiInputBase-root": {
                          fontSize: "0.875rem",
                          bgcolor: theme.palette.background.paper,
                        },
                        "& .MuiNativeSelect-select": {
                          py: { xs: 0.75, sm: 0.5 },
                          pl: 1.5,
                          pr: 3,
                        },
                      }}
                    >
                      {rowsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>
                  </Stack>
                )}
              </Box>

              <Box
                sx={{
                  order: { xs: 1, sm: 2 },
                  width: { xs: "100%", sm: "auto" },
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-end" },
                }}
              >
                {isLoading ? (
                  <Skeleton
                    height={36}
                    variant="rounded"
                    width={isMobile ? 240 : 300}
                    sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
                  />
                ) : (
                  <Pagination
                    count={count}
                    page={page}
                    onChange={onChange}
                    showFirstButton={!isMobile}
                    showLastButton={!isMobile}
                    shape="rounded"
                    size={isMobile ? "medium" : "small"}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={1}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontSize: "0.875rem",
                        minWidth: { xs: 36, sm: 32 },
                        height: { xs: 36, sm: 32 },
                        borderRadius: `${theme.shape.borderRadius}px`,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.text.secondary,
                        transition: theme.transitions.create(
                          [
                            "background-color",
                            "border-color",
                            "color",
                            "box-shadow",
                          ],
                          { duration: theme.transitions.duration.shorter }
                        ),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.secondary.main, 0.06),
                          borderColor: alpha(theme.palette.secondary.main, 0.4),
                          color: theme.palette.secondary.main,
                        },
                        "&.Mui-selected": {
                          bgcolor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          borderColor: theme.palette.secondary.main,
                          fontWeight: 600,
                          boxShadow: `0 2px 8px ${alpha(
                            theme.palette.secondary.main,
                            0.3
                          )}`,
                          "&:hover": {
                            bgcolor: theme.palette.secondary.dark,
                          },
                        },
                      },
                      "& .MuiPaginationItem-ellipsis": {
                        border: "none",
                        bgcolor: "transparent",
                        "&:hover": { bgcolor: "transparent" },
                      },
                      "& .MuiPagination-ul": { gap: { xs: 1, sm: 0.5 } },
                    }}
                  />
                )}
              </Box>
            </Stack>
          </>
        )}

        <Popover
          open={Boolean(colToggleAnchor)}
          anchorEl={colToggleAnchor}
          onClose={handleCloseColToggle}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )}`,
                boxShadow: `0 4px 20px ${alpha(
                  theme.palette.secondary.main,
                  0.12
                )}`,
                minWidth: 180,
                py: 2,
              },
            },
          }}
        >
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Tampilkan Kolom
            </Typography>
          </Box>
          <MenuList dense>
            {headers.map((header, idx) => (
              <MenuItem
                key={idx}
                onClick={() => toggleColumnVisibility(idx)}
                sx={{
                  borderRadius: `${theme.shape.borderRadius}px`,
                  mx: 1,
                  px: 1,
                }}
              >
                <Checkbox
                  size="small"
                  checked={!hiddenColumns.has(idx)}
                  disableRipple
                  sx={{ p: 0.5, mr: 1 }}
                />
                <ListItemText
                  slotProps={{
                    primary: { fontSize: "0.875rem" },
                  }}
                >
                  {header}
                </ListItemText>
              </MenuItem>
            ))}
          </MenuList>
        </Popover>

        <Popover
          open={Boolean(contextMenu)}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
          slotProps={{
            paper: {
              sx: {
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )}`,
                boxShadow: `0 4px 20px ${alpha(
                  theme.palette.secondary.main,
                  0.12
                )}`,
                minWidth: 160,
                py: 0.5,
              },
            },
          }}
        >
          <MenuList dense>
            <MenuItem
              onClick={handleCopyCell}
              disabled={!contextMenu?.cellText}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Copy size={16} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              >
                Salin Sel
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={handleCopyRow}
              disabled={!contextMenu?.rowText}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Rows size={16} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              >
                Salin Baris
              </ListItemText>
            </MenuItem>
          </MenuList>
        </Popover>

        {/* Stacked Snackbars */}
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 9999,
            display: "flex",
            flexDirection: "column-reverse",
            pointerEvents: "none",
          }}
        >
          <AnimatePresence>
            {snackbarQueue.map((snack, index) => {
              const isTop = index === snackbarQueue.length - 1;
              const stackedIndex = snackbarQueue.length - 1 - index;

              return (
                <Box
                  key={snack.id}
                  component={motion.div}
                  custom={stackedIndex}
                  variants={stackedSnackbarVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  sx={{
                    position: "absolute",
                    bottom: stackedIndex * 10,
                    right: stackedIndex * 6,
                    pointerEvents: "auto",
                    zIndex: 100 - stackedIndex,
                  }}
                >
                  <Alert
                    severity="success"
                    variant="standard"
                    action={
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => removeSnackbar(snack.id)}
                        sx={{
                          opacity: 0.6,
                          "&:hover": { opacity: 1 },
                          ml: 1,
                        }}
                      >
                        <X size={14} strokeWidth={2} />
                      </IconButton>
                    }
                    sx={{
                      minWidth: { xs: 280, sm: 340 },
                      borderRadius: `${theme.shape.borderRadius}px`,
                      boxShadow: `0 8px 32px ${alpha(
                        theme.palette.common.black,
                        0.12
                      )}`,
                      border: "1px solid",
                      borderColor: alpha(theme.palette.success.main, 0.15),
                      bgcolor: theme.palette.background.paper,
                      color: "text.primary",
                      alignItems: "center",
                      opacity: isTop ? 1 : 0.85 - stackedIndex * 0.1,
                      "& .MuiAlert-icon": {
                        color: theme.palette.success.main,
                        opacity: 0.9,
                        alignItems: "center",
                        pt: 0,
                      },
                      "& .MuiAlert-message": {
                        flex: 1,
                        fontWeight: 500,
                        fontSize: "0.875rem",
                      },
                    }}
                  >
                    Teks berhasil disalin ke clipboard
                  </Alert>
                </Box>
              );
            })}
          </AnimatePresence>
        </Box>
      </Card>
    );
  }
);

AppTable.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.string,
      disabled: PropTypes.bool,
      hasTransitions: PropTypes.bool,
      icon: PropTypes.elementType.isRequired,
      isBulkAction: PropTypes.bool,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
    })
  ),
  count: PropTypes.number,
  data: PropTypes.arrayOf(PropTypes.object),
  emptyStateMessage: PropTypes.string,
  enableMultiSelect: PropTypes.bool,
  headers: PropTypes.arrayOf(PropTypes.string),
  hideRowsPerPage: PropTypes.bool,
  isLoading: PropTypes.bool,
  minWidth: PropTypes.number,
  onChange: PropTypes.func,
  onRowClick: PropTypes.func,
  onRowDoubleClick: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  onSearchChange: PropTypes.func,
  onSelectionChange: PropTypes.func,
  page: PropTypes.number,
  renderExpandableRow: PropTypes.func,
  renderRow: PropTypes.func,
  rowsPerPage: PropTypes.number,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  rowsSkeletonCount: PropTypes.number,
  searchPlaceholder: PropTypes.string,
  searchVal: PropTypes.string,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedRows: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  snackbarProps: PropTypes.shape({
    duration: PropTypes.number,
    maxStack: PropTypes.number,
    position: PropTypes.oneOf(["right", "left"]),
  }),
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default AppTable;
