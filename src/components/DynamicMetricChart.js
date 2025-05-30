import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, Typography, Box, FormControl, Select, MenuItem, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material';
import { Bar, Pie, Line, Scatter } from 'react-chartjs-2';
import { getGroupedMetricChartData, getDealStatusDistributionByUnitStatus, getUniqueUnitStatuses } from '../utils/metricCalculations';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ApartmentIcon from '@mui/icons-material/Apartment';

// Import Chart.js and register datalabels plugin
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Tooltip as ChartTooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  ChartTooltip,
  Filler
);

const underlineStyle = {
  borderBottom: '2px solid #1976d2',
  fontWeight: 500,
  fontSize: '1em',
  background: 'none',
  border: 'none',
  display: 'inline-block',
  verticalAlign: 'middle',
  margin: 0,
  padding: 0,
};

// Match the exact colors from MetricCard
const PIE_COLORS = [
  '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#ffeb3b', '#607d8b', '#795548', '#bdbdbd'
];

const metricLabels = {
  'avg_price_per_sqft': 'Price per Sqft',
  'days_on_market': 'Days on Market',
  'gross': 'Gross',
  'actual_rent': 'Actual Rent',
  'unit_status': 'Unit Status',
  'deal_status': 'Deal Status'
};

// Simplified metric options - only allow specific metrics
const getMetricOptions = () => {
  return ['avg_price_per_sqft', 'days_on_market', 'gross', 'actual_rent'];
};

// Get category options for x-axis
const getCategoryOptions = () => {
  return ['unit_status', 'deal_status'];
};

// Format values based on metric type
const formatValue = (value, metric) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  if (metric === 'avg_price_per_sqft') {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sqft`;
  } else if (metric === 'gross' || metric === 'actual_rent') {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else if (metric === 'days_on_market') {
    return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} days`;
  }
  return String(value);
};

