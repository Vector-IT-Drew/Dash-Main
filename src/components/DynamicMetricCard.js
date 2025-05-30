import React, { useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, FormControl, Select, MenuItem, TextField
} from '@mui/material';
import { calculatePricePerSqft, calculateGenericAverage } from '../utils/metricCalculations';

const getUniqueValues = (data, field) => {
  return [...new Set(data.map(row => row[field]).filter(Boolean))];
};

const getMetricOptions = (data) => {
  if (!data.length) return [];
  const sample = data[0];
  return Object.keys(sample).filter(
    key => typeof sample[key] === 'number' && !isNaN(sample[key])
  );
};

const DynamicMetricCard = ({
  data = [],
  onFiltersChange,
  filters,
  setFilters,
  cardTitle = "Dynamic Metric",
  backgroundColor = "#fff",
  icon = null,
  iconColor = "#4CAF50"
}) => {
  // Options
  const metricOptions = useMemo(() => [
    'avg_price_per_sqft',
    'days_on_market',
    'gross',
    'actual_rent'
  ], []);
  const deal_status_options = useMemo(() => getUniqueValues(data, 'deal_status'), [data]);
  const unit_status_options = useMemo(() => getUniqueValues(data, 'unit_status'), [data]);

  // Only calculate in metricCalculations
  const avgValueObj = useMemo(() => {
    if (filters.metric === 'avg_price_per_sqft') {
      return calculatePricePerSqft(data, filters);
    }
    if (!filters.metric) return { avg: null, count: 0 };
    // Generic average for other metrics
    return calculateGenericAverage(data, filters);
  }, [data, filters]);

  const avgValue = avgValueObj.avg;
  const filteredCount = avgValueObj.count;

  // Handlers
  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    if (onFiltersChange) onFiltersChange({ ...filters, [field]: value });
  };

  // Underline style for filter blanks
  const underlineStyle = {
    borderBottom: '2px solid #1976d2',
    fontWeight: 500,
    fontSize: '1em',
    background: 'none',
    border: 'none',
    display: 'inline-block',
    verticalAlign: 'bottom',
    margin: 0,
    padding: 0,
    paddingBottom: '1px'
  };

  // Update the metric labels
  const metricLabels = {
    'avg_price_per_sqft': 'Price per Sqft',
    'days_on_market': 'Days on Market',
    'gross': 'Gross',
    'actual_rent': 'Actual Rent'
  };

  return (
    <Card sx={{
        width: '100%',
        height: '100%',
        backgroundColor,
      }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon && <Box mr={2}>{icon}</Box>}
          <Typography variant="h6" color="text.primary">{cardTitle}</Typography>
        </Box>
        <Box mb={2}>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            mb={1}
            component="span"
            sx={{ lineHeight: 2.2, fontSize: '1.15em' }}
          >
            The Average&nbsp;
            <FormControl variant="standard" sx={{ ...underlineStyle, minWidth: 120 }}>
              <Select
                value={filters.metric || ""}
                onChange={e => handleChange('metric', e.target.value)}
                displayEmpty
                sx={underlineStyle}
              >
                <MenuItem value="" disabled >Metric</MenuItem>
                {metricOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{metricLabels[opt] || opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
            &nbsp;of a unit in&nbsp;
            <FormControl variant="standard" sx={underlineStyle}>
              <Select
                value={filters.deal_status || ""}
                onChange={e => handleChange('deal_status', e.target.value)}
                displayEmpty
                sx={underlineStyle}
              >
                <MenuItem value="">Any Deal Status</MenuItem>
                {deal_status_options.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
            &nbsp;
            <FormControl variant="standard" sx={underlineStyle}>
              <Select
                value={filters.unit_status || ""}
                onChange={e => handleChange('unit_status', e.target.value)}
                displayEmpty
                sx={underlineStyle}
              >
                <MenuItem value="">Any Unit Status</MenuItem>
                {unit_status_options.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
            &nbsp;in date range&nbsp;
            <TextField
              type="date"
              variant="standard"
              value={filters.moveOutStart || ""}
              onChange={e => handleChange('moveOutStart', e.target.value)}
              sx={{
                ...underlineStyle,
                width: 110,
                fontWeight: 700,
                fontSize: '1.1em',
                mx: 0.5,
                mr:2.6,
                '& .MuiInputBase-input': {
                  borderBottom: '2px solid #1976d2',
                  paddingBottom: '1px'
                }
              }}
            />
            &nbsp;to&nbsp;
            <TextField
              type="date"
              variant="standard"
              value={filters.moveOutEnd || ""}
              onChange={e => handleChange('moveOutEnd', e.target.value)}
              sx={{
                ...underlineStyle,
                width: 110,
                fontWeight: 700,
                fontSize: '1.1em',
                mx: 0.5,
                mr: 2.6,
                '& .MuiInputBase-input': {
                  borderBottom: '2px solid #1976d2',
                  paddingBottom: '1px'
                }
              }}
            />
            &nbsp;is:
          </Typography>
        </Box>
        <Typography variant="h3" color="primary" mt={1}>
          {avgValue !== null
            ? (filters.metric === 'avg_price_per_sqft'
                ? `$${avgValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /sqft`
                : filters.metric === 'gross' || filters.metric === 'actual_rent'
                  ? `$${avgValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  : avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 }))
            : "N/A"}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {filteredCount} unit{filteredCount === 1 ? '' : 's'} matched
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DynamicMetricCard;
