import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Collapse, IconButton, Box, Button, TableSortLabel, CircularProgress, TablePagination, Typography } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import StatusIcon from './StatusIcon';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { formatCellValue } from '../utils/statusStyles';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Sortable column header component
const SortableColumnHeader = ({ column, active, direction, onSort, id }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'left',
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
    borderRadius: '4px',
    width: '100%',
    position: 'relative',
    zIndex: isDragging ? 1000 : 1,
  };
  
  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {onSort ? (
        <TableSortLabel
          active={active}
          direction={direction}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag when clicking sort
            onSort(column.field);
          }}
        >
          {column.headerName}
        </TableSortLabel>
      ) : (
        column.headerName
      )}
    </Box>
  );
};

const TableComponent = ({
  data,
  columns,
  onRowClick,
  renderExpandedContent,
  rowHeight = 35,
  headerHeight = 35,
  columnHeight,
  backgroundColor = "#ffffff",
  headerBackgroundColor = "#f5f5f5",
  headerTextColor = "#333333",
  cellTextColor = "#555555",
  cellPadding = "8px",
  cellPaddingLeft = "16px",
  headerPadding = "8px",
  nestedTableStyle = {},
  disableDropdown = false,
  noShadow = false,
  noRounding = false,
  noMargin = false,
  marginBottom = '0px',
  stickyHeader = false,
  sortable = false,
  loading = false,
  showHeaders = true,
  enableExport = false,
  exportFileName = 'table_data',
  pagination = false,
  page = 0,
  rowsPerPage = 50,
  onPageChange = null,
  onRowsPerPageChange = null,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  setSelectedUnitForNotes,
  onNoteClick,
  tableId = 'default-table',
  customCellRenderers = {},
  cellStyleOverride = null,
  order,
  orderBy,
  onRequestSort,
}) => {
  // State for column ordering
  const [columnOrder, setColumnOrder] = useState(() => {
    // Try to load from localStorage
    const savedOrder = localStorage.getItem(`table-columns-${tableId}`);
    if (savedOrder) {
      try {
        return JSON.parse(savedOrder);
      } catch (e) {
        console.error('Error parsing saved column order', e);
      }
    }
    // Default to original column order
    return columns.map(col => col.field);
  });

  // Reorder columns based on saved order
  const orderedColumns = useMemo(() => {
    const columnsMap = new Map(columns.map(col => [col.field, col]));
    return columnOrder
      .filter(field => columnsMap.has(field)) // Only include fields that exist in columns
      .map(field => columnsMap.get(field));
  }, [columns, columnOrder]);

  // Add any new columns that weren't in the saved order
  useEffect(() => {
    const existingFields = new Set(columnOrder);
    const allFields = columns.map(col => col.field);
    const newFields = allFields.filter(field => !existingFields.has(field));
    
    if (newFields.length > 0) {
      const updatedOrder = [...columnOrder, ...newFields];
      setColumnOrder(updatedOrder);
      localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(updatedOrder));
    }
  }, [columns, columnOrder, tableId]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handle column reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id);
      const newIndex = columnOrder.indexOf(over.id);
      
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id);
      
      setColumnOrder(newOrder);
      localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(newOrder));
    }
  };

  const [openRow, setOpenRow] = useState(null);
  const [tableWidth] = useState('100%');
  
  // Internal sorting state (used if not controlled from parent)
  const [internalOrder, setInternalOrder] = useState('asc');
  const [internalOrderBy, setInternalOrderBy] = useState('');
  
  // Use either controlled or internal sorting state
  const currentOrder = order || internalOrder;
  const currentOrderBy = orderBy || internalOrderBy;
  
  // Internal pagination state (used if not controlled from parent)
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(50);

  // Use either controlled or internal pagination state
  const currentPage = onPageChange ? page : internalPage;
  const currentRowsPerPage = onRowsPerPageChange ? rowsPerPage : internalRowsPerPage;

  const parseDate = (dateString) => {
    if (!dateString || dateString === '-' || dateString === 'null') {
      return null;
    }
    
    // Handle different possible date formats
    if (typeof dateString === 'string') {
      // If it's a standard ISO date string with T separator
      if (dateString.includes('T')) {
        const [datePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        
        // Validate the date parts
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return null;
        }
        
        return new Date(year, month - 1, day);
      } 
      // If it's just a date string without time (YYYY-MM-DD)
      else if (dateString.includes('-') && dateString.split('-').length === 3) {
        const [year, month, day] = dateString.split('-').map(Number);
        
        // Validate the date parts
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return null;
        }
        
        return new Date(year, month - 1, day);
      }
      // If it's in MM/DD/YY or MM/DD/YYYY format
      else if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          let [month, day, year] = parts.map(Number);
          
          // Handle 2-digit years
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          
          // Validate the date parts
          if (isNaN(month) || isNaN(day) || isNaN(year)) {
            return null;
          }
          
          return new Date(year, month - 1, day);
        }
      }
    }
    
    // Fallback to standard Date parsing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const sortedData = React.useMemo(() => {
    if (!sortable || !currentOrderBy) return data;
    // Inline sortData logic here
    return [...data].sort((a, b) => {
      let aValue = a[currentOrderBy];
      let bValue = b[currentOrderBy];
      
      // Handle empty values
      if (!aValue && !bValue) return 0;
      if (!aValue) return currentOrder === 'asc' ? -1 : 1;
      if (!bValue) return currentOrder === 'asc' ? 1 : -1;
      
      // Get column definition to determine type
      const colDef = columns.find(col => col.field === currentOrderBy);
      const type = colDef ? colDef.type : 'text';
      
      // Handle different data types
      if (type === 'date') {
        const dateA = parseDate(aValue);
        const dateB = parseDate(bValue);
        
        // Handle null dates
        if (!dateA && !dateB) return 0;
        if (!dateA) return currentOrder === 'asc' ? -1 : 1;
        if (!dateB) return currentOrder === 'asc' ? 1 : -1;
        
        return currentOrder === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      } 
      else if (type === 'number' || type === 'currency') {
        // Convert to numbers for numeric comparison
        const numA = parseFloat(aValue) || 0;
        const numB = parseFloat(bValue) || 0;
        return currentOrder === 'asc' ? numA - numB : numB - numA;
      } 
      else {
        // Default string comparison
        const valueA = String(aValue).toLowerCase();
        const valueB = String(bValue).toLowerCase();
        return currentOrder === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
    });
  }, [data, currentOrder, currentOrderBy, sortable, columns]);

  // Apply pagination to data if enabled
  const displayData = React.useMemo(() => {
    if (!pagination || !sortedData) return sortedData;
    return sortedData.slice(currentPage * currentRowsPerPage, currentPage * currentRowsPerPage + currentRowsPerPage);
  }, [sortedData, currentPage, currentRowsPerPage, pagination]);

  // CSV Export function
  const exportToCSV = () => {
    // Get headers from columns
    const headers = orderedColumns.map(col => col.headerName || col.field);
    
    // Convert data to CSV format
    const csvData = data.map(row => 
      orderedColumns.map(col => {
        let value = row[col.field];
        
        // Handle different data types for CSV
        if (value === null || value === undefined) {
          return '';
        }
        
        // Convert to string and escape quotes
        value = String(value).replace(/"/g, '""');
        
        // Wrap in quotes if contains comma, newline, or quote
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value}"`;
        }
        
        return value;
      })
    );
    
    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCellContent = (type, value, row, renderCell) => {
    if (renderCell) {
      return renderCell(row);
    }

    if (type === 'notes') {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onNoteClick) {
              onNoteClick({
                unitId: row.unit_id,
                unitNumber: row.unit,
                propertyName: row.address
              });
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 1,
            minWidth: 'fit-content'
          }}>
            <ChatBubbleOutlineIcon 
              fontSize="small" 
              color="primary" 
              sx={{ mr: 0.5 }} 
            />
          </Box>
          <Box sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            fontSize: '0.8rem'
          }}>
            {row.most_recent_note ? (
              <>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.creator_full_name || 'User'}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.most_recent_note}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Add note
              </Typography>
            )}
          </Box>
        </Box>
      );
    }
    if (value === null || value === undefined) {
      return '-';
    }
    switch (type) {
      case 'text':
        return value;
      case 'email':
        return <a href={`mailto:${value}`}>{value}</a>;
      case 'date':
        return formatCellValue(value, 'date');
      case 'currency':
        return formatCellValue(value, 'currency');
      case 'tagList':
        const parsedValue = JSON.parse(value);
        return (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: '0px',
              maxHeight: '40px',
              overflow: 'hidden',
            }}
          >
            {Object.entries(parsedValue).map(([key, val]) => {
              let chipLabel = `${key}: ${val}`;
              let chipIcon = null;
              let chipColor = 'default';
              let chipStyle = {};

              switch (key.toLowerCase()) {
                case 'beds':
                  chipLabel = val;
                  chipIcon = <BedIcon fontSize="inherit" sx={{ fontSize: '0.8rem' }} />;
                  chipStyle = { backgroundColor: '#ffcccc', color: '#444' }; // Light pastel red
                  break;
                case 'baths':
                  chipLabel = val;
                  chipIcon = <BathtubIcon fontSize="inherit" sx={{ fontSize: '0.8rem' }} />;
                  chipStyle = { backgroundColor: '#cceeff', color: '#444' }; // Light pastel blue
                  break;
                case 'budget':
                  chipLabel = `$${parseFloat(val).toLocaleString('en-US')}`;
                  chipColor = 'success';
                  chipStyle = { backgroundColor: '#ccffcc', color: '#444' }; // Light pastel green
                  break;
                case 'neighborhood':
                  chipLabel = val;
                  chipColor = 'warning';
                  chipStyle = { backgroundColor: '#ffebcc', color: '#444' }; // Light pastel orange
                  break;
                default:
                  break;
              }

              return (
                <Chip
                  key={key}
                  label={chipLabel}
                  icon={chipIcon}
                  sx={{
                    fontSize: '0.75rem',
                    padding: '0px',
                    height: 'auto',
                    margin: '1px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    ...chipStyle,
                  }}
                  color={chipColor}
                />
              );
            })}
          </Box>
        );
      case 'send_status':
        return <StatusIcon status={value} />;
      case 'button':
        if (value && value.label && value.action) {
          return (
            <Button
              variant="contained"
              fullWidth
              onClick={() => value.action(row)}
              sx={{ height: '100%' }}
            >
              {value.label}
            </Button>
          );
        }
        return null;
      case 'iconButton':
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (value && value.action) value.action(row);
            }}
            sx={{
              padding: '4px',
              minWidth: 0,
              minHeight: 0,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#e0e0e0',
              '&:hover': { background: '#bdbdbd' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleOutlineIcon fontSize="small" />
          </IconButton>
        );
      case 'badge':
        const formattedBadge = formatCellValue(value, 'badge');
        if (formattedBadge === '-') return '-';
        
        return (
          <Chip
            label={formattedBadge.props.label}
            sx={{
              ...formattedBadge.props.style,
              height: '24px',
              maxHeight: '24px',
              '& .MuiChip-label': {
                padding: '0 8px',
                lineHeight: '24px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
        );
      case 'number':
        return formatCellValue(value, 'number');
      case 'percentage_change':
        const formattedPercentage = formatCellValue(value, 'percentage_change');
        if (typeof formattedPercentage === 'object' && formattedPercentage.component === 'span') {
          return (
            <span style={formattedPercentage.props.style}>
              {formattedPercentage.props.children}
            </span>
          );
        }
        return formattedPercentage;
      case 'current_deal_indicator':
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            {value === 1 || value === true ? (
              <CheckCircleIcon 
                sx={{ 
                  color: '#4CAF50', 
                  fontSize: '16px',
                  opacity: 0.8
                }} 
              />
            ) : null}
          </Box>
        );
      default:
        return value;
    }
  };

  const handleRowClick = (index, row) => {
    if (!disableDropdown) {
      setOpenRow(openRow === index ? null : index);
    }
    if (onRowClick) {
      onRowClick(index, row);
    }
  };

  const handleRequestSort = (property) => {
    if (onRequestSort) {
      // Use parent's sort handler if provided
      onRequestSort(property);
    } else {
      // Use internal sort state if no parent handler
      const isAsc = currentOrderBy === property && currentOrder === 'asc';
      setInternalOrder(isAsc ? 'desc' : 'asc');
      setInternalOrderBy(property);
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    if (onPageChange) {
      onPageChange(event, newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(event);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <TableContainer
        component={Paper}
        sx={{
          width: tableWidth,
          flex: 1,
          backgroundColor,
          margin: noMargin ? 0 : '0px',
          marginBottom: pagination ? 0 : marginBottom,
          boxShadow: noShadow ? 'none' : undefined,
          borderRadius: noRounding ? 0 : undefined,
          padding: 0,
          overflow: 'auto',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader={stickyHeader}>
            {showHeaders && (
              <TableHead>
                <TableRow style={{ 
                  backgroundColor: headerBackgroundColor, 
                  height: `${headerHeight}px`,
                  maxHeight: `${headerHeight}px`,
                  minHeight: `${headerHeight}px`
                }}>
                  {!disableDropdown && <TableCell style={{ backgroundColor: headerBackgroundColor, padding: 0 }} />}
                  <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToHorizontalAxis]}
                  >
                    <SortableContext 
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {orderedColumns.map((col) => (
                        <TableCell
                          key={col.field}
                          style={{
                            color: headerTextColor,
                            backgroundColor: headerBackgroundColor,
                            padding: headerPadding,
                            paddingLeft: disableDropdown ? (col.reduceLeftPadding ? '2px' : '8px') : cellPaddingLeft,
                            paddingRight: col.reduceRightPadding ? '2px' : '8px',
                            minWidth: col.minWidth || '50px',
                            maxWidth: col.maxWidth || '200px',
                            overflow: 'hidden',
                            textOverflow: 'clip',
                            whiteSpace: 'normal',
                            textAlign: 'left',
                            height: `${headerHeight}px`,
                            maxHeight: `${headerHeight}px`,
                            minHeight: `${headerHeight}px`,
                            verticalAlign: 'top',
                            lineHeight: '1.1',
                          }}
                        >
                          <div style={{
                            height: '100%',
                            maxHeight: `${headerHeight - 16}px`,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            lineHeight: '1.1',
                          }}>
                            <SortableColumnHeader
                              column={col}
                              id={col.field}
                              active={currentOrderBy === col.field}
                              direction={currentOrderBy === col.field ? currentOrder : 'asc'}
                              onSort={sortable ? handleRequestSort : null}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </SortableContext>
                  </DndContext>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={orderedColumns.length + (!disableDropdown ? 1 : 0)} align="center" style={{ color: '#888', fontStyle: 'italic' }}>
                    No data available.
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row, index) => (
                  <React.Fragment key={index}>
                    <TableRow
                      onClick={() => handleRowClick(index, row)}
                      style={{
                        height: rowHeight ? `${rowHeight}px` : undefined,
                        maxHeight: rowHeight ? `${rowHeight}px` : undefined,
                        minHeight: rowHeight ? `${rowHeight}px` : undefined,
                        backgroundColor,
                        boxSizing: 'border-box',
                      }}
                    >
                      {!disableDropdown && (
                        <TableCell style={{ padding: 0 }}>
                          <IconButton size="small">
                            {openRow === index ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                      )}
                      {orderedColumns.map((col) => {
                        // Check if custom renderer returns styling info
                        let cellContent, customCellStyleOverride;
                        if (customCellRenderers && customCellRenderers[col.field]) {
                          const renderResult = customCellRenderers[col.field](row[col.field], row);
                          if (renderResult && typeof renderResult === 'object' && renderResult.cellStyle) {
                            cellContent = renderResult.content;
                            customCellStyleOverride = renderResult.cellStyle;
                          } else {
                            cellContent = renderResult;
                          }
                        }

                        // Apply cell style override from prop
                        const propCellStyleOverride = cellStyleOverride && cellStyleOverride(col.field, col.type, row[col.field]);
                        
                        return (
                          <TableCell
                            key={col.field}
                            style={{
                              padding: col.type === 'iconButton' ? '0px' : (col.type === 'notes' ? '4px 8px' : cellPadding || '2px 4px'),
                              paddingLeft: col.reduceLeftPadding ? '0px' : cellPaddingLeft,
                              paddingRight: col.reduceRightPadding ? '0px' : undefined,
                              color: col.color || cellTextColor,
                              minWidth: col.minWidth || '50px',
                              maxWidth: col.maxWidth || '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'left',
                              backgroundColor: col.backgroundColor || 'inherit',
                              fontSize: col.fontSize || 'inherit',
                              height: rowHeight ? `${rowHeight}px` : undefined,
                              maxHeight: rowHeight ? `${rowHeight}px` : undefined,
                              lineHeight: col.type === 'notes' ? 'normal' : (rowHeight ? `${rowHeight - 8}px` : undefined),
                              // Apply custom cell styling if provided by custom renderer
                              ...(customCellStyleOverride || {}),
                              // Apply cell style override from prop (takes precedence)
                              ...(propCellStyleOverride || {})
                            }}
                            onClick={
                              customCellRenderers && customCellRenderers[col.field]
                                ? undefined // Don't attach row click to this cell
                                : () => onRowClick(index, row)
                            }
                          >
                            <div style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: col.type === 'notes' ? 'normal' : 'nowrap',
                              maxHeight: rowHeight ? `${rowHeight - 4}px` : undefined,
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%'
                            }}>
                              {customCellRenderers && customCellRenderers[col.field] ? (
                                cellContent !== undefined ? cellContent : customCellRenderers[col.field](row[col.field], row)
                              ) : col.type === 'button' ? (
                                <Button
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    col.action(row);
                                  }}
                                  sx={col.buttonStyle}
                                >
                                  {col.label}
                                </Button>
                              ) : (
                                renderCellContent(col.type, row[col.field], row, col.renderCell)
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {!disableDropdown && (
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 0, paddingRight: 0 }} colSpan={orderedColumns.length + 1}>
                          <Collapse in={openRow === index} timeout="auto" unmountOnExit>
                            <Box margin={0} sx={{ ...nestedTableStyle, padding: 0 }}>
                              {renderExpandedContent ? renderExpandedContent(row) : <p>No additional content</p>}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      
      {(pagination || enableExport) && (
        <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
          {enableExport && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<GetAppIcon />}
              onClick={exportToCSV}
              sx={{ mr: 2 }}
            >
              Export CSV
            </Button>
          )}
          
          {pagination && (
            <TablePagination
              component="div"
              count={sortedData.length}
              page={currentPage}
              onPageChange={handleChangePage}
              rowsPerPage={currentRowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={rowsPerPageOptions}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default TableComponent;
