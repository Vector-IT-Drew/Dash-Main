import React, { useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Modal,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import MiniChart from "./MiniChart";
import SettingsIcon from "@mui/icons-material/Settings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

// Simple data processing utility
function processData(rawData, colTypes = {}) {
  console.log('processData called with:', { 
    dataLength: rawData?.length, 
    colTypes: Object.keys(colTypes).length > 0 ? colTypes : 'EMPTY' 
  });
  
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return { 
      data: [], 
      fields: { numeric: [], date: [], text: [], all: [] }, 
      types: {} 
    };
  }
  
  const sample = rawData[0];
  const fields = { numeric: [], date: [], text: [], all: Object.keys(sample) };
  const types = {};
  
  console.log('🔍 Sample data keys:', Object.keys(sample));
  console.log('🔍 Column types received:', colTypes);
  
  // Use provided column types instead of inferring
  Object.keys(sample).forEach(key => {
    const colType = colTypes[key];
    console.log(`🔍 Field "${key}": type="${colType}"`);
    
    if (colType === 'datetime' || colType === 'date') {
      fields.date.push(key);
      types[key] = 'date';
    } else if (colType === 'integer' || colType === 'decimal' || colType === 'number' || colType === 'float') {
      fields.numeric.push(key);
      types[key] = 'number';
    } else {
      fields.text.push(key);
      types[key] = 'text';
    }
  });
  
  console.log('processData result:', {
    dateFields: fields.date,
    numericFields: fields.numeric,
    textFields: fields.text.slice(0, 5),
    totalFields: fields.all.length
  });
  
  return { data: rawData, fields, types };
}

// Calculate metric value
function calculateMetric(data, metric, aggregation, filters = []) {
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  
  // Apply filters first
  let filteredData = data;
  if (filters && filters.length > 0) {
    filteredData = data.filter(row => {
      return filters.every(filter => {
        if (!filter.field || !filter.operator || filter.value === undefined || filter.value === '') return true;
        
        const fieldValue = row[filter.field];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue === filterValue;
          case 'not_equals':
            return fieldValue !== filterValue;
          case 'greater':
            return Number(fieldValue) > Number(filterValue);
          case 'less':
            return Number(fieldValue) < Number(filterValue);
          case 'greater_equal':
            return Number(fieldValue) >= Number(filterValue);
          case 'less_equal':
            return Number(fieldValue) <= Number(filterValue);
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'starts_with':
            return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'ends_with':
            return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'after':
            return new Date(fieldValue) > new Date(filterValue);
          case 'before':
            return new Date(fieldValue) < new Date(filterValue);
          default:
            return true;
        }
      });
    });
  }
  
  if (filteredData.length === 0) return 0;
  
  const values = filteredData.map(row => {
    const val = row[metric];
    return typeof val === 'number' ? val : parseFloat(val) || 0;
  }).filter(val => !isNaN(val));
  
  if (values.length === 0) return 0;
  
  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return filteredData.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// Generate chart data
