import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Grid, Typography, MenuItem, Select, FormControl, InputLabel, Collapse, IconButton, Chip, Stack } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

const FiltersComponent = ({ filtersConfig, onApplyFilters, initialFilters = {}, data = [], onFilterToggle }) => {
  const [filters, setFilters] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [uniqueOptions, setUniqueOptions] = useState({});
  const [activeFilters, setActiveFilters] = useState({});

  // Initialize filters and activeFilters from initialFilters
  useEffect(() => {
    if (initialLoad) {
      setFilters(initialFilters);
      
      // Also set activeFilters from initialFilters to show the chips
      const nonEmptyFilters = Object.entries(initialFilters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      setActiveFilters(nonEmptyFilters);
      setInitialLoad(false);
    }
  }, [initialFilters, initialLoad]);

  // Generate unique options for dropdown fields based on data
  useEffect(() => {
    if (data && data.length > 0) {
      console.log("Processing data for dropdowns:", data[0]);
      const options = {};
      
      filtersConfig.forEach(filter => {
        if (filter.useDropdown || filter.field.includes('status') || filter.field.includes('type')) {
          // Extract field name without table prefix (e.g., 'u.unit_status' -> 'unit_status')
          const fieldName = filter.field.split('.').pop();
          
          // Try direct field mapping first (most reliable)
          const directMappings = {
            'unit_status': 'UnitStatus',
            'deal_status': 'DealStatus',
            'lease_type': 'LeaseType',
            'portfolio': 'Portfolio'
          };
          
          const mappedField = directMappings[fieldName];
          if (mappedField && data[0][mappedField]) {
            const uniqueValues = [...new Set(data.map(item => item[mappedField]).filter(Boolean))].sort();
            options[filter.field] = uniqueValues.map(value => ({
              value: value,
              label: value
            }));
            console.log(`Generated options for ${filter.field} using direct mapping (${mappedField}):`, uniqueValues);
          } else {
            // Try to find matching field in data
            const matchingFields = Object.keys(data[0]).filter(key => 
              key.toLowerCase().includes(fieldName.toLowerCase())
            );
            
            if (matchingFields.length > 0) {
              // Use the first matching field
              const dataField = matchingFields[0];
              
              // Get unique values and sort them
              const uniqueValues = [...new Set(data.map(item => item[dataField]).filter(Boolean))].sort();
              options[filter.field] = uniqueValues.map(value => ({
                value: value,
                label: value
              }));
              
              console.log(`Generated options for ${filter.field} (${dataField}):`, uniqueValues);
            } else {
              console.log(`Could not find matching field for ${filter.field} in data`);
            }
          }
        }
      });
      
      setUniqueOptions(options);
    }
  }, [data, filtersConfig]);

  // Notify parent component when filter visibility changes
  useEffect(() => {
    if (onFilterToggle) {
      onFilterToggle(isOpen);
    }
  }, [isOpen, onFilterToggle]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    // Remove empty filters
    const nonEmptyFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    setActiveFilters(nonEmptyFilters);
    onApplyFilters(nonEmptyFilters);
    setIsOpen(false); // Close filters after applying
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveFilters({});
    onApplyFilters({});
  };

  const toggleFilters = () => {
    setIsOpen(!isOpen);
  };

  const removeFilter = (field) => {
    const newFilters = { ...filters };
    delete newFilters[field];
    setFilters(newFilters);
    
    const newActiveFilters = { ...activeFilters };
    delete newActiveFilters[field];
    setActiveFilters(newActiveFilters);
    
    onApplyFilters(newFilters);
  };

  // Get label for a field
  const getFieldLabel = (field) => {
    const config = filtersConfig.find(f => f.field === field);
    return config ? config.label : field;
  };

  // Render the appropriate input based on filter type
  const renderFilterInput = (filter) => {
    const { field, label, type } = filter;
    
    switch (type) {
      case 'number':
        return (
          <TextField
            label={label}
            variant="outlined"
            size="small"
            fullWidth
            type="number"
            value={filters[field] || ''}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
            sx={{ minWidth: '180px' }}
          />
        );
      case 'date':
        return (
          <TextField
            label={label}
            variant="outlined"
            size="small"
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filters[field] || ''}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            sx={{ minWidth: '180px' }}
          />
        );
      case 'text':
        // If we have options for this field, render a dropdown
        if (uniqueOptions[field] && uniqueOptions[field].length > 0) {
          return (
            <FormControl variant="outlined" size="small" fullWidth sx={{ minWidth: '180px' }}>
              <InputLabel>{label}</InputLabel>
              <Select
                value={filters[field] || ''}
                onChange={(e) => handleFilterChange(field, e.target.value)}
                label={label}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {uniqueOptions[field].map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        
        // Otherwise render a text input
        return (
          <TextField
            label={label}
            variant="outlined"
            size="small"
            fullWidth
            value={filters[field] || ''}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
            sx={{ minWidth: '180px' }}
          />
        );
      default:
        return (
          <TextField
            label={label}
            variant="outlined"
            size="small"
            fullWidth
            value={filters[field] || ''}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
            sx={{ minWidth: '180px' }}
          />
        );
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      minHeight: '48px'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', height: '48px' }}>
        <Button 
          startIcon={<FilterListIcon />} 
          onClick={toggleFilters}
          variant="outlined"
          size="small"
          color={isOpen ? "primary" : "inherit"}
          sx={{ 
            borderRadius: '4px',
            textTransform: 'none',
            fontWeight: isOpen ? 'bold' : 'normal',
            mr: 2
          }}
        >
          {isOpen ? 'Hide Filters' : 'Filters'}
        </Button>
        
        {/* Display active filters as chips */}
        {Object.keys(activeFilters).length > 0 && !isOpen && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: '4px' }}>
            {Object.entries(activeFilters).map(([field, value]) => (
              <Chip 
                key={field}
                label={`${getFieldLabel(field)}: ${value}`}
                onDelete={() => removeFilter(field)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </Box>
      
      <Collapse 
        in={isOpen} 
        sx={{ 
          position: 'absolute', 
          top: '48px', 
          left: 0,
          width: 'calc(100vw - 140px)', 
          zIndex: 10
        }}
      >
        <Box sx={{ 
          p: 2, 
          mt:2,
          mb:0,
          backgroundColor: 'white', 
          border: '2px solid #e6e6e6',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h2">
              Filter Data
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                color="secondary" 
                size="small" 
                onClick={handleClearFilters}
                sx={{ mr: 1 }}
              >
                Clear All
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                size="small" 
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
              <IconButton 
                size="small" 
                onClick={toggleFilters} 
                sx={{ ml: 1 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {filtersConfig.map((filter) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={filter.field}>
                {renderFilterInput(filter)}
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FiltersComponent;