const DynamicMetricChart = ({
  data,
  filters = {},
  setFilters,
  maxValue,
  cardTitle = "Dynamic Metric Chart",
  backgroundColor = "#fff",
  icon = null,
  iconColor = "#1976d2",
  chartType = "bar", // "bar" or "pie"
  filterType = "sentence", // "sentence" or "dropdown"
  maxLabels = 5,
  address = null, // New prop for address
  unit = null     // New prop for unit
}) => {
  // For bar chart mode
  const [x_metric, setXMetric] = useState('days_on_market');
  const [y_metric, setYMetric] = useState('avg_price_per_sqft');
  const [chartStyle, setChartStyle] = useState('bar'); // 'bar', 'line', or 'scatter'

  // Use the simplified metric options
  const metricOptions = useMemo(() => getMetricOptions(), []);
  const categoryOptions = useMemo(() => getCategoryOptions(), []);
  
  // Determine if x_metric is a category
  const isXCategory = useMemo(() => categoryOptions.includes(x_metric), [x_metric, categoryOptions]);

  // Get chart data with error handling
  const chartData = useMemo(() => {
    try {
      return getGroupedMetricChartData(data, filters, x_metric, y_metric, maxValue, chartStyle);
    } catch (error) {
      console.error("Error generating chart data:", error);
      return {
        labels: [],
        datasets: [
          {
            label: `${y_metric} by ${x_metric}`,
            data: [],
            backgroundColor: '#1976d2',
          }
        ],
        rawData: []
      };
    }
  }, [data, filters, x_metric, y_metric, maxValue, chartStyle]);

  // Check if we have valid data to display
  const hasValidData = useMemo(() => {
    if (!chartData || !chartData.datasets || !chartData.datasets[0]) return false;
    
    // For scatter plots with raw data
    if (chartStyle === 'scatter' && chartData.rawData && chartData.rawData.length > 0) {
      return true;
    }
    
    // For line charts with raw data (non-category x-axis)
    if (chartStyle === 'line' && !isXCategory && chartData.rawData && chartData.rawData.length > 0) {
      return true;
    }
    
    // For regular charts
    return chartData.labels && 
           chartData.labels.length > 0 && 
           chartData.datasets[0].data && 
           chartData.datasets[0].data.some(val => val !== null);
  }, [chartData, chartStyle, isXCategory]);

  // For pie chart mode
  const unit_status_options = useMemo(() => getUniqueUnitStatuses(data), [data]);
  const [selected_unit_status, setSelectedUnitStatus] = useState(unit_status_options[0] || '');

  // Get and sort deal status data
  const deal_status_data = useMemo(() => {
    const arr = getDealStatusDistributionByUnitStatus(data, selected_unit_status);
    // Sort descending by value
    return arr.sort((a, b) => b.value - a.value);
  }, [data, selected_unit_status]);

  return (
    <Card sx={{ backgroundColor, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Card Header with Title and Location Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && (
              <Box sx={{ mr: 1, color: iconColor }}>
                {icon}
              </Box>
            )}
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {cardTitle}
            </Typography>
          </Box>
          
          {/* Address and Unit Information */}
          {(address || unit) && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {address && (
                <Chip
                  icon={<LocationOnIcon />}
                  label={address}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                    color: 'primary.main',
                    '& .MuiChip-icon': { color: 'primary.main' }
                  }}
                />
              )}
              {unit && (
                <Chip
                  icon={<ApartmentIcon />}
                  label={`Unit ${unit}`}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                    color: 'success.main',
                    '& .MuiChip-icon': { color: 'success.main' }
                  }}
                />
              )}
            </Box>
          )}
        </Box>
        
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {chartType === 'bar' ? (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Chart Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={x_metric}
                      onChange={(e) => setXMetric(e.target.value)}
                      size="small"
                    >
                      {/* Show all metrics equally without section headers */}
                      {metricOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {metricLabels[option] || option}
                        </MenuItem>
                      ))}
                      {categoryOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {metricLabels[option] || option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Typography variant="body2" color="text.secondary">vs</Typography>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={y_metric}
                      onChange={(e) => setYMetric(e.target.value)}
                      size="small"
                    >
                      {/* Only numeric options for y-axis */}
                      {metricOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {metricLabels[option] || option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Chart Type Selector */}
                <ToggleButtonGroup
                  value={chartStyle}
                  exclusive
                  onChange={(e, newValue) => {
                    if (newValue !== null) {
                      setChartStyle(newValue);
                    }
                  }}
                  size="small"
                  aria-label="chart type"
                >
                  <ToggleButton value="bar" aria-label="bar chart">
                    <BarChartIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="line" aria-label="line chart">
                    <ShowChartIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="scatter" aria-label="scatter plot">
                    <TimelineIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Box sx={{ flex: 1, minHeight: 200, position: 'relative' }}>
                {hasValidData ? (
                  chartStyle === 'bar' ? (
                    <Bar
                      data={{
                        labels: chartData.labels,
                        datasets: chartData.datasets
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const value = context.raw;
                                return formatValue(value, y_metric);
                              }
                            }
                          }
                        },
                        scales: {
                          x: { 
                            title: { display: true, text: metricLabels[x_metric] || x_metric },
                            type: 'category',
                            ticks: {
                              maxRotation: 45,
                              minRotation: 0
                            }
                          },
                          y: { 
                            title: { display: true, text: metricLabels[y_metric] || y_metric }, 
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatValue(value, y_metric);
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : chartStyle === 'line' ? (
                    <Line
                      data={isXCategory ? {
                        labels: chartData.labels,
                        datasets: chartData.datasets
                      } : {
                        datasets: [{
                          label: `${y_metric} by ${x_metric}`,
                          data: chartData.rawData || [],
                          borderColor: '#1976d2',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          tension: 0.1,
                          fill: true
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                // For raw data points
                                if (context.raw && typeof context.raw === 'object' && 'x' in context.raw && 'y' in context.raw) {
                                  const xValue = formatValue(context.raw.x, x_metric);
                                  const yValue = formatValue(context.raw.y, y_metric);
                                  return `${metricLabels[x_metric] || x_metric}: ${xValue}, ${metricLabels[y_metric] || y_metric}: ${yValue}`;
                                }
                                // For binned data
                                return formatValue(context.raw, y_metric);
                              }
                            }
                          }
                        },
                        scales: {
                          x: { 
                            title: { display: true, text: metricLabels[x_metric] || x_metric },
                            ticks: {
                              callback: function(value) {
                                if (isXCategory) {
                                  return chartData.labels[value];
                                }
                                return formatValue(value, x_metric);
                              }
                            }
                          },
                          y: { 
                            title: { display: true, text: metricLabels[y_metric] || y_metric }, 
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatValue(value, y_metric);
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <Scatter
                      data={{
                        datasets: [{
                          label: `${y_metric} by ${x_metric}`,
                          data: chartData.rawData || [],
                          backgroundColor: '#1976d2',
                          pointRadius: 5,
                          pointHoverRadius: 7
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const xValue = formatValue(context.raw.x, x_metric);
                                const yValue = formatValue(context.raw.y, y_metric);
                                return `${metricLabels[x_metric] || x_metric}: ${xValue}, ${metricLabels[y_metric] || y_metric}: ${yValue}`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: { 
                            title: { display: true, text: metricLabels[x_metric] || x_metric },
                            ticks: {
                              callback: function(value) {
                                return formatValue(value, x_metric);
                              }
                            }
                          },
                          y: { 
                            title: { display: true, text: metricLabels[y_metric] || y_metric }, 
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatValue(value, y_metric);
                              }
                            }
                          }
                        }
                      }}
                    />
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No data available for the selected metrics
                  </Typography>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {deal_status_data.length > 0 ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <Pie
                      data={{
                        labels: deal_status_data.map(item => item.label || 'Unknown'),
                        datasets: [
                          {
                            data: deal_status_data.map(item => item.value),
                            backgroundColor: PIE_COLORS,
                            borderWidth: 1
                          }
                        ]
                      }}
                      options={{
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              boxWidth: 15,
                              padding: 10,
                              font: {
                                size: 11
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || 'Unknown';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DynamicMetricChart;