function getChartData(data, xAxis, yAxis, aggregation, dateRange = 'all', filters = []) {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  // Apply filters first
  let filteredData = data;
  if (filters && filters.length > 0) {
    filteredData = data.filter(row => {
      return filters.every(filter => {
        if (!filter.field || !filter.operator || filter.value === undefined || filter.value === '') return true;
        
        const fieldValue = row[filter.field];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue === filterValue;
          case 'not_equals':
            return fieldValue !== filterValue;
          case 'greater':
            return Number(fieldValue) > Number(filterValue);
          case 'less':
            return Number(fieldValue) < Number(filterValue);
          case 'greater_equal':
            return Number(fieldValue) >= Number(filterValue);
          case 'less_equal':
            return Number(fieldValue) <= Number(filterValue);
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'starts_with':
            return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'ends_with':
            return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'after':
            return new Date(fieldValue) > new Date(filterValue);
          case 'before':
            return new Date(fieldValue) < new Date(filterValue);
          default:
            return true;
        }
      });
    });
  }
  
  // Apply date range filter
  if (dateRange !== 'all' && !isNaN(parseInt(dateRange))) {
    const daysBack = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    filteredData = filteredData.filter(row => {
      const rowDate = new Date(row[xAxis]);
      return rowDate >= cutoffDate;
    });
  }
  
  // Group by date and aggregate
  const grouped = {};
  filteredData.forEach(row => {
    const dateValue = row[xAxis];
    if (!dateValue) return;
    
    const date = new Date(dateValue).toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = [];
    
    const value = row[yAxis];
    if (value !== null && value !== undefined) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue)) {
        grouped[date].push(numValue);
      }
    }
  });
  
  const result = Object.entries(grouped)
    .map(([date, values]) => {
      if (values.length === 0) return null;
      
      let aggregatedValue;
      switch (aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        default:
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
      }
      
      return {
        x: date,
        y: aggregatedValue
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => new Date(a.x) - new Date(b.x));
  
  console.log('🔧 Final chart result:', { 
    points: result.length, 
    sample: result.slice(0, 3),
    dateRange: result.length > 0 ? [result[0].x, result[result.length - 1].x] : []
  });
  
  return result;
}

// Add these helper functions after the existing utility functions
function getFieldType(fieldName, processedData) {
  if (!fieldName || !processedData) return 'text';
  
  if (processedData.fields.numeric.includes(fieldName)) return 'numeric';
  if (processedData.fields.date.includes(fieldName)) return 'date';
  return 'text';
}

function getOperatorsForField(fieldName, processedData) {
  const fieldType = getFieldType(fieldName, processedData);
  
  switch (fieldType) {
    case 'numeric':
      return [
        { value: 'equals', label: '=' },
        { value: 'not_equals', label: '≠' },
        { value: 'greater', label: '>' },
        { value: 'less', label: '<' },
        { value: 'greater_equal', label: '≥' },
        { value: 'less_equal', label: '≤' }
      ];
    case 'date':
      return [
        { value: 'equals', label: '= Equals' },
        { value: 'after', label: '> After' },
        { value: 'before', label: '< Before' }
      ];
    default: // text
      return [
        { value: 'equals', label: '= Equals' },
        { value: 'not_equals', label: '≠ Not Equals' },
        { value: 'contains', label: '⊃ Contains' },
        { value: 'starts_with', label: '⊃ Starts With' },
        { value: 'ends_with', label: '⊂ Ends With' }
      ];
  }
}

// Format number with prefix/suffix and always round to 2 decimal places
function formatValue(value, prefix = '', suffix = '') {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  
  // Always round to 2 decimal places, but don't show decimals if they're .00
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
  
  return `${prefix}${formatted}${suffix}`;
}

export default function MetricCard({
  title = "Metric",
  metric = "",
  aggregation = "sum",
  data = [],
  colTypes = {},
  dataSource = "",
  dataSources = {}, // All available data sources
  onUpdate,
  showChart = false,
  chartXAxis = "",
  dateRange = "all",
  filters = [],
  prefix = "",
  suffix = ""
}) {
  console.log(`🎯 MetricCard "${title}" render started`);
  
  const [modalOpen, setModalOpen] = useState(false);
  const isSavingRef = useRef(false);
  
  // Generate unique key for localStorage
  const storageKey = `metricCard_${title}_${dataSource}_${metric}`;
  
  // Load saved config from localStorage or use props
  const getSavedConfig = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        console.log(`📦 Loaded saved config for "${title}":`, parsedConfig);
        // Always preserve the original title from props
        return {
          ...parsedConfig,
          title: title, // Keep original title
          prefix: prefix || "",
          suffix: suffix || ""
        };
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
    
    // Return default config from props
    return {
      title,
      dataSource,
      metric,
      aggregation,
      showChart,
      chartXAxis,
      dateRange,
      filters: filters || [],
      prefix: prefix || "",
      suffix: suffix || ""
    };
  };
  
  const [config, setConfig] = useState(getSavedConfig);

  console.log(`📊 MetricCard "${title}" state:`, {
    modalOpen,
    configDataSource: config.dataSource,
    configMetric: config.metric,
    configShowChart: config.showChart,
    configChartXAxis: config.chartXAxis,
    dataLength: data.length,
    colTypesCount: Object.keys(colTypes).length
  });

  // Get current data source data and colTypes
  const currentData = dataSources[config.dataSource] || data;
  const currentColTypes = dataSources[`${config.dataSource}_colTypes`] || colTypes;

  // Process data with column types
  const processedData = useMemo(() => {
    console.log(`🔄 Processing data for "${title}"`);
    const result = processData(currentData, currentColTypes);
    console.log(`📈 Processed result for "${title}":`, {
      numericFields: result.fields.numeric,
      dateFields: result.fields.date,
      textFields: result.fields.text.slice(0, 3)
    });
    return result;
  }, [currentData, currentColTypes, title]);

  // Calculate metric value
  const metricValue = useMemo(() => {
    if (!config.metric || !currentData.length) return 0;
    
    console.log(`🧮 Calculating metric for "${title}":`, {
      metric: config.metric,
      aggregation: config.aggregation,
      dataLength: currentData.length,
      filtersCount: config.filters.length
    });
    
    const result = calculateMetric(currentData, config.metric, config.aggregation, config.filters);
    console.log(`📊 Metric result for "${title}":`, result);
    return result;
  }, [currentData, config.metric, config.aggregation, config.filters, title]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!config.showChart || !config.chartXAxis || !config.metric || !currentData.length) {
      console.log(`📊 Skipping chart for "${title}":`, {
        showChart: config.showChart,
        hasXAxis: !!config.chartXAxis,
        hasMetric: !!config.metric,
        hasData: currentData.length > 0
      });
      return [];
    }
    
    console.log(`📈 Generating chart data for "${title}":`, {
      xAxis: config.chartXAxis,
      metric: config.metric,
      dateFields: processedData.fields.date,
      dataLength: currentData.length
    });
    
    const chartResult = getChartData(currentData, config.chartXAxis, config.metric, config.aggregation, config.dateRange, config.filters);
    console.log(`📊 Chart data generated for "${title}":`, {
      dataPoints: chartResult.length,
      sample: chartResult.slice(0, 2),
      sampleKeys: chartResult.length > 0 ? Object.keys(chartResult[0]) : [],
      firstDataPoint: chartResult[0]
    });
    
    return chartResult;
  }, [currentData, config.showChart, config.chartXAxis, config.metric, config.aggregation, config.dateRange, config.filters, processedData.fields.date, title]);

  // Calculate trend for color
  const trend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].y;
    const last = chartData[chartData.length - 1].y;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const handleSave = () => {
    console.log(`💾 Saving config for "${title}":`, config);
    
    // Set saving flag to prevent modal from reopening
    isSavingRef.current = true;
    
    // Save to localStorage but preserve original title
    const configToSave = {
      ...config,
      title: title, // Always save with original title
      prefix: config.prefix || "",
      suffix: config.suffix || ""
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(configToSave));
      console.log(`✅ Config saved to localStorage with key: ${storageKey}`);
    } catch (error) {
      console.error('Error saving config to localStorage:', error);
    }
    
    console.log(`✅ Save completed for "${title}"`);
    
    // Close modal
    setModalOpen(false);
    
    // Reset saving flag after a short delay
    setTimeout(() => {
      isSavingRef.current = false;
    }, 100);
  };

  const handleCancel = () => {
    setConfig(getSavedConfig());
    setModalOpen(false);
  };

  const handleCardClick = () => {
    if (!isSavingRef.current) {
      setModalOpen(true);
    }
  };

  // Get available data source names (excluding _colTypes entries)
  const availableDataSources = Object.keys(dataSources).filter(key => !key.endsWith('_colTypes'));

  console.log(`🎨 Rendering MetricCard "${title}" with:`, {
    value: metricValue,
    hasChart: chartData.length > 0,
    chartPoints: chartData.length
  });

  const addFilter = () => {
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: "", operator: "equals", value: "" }]
    }));
  };
  
  const updateFilter = (index, updates) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => i === index ? { ...filter, ...updates } : filter)
    }));
  };
  
  const removeFilter = (index) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const hasChart = config.showChart && chartData.length > 0;

  // Update the value display section:
  const displayValue = formatValue(metricValue, config.prefix, config.suffix);

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#2a2a2a',
      color: 'white',
      borderRadius: 2,
      cursor: 'pointer'
    }}
    onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ 
            color: '#b0b0b0',
            fontSize: '0.8rem',
            fontWeight: 500,
            lineHeight: 1.2
          }}>
            {config.title}
          </Typography>
          <SettingsIcon sx={{ fontSize: 16, color: '#666', opacity: 0.7 }} />
        </Box>
        
        <Box display="flex" alignItems="flex-start" sx={{ width: '100%' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="div" sx={{ 
              color: 'white',
              fontWeight: 700,
              mb: 0.25,
              fontSize: '1.5rem'
            }}>
              {displayValue}
            </Typography>
            
            {hasChart && trend !== 0 && (
              <Box display="flex" alignItems="center" gap={0.25}>
                {trend > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 14, color: '#f44336' }} />
                )}
                <Typography variant="caption" sx={{ 
                  color: trend > 0 ? '#4caf50' : '#f44336',
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}>
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>

          {hasChart && chartData && chartData.length > 0 && (
            <Box sx={{ 
              flex: 1, 
              height: 40, 
              ml: 1,
              px: 2
            }}>
              <MiniChart 
                data={chartData} 
                xAxis={config.chartXAxis} 
                yAxis={config.metric}
                color={trend > 0 ? '#4caf50' : trend < 0 ? '#f44336' : '#1976d2'}
              />
            </Box>
          )}
        </Box>
      </CardContent>

      <Modal open={modalOpen} onClose={handleCancel}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">Configure Metric Card</Typography>
            <IconButton onClick={handleCancel}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Data Source</InputLabel>
                <Select
                  value={config.dataSource}
                  onChange={(e) => setConfig(prev => ({ ...prev, dataSource: e.target.value }))}
                >
                  {availableDataSources.map(source => (
                    <MenuItem key={source} value={source}>{source}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Metric Field</InputLabel>
                <Select
                  value={config.metric}
                  onChange={(e) => setConfig(prev => ({ ...prev, metric: e.target.value }))}
                  disabled={!config.dataSource}
                >
                  {processedData.fields.numeric.length === 0 && (
                    <MenuItem disabled>No numeric fields available</MenuItem>
                  )}
                  {processedData.fields.numeric.map(field => (
                    <MenuItem key={field} value={field}>{field}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Aggregation</InputLabel>
                <Select
                  value={config.aggregation}
                  onChange={(e) => setConfig(prev => ({ ...prev, aggregation: e.target.value }))}
                >
                  <MenuItem value="sum">Sum</MenuItem>
                  <MenuItem value="avg">Average</MenuItem>
                  <MenuItem value="count">Count</MenuItem>
                  <MenuItem value="min">Minimum</MenuItem>
                  <MenuItem value="max">Maximum</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showChart}
                    onChange={(e) => setConfig(prev => ({ ...prev, showChart: e.target.checked }))}
                  />
                }
                label="Show Chart"
              />
            </Grid>
            
            {config.showChart && (
              <>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Date Field (X-Axis)</InputLabel>
                    <Select
                      value={config.chartXAxis}
                      onChange={(e) => setConfig(prev => ({ ...prev, chartXAxis: e.target.value }))}
                      disabled={!config.dataSource}
                    >
                      {processedData.fields.date.length === 0 && (
                        <MenuItem disabled>No date fields available</MenuItem>
                      )}
                      {processedData.fields.date.map(field => (
                        <MenuItem key={field} value={field}>{field}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={config.dateRange}
                      onChange={(e) => setConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="7">Past Week</MenuItem>
                      <MenuItem value="30">Past Month</MenuItem>
                      <MenuItem value="90">Past 3 Months</MenuItem>
                      <MenuItem value="365">Past Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Filters</Typography>
                <Button startIcon={<AddIcon />} onClick={addFilter}>
                  Add Filter
                </Button>
              </Box>
              
              {config.filters.map((filter, index) => {
                const fieldType = getFieldType(filter.field, processedData);
                const operators = getOperatorsForField(filter.field, processedData);
                
                return (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 3 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Field</InputLabel>
                          <Select
                            value={filter.field}
                            onChange={(e) => updateFilter(index, { 
                              field: e.target.value,
                              operator: 'equals', // Reset operator when field changes
                              value: '' // Reset value when field changes
                            })}
                          >
                            {[...processedData.fields.numeric, ...processedData.fields.text, ...processedData.fields.date].map(field => (
                              <MenuItem key={field} value={field}>{field}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={{ xs: 3 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, { operator: e.target.value })}
                          >
                            {operators.map(op => (
                              <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid size={{ xs: 4 }}>
                        {fieldType === 'numeric' ? (
                          <TextField
                            fullWidth
                            size="small"
                            label="Value"
                            type="number"
                            inputProps={{ step: "any" }}
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: parseFloat(e.target.value) || 0 })}
                          />
                        ) : fieldType === 'date' ? (
                          <TextField
                            fullWidth
                            size="small"
                            label="Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            label="Value"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                          />
                        )}
                      </Grid>
                      
                      <Grid size={{ xs: 2 }}>
                        <IconButton onClick={() => removeFilter(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Prefix</InputLabel>
                <Select
                  value={config.prefix}
                  onChange={(e) => setConfig(prev => ({ ...prev, prefix: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="$">$ (Dollar)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Suffix</InputLabel>
                <Select
                  value={config.suffix}
                  onChange={(e) => setConfig(prev => ({ ...prev, suffix: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value=" days"> days</MenuItem>
                  <MenuItem value="%">%</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
          </Box>
        </Box>
      </Modal>
    </Card>
  );
}