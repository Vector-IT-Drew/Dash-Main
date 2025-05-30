import React from 'react';
import { Box, Card, CardContent, Typography, Tooltip, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
  Tooltip as ChartTooltip,
  Filler,
  ArcElement
} from 'chart.js';

// Register ChartJS components
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

const MetricCard = ({
  title,
  value,
  unit,
  trend,
  description,
  showChart = false,
  chartType = 'doughnut',
  chartData,
  showLegend = false,
  loading = false,
  iconColor = '#4CAF50',
  backgroundColor = '#ffffff',
  width = '100%',
  height = '100%',
  minWidth = 60,
  maxWidth = 1200,
  minHeight = 30,
  titleColor = '#6b7280',
  valueColor = '#111827',
  trendPositiveColor = '#4caf50',
  trendNegativeColor = '#f44336',
  trendNeutralColor = '#9e9e9e',
  onClick = null,
  valueSize = '2.1rem',
  titleSize = '1rem',
  elevation = 1,
  borderRadius = 2,
  icon = null,
  showDataLabels = true,
  stats = null
}) => {
  // Determine trend icon and color
  const renderTrend = () => {
    if (trend === undefined || trend === null) return null;
    
    if (trend > 0) {
      return (
        <Box display="flex" alignItems="center" color="success.main">
          <TrendingUpIcon fontSize="small" />
          <Typography variant="body2" component="span" ml={0.5}>
            {trend}%
          </Typography>
        </Box>
      );
    } else if (trend < 0) {
      return (
        <Box display="flex" alignItems="center" color="error.main">
          <TrendingDownIcon fontSize="small" />
          <Typography variant="body2" component="span" ml={0.5}>
            {Math.abs(trend)}%
          </Typography>
        </Box>
      );
    } else {
      return (
        <Box display="flex" alignItems="center" color="text.secondary">
          <TrendingFlatIcon fontSize="small" />
          <Typography variant="body2" component="span" ml={0.5}>
            0%
          </Typography>
        </Box>
      );
    }
  };

  // Get appropriate icon
  const getIcon = () => {
    if (icon) return icon;
    
    if (title.toLowerCase().includes('unit') || title.toLowerCase().includes('home')) {
      return <HomeIcon sx={{ fontSize: 24, color: iconColor }} />;
    } else if (title.toLowerCase().includes('day') || title.toLowerCase().includes('dom')) {
      return <CalendarTodayIcon sx={{ fontSize: 24, color: iconColor }} />;
    } else if (title.toLowerCase().includes('vacanc') || title.toLowerCase().includes('rate')) {
      return <ShowChartIcon sx={{ fontSize: 24, color: iconColor }} />;
    } else if (title.toLowerCase().includes('$') || title.toLowerCase().includes('rent')) {
      return <AttachMoneyIcon sx={{ fontSize: 24, color: iconColor }} />;
    }
    
    return <ApartmentIcon sx={{ fontSize: 24, color: iconColor }} />;
  };

  // Render additional statistics
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
        {stats.median !== undefined && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Median
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {stats.median} {stats.median === 1 ? 'day' : 'days'}
            </Typography>
          </Box>
        )}
        {stats.min !== undefined && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Min
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {stats.min} {stats.min === 1 ? 'day' : 'days'}
            </Typography>
          </Box>
        )}
        {stats.max !== undefined && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Max
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {stats.max} {stats.max === 1 ? 'day' : 'days'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    if (!showChart || !chartData) return null;
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'right',
        },
        tooltip: {
          enabled: true
        }
      }
    };
    
    // Special options for histogram
    if (chartType.toLowerCase() === 'histogram') {
      chartOptions.scales = {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Units'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Days on Market'
          }
        }
      };
    }
    
    switch (chartType.toLowerCase()) {
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'histogram':
        return <Bar data={chartData} options={chartOptions} />;
      default:
        return <Doughnut data={chartData} options={chartOptions} />;
    }
  };

  return (
    <Card
      sx={{
        minWidth,
        maxWidth,
        width,
        height,
        minHeight,
        backgroundColor,
        borderRadius,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
      elevation={elevation}
      onClick={onClick}
    >
      <CardContent sx={{ 
        height: '100%', 
        p: 1.5, 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:last-child': { pb: 1.5 } // Override MUI's default padding-bottom
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            justifyContent: showChart ? 'flex-start' : 'space-between'
          }}>
            {/* Header section with title and icon */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 0.2,
              flexShrink: 0
            }}>
              <Typography 
                variant="subtitle1" 
                component="div" 
                sx={{ 
                  color: titleColor, 
                  fontSize: titleSize,
                  fontWeight: 500,
                }}
              >
                {title}
              </Typography>
              
              <Box sx={{ 
                width: 32, 
                height: 'auto', 
                borderRadius: '50%', 
                backgroundColor: `${iconColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getIcon()}
              </Box>
            </Box>
            
            {/* Value section */}
            <Box sx={{ 
              mt: 0.5, 
              mb: showChart ? 0.5 : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'left',
              flexShrink: 0,
              height: showChart ? 'auto' : '40%'
            }}>
              <Tooltip title={description} placement="top" arrow>
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: valueColor,
                    fontSize: valueSize,
                    lineHeight: 1.1,
                    textAlign: 'center'
                  }}
                >
                  {value}
                </Typography>
              </Tooltip>
            </Box>
            
            {/* Trend indicator (only when chart is not shown) */}
            {!showChart && renderTrend()}
            
            {/* Render additional statistics */}
            {!showChart && renderStats()}
            
            {/* Chart section */}
            {showChart && chartData && (
              <Box sx={{ 
                flexGrow: 1,
                minHeight: 40,
                mt: 'auto',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60%'
              }}>
                {renderChart()}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
