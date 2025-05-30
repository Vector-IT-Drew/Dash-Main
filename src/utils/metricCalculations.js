// Utility functions for calculating various metrics

/**
 * Preprocesses data to add calculated fields
 * @param {Array} data - Raw data array
 * @returns {Array} - Processed data with calculated fields
 */
export const preprocessData = (data) => {
  if (!data || !data.length) return [];
  
  const today = new Date();
  
  return data.map(item => {
    // Calculate days on market if move_out date exists
    let days_on_market = null;
    if (item.move_out && item.move_out !== '-' && item.move_out !== null) {
      try {
        const moveOutDate = new Date(item.move_out);
        if (!isNaN(moveOutDate.getTime())) {
          const diffTime = today - moveOutDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          days_on_market = diffDays > 0 ? diffDays : null;
        }
      } catch (error) {
        console.error('Error calculating DOM:', error);
      }
    }
    
    return {
      ...item,
      days_on_market
    };
  });
};

/**
 * Calculate total units
 * @param {Array} data - Processed data array
 * @returns {Object} Object containing count
 */
export const calculateTotalUnits = (data) => {
  return { count: data?.length || 0 };
};


/**
 * Calculate average days on market
 * @param {Array} data - Processed data array
 * @returns {Object} Object containing average and count
 */
export const calculateDaysOnMarket = (data) => {
  if (!data || !data.length) {
    return { average: 0, count: 0, chartData: { labels: [], datasets: [{ data: [] }] } };
  }
  
  // Use the existing dom field instead of days_on_market
  const unitsWithDOM = data.filter(unit => parseFloat(unit.dom) > 0);
  
  if (unitsWithDOM.length === 0) {
    return { average: 0, count: 0, chartData: { labels: [], datasets: [{ data: [] }] } };
  }
  
  const totalDays = unitsWithDOM.reduce((sum, unit) => sum + parseFloat(unit.dom), 0);
  const averageDays = Math.round(totalDays / unitsWithDOM.length);
  
  // Group units by days on market ranges for chart
  const ranges = [
    { label: '0-7 days', min: 0, max: 7 },
    { label: '8-14 days', min: 8, max: 14 },
    { label: '15-30 days', min: 15, max: 30 },
    { label: '31-60 days', min: 31, max: 60 },
    { label: '60+ days', min: 61, max: Infinity }
  ];
  
  const chartData = ranges.map(range => ({
    label: range.label,
    count: unitsWithDOM.filter(unit => 
      parseFloat(unit.dom) >= range.min && parseFloat(unit.dom) <= range.max
    ).length
  }));
  
  return {
    average: averageDays,
    count: unitsWithDOM.length,
    chartData: {
      labels: chartData.map(item => item.label),
      datasets: [{ data: chartData.map(item => item.count) }]
    }
  };
};

/**
 * Calculate daily move-outs for the upcoming 30 days
 * @param {Array} data - Processed data array
 * @returns {Object} Object containing total and chart data
 */
export const calculateDailyMoveOuts = (data) => {
  if (!data || !data.length) {
    return { 
      total: 0, 
      chartData: {
        labels: [],
        datasets: [{ 
          data: [],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      }
    };
  }
  
  // Get today's date and dates for the upcoming month
  const today = new Date();
  const upcomingDates = [];
  const moveOutCounts = [];
  
  // Generate dates for the next 30 days (including today)
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    upcomingDates.push(date.toISOString().split('T')[0]);
    moveOutCounts.push(0);
  }
  
  // Count move-outs for each day
  data.forEach(item => {
    if (item.move_out && item.move_out !== '-' && item.move_out !== null) {
      try {
        const moveOutDate = new Date(item.move_out);
        if (!isNaN(moveOutDate.getTime())) {
          const dateStr = moveOutDate.toISOString().split('T')[0];
          const index = upcomingDates.indexOf(dateStr);
          if (index !== -1) {
            moveOutCounts[index]++;
          }
        }
      } catch (error) {
        console.error('Error processing move-out date:', error);
      }
    }
  });
  
  // Format dates for display
  const formattedDates = upcomingDates.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  return {
    total: moveOutCounts.reduce((sum, count) => sum + count, 0),
    chartData: {
      labels: formattedDates,
      datasets: [{ 
        label: 'Move-outs',
        data: moveOutCounts,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }]
    }
  };
};

/**
 * Calculate units by status
 * @param {Array} data - Processed data array
 * @param {String} field - Field to check (e.g., 'unit_status', 'deal_status')
 * @param {String|Array} value - Status value(s) to match
 * @returns {Object} Object containing count
 */
export const calculateUnitsByStatus = (data, field, value) => {
  if (!data || !data.length) return { count: 0 };
  
  const values = Array.isArray(value) ? value : [value];
  
  const filteredUnits = data.filter(item => 
    item[field] && 
    values.some(v => item[field].toLowerCase() === v.toLowerCase())
  );
  
  return { count: filteredUnits.length };
};

/**
 * Calculate distribution by field
 * @param {Array} data - Processed data array
 * @param {String} field - Field to group by
 * @param {Number} limit - Maximum number of categories to show
 * @returns {Object} Object containing distribution data
 */
export const calculateDistributionByField = (data, field, limit = 10) => {
  if (!data || !data.length) {
    return {
      total: 0,
      distribution: {},
      chartData: { labels: [], datasets: [{ data: [] }] }
    };
  }

  // Count occurrences of each value
  const distribution = data.reduce((acc, item) => {
    const value = item[field] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  // Sort by count (descending)
  const sortedEntries = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1]);

  // Take top categories based on limit
  const topCategories = sortedEntries.slice(0, limit);
  
  // Group remaining as "Other" if needed
  if (sortedEntries.length > limit) {
    const otherCount = sortedEntries
      .slice(limit)
      .reduce((sum, [_, count]) => sum + count, 0);
    
    if (otherCount > 0) {
      topCategories.push(['Other', otherCount]);
    }
  }

  return {
    total: data.length,
    distribution: Object.fromEntries(topCategories),
    chartData: {
      labels: topCategories.map(([label]) => label),
      datasets: [{ 
        data: topCategories.map(([_, count]) => count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
          'rgba(40, 159, 64, 0.7)',
          'rgba(210, 199, 199, 0.7)',
        ]
      }]
    }
  };
};

/**
 * Calculate DOM distribution for histogram
 * @param {Array} data - Processed data array
 * @returns {Object} Object containing distribution data and statistics
 */
export const calculateDOMDistribution = (data) => {
  if (!data || !data.length) {
    return {
      stats: { average: 0, median: 0, min: 0, max: 0, count: 0 },
      chartData: {
        labels: [],
        datasets: [{ 
          label: 'Units',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    };
  }
  
  // Get all valid DOM values
  const days_on_marketArray = data
    .filter(unit => parseFloat(unit.dom) > 0)
    .map(unit => parseFloat(unit.dom))
    .sort((a, b) => a - b);
  
  if (days_on_marketArray.length === 0) {
    return {
      stats: { average: 0, median: 0, min: 0, max: 0, count: 0 },
      chartData: {
        labels: [],
        datasets: [{ 
          label: 'Units',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      }
    };
  }
  
  // Calculate statistics
  const min = days_on_marketArray[0];
  const max = days_on_marketArray[days_on_marketArray.length - 1];
  const sum = days_on_marketArray.reduce((acc, val) => acc + val, 0);
  const average = Math.round(sum / days_on_marketArray.length);
  
  // Calculate median
  const middle = Math.floor(days_on_marketArray.length / 2);
  const median = days_on_marketArray.length % 2 === 0
    ? Math.round((days_on_marketArray[middle - 1] + days_on_marketArray[middle]) / 2)
    : days_on_marketArray[middle];
  
  // Create histogram bins
  const range = max - min;
  const binCount = Math.min(10, Math.max(1, range + 1));
  const binSize = Math.max(1, Math.ceil(range / binCount));
  
  const bins = [];
  for (let i = 0; i < binCount; i++) {
    const binStart = min + (i * binSize);
    const binEnd = i === binCount - 1 ? max : min + ((i + 1) * binSize - 1);
    bins.push({
      label: binStart === binEnd ? `${binStart}` : `${binStart}-${binEnd}`,
      start: binStart,
      end: binEnd,
      count: 0
    });
  }
  
  // Count values in each bin
  days_on_marketArray.forEach(value => {
    for (const bin of bins) {
      if (value >= bin.start && value <= bin.end) {
        bin.count++;
        break;
      }
    }
  });
  
  return {
    stats: {
      average,
      median,
      min,
      max,
      count: days_on_marketArray.length
    },
    chartData: {
      labels: bins.map(bin => bin.label),
      datasets: [{ 
        label: 'Units',
        data: bins.map(bin => bin.count),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    }
  };
};

// Add a centralized function to calculate price per sqft consistently
export const calculatePricePerSqft = (row) => {
  if (!row.sqft || !row.actual_rent || isNaN(row.sqft) || isNaN(row.actual_rent) || row.sqft <= 0) {
    return null;
  }
  
  // Calculate yearly price per sqft (actual_rent is monthly, so multiply by 12)
  const yearlyRent = Number(row.actual_rent) * 12;
  return yearlyRent / Number(row.sqft);
};

/**
 * Calculate days on market for units
 * @param {Array} data - Data array
 * @param {Object} filters - Filter criteria
 * @returns {Object} Object containing average and count
 */
export function calculateDaysOnMarketMetric(data, filters) {
  console.log("=== DAYS ON MARKET CALCULATION ===");
  console.log(`Data length: ${data?.length || 0} items`);
  console.log(`Filters: ${JSON.stringify(filters)}`);
  
  if (!data || !data.length) {
    console.log("No data provided");
    return { avg: null, count: 0 };
  }
  
  // Check if data has move_out field
  const sampleItem = data[0];
  console.log("Sample data item move_out:", sampleItem.move_out);
  
  // Filter by criteria first
  const filtered = data.filter(row => {
    const dealStatusValid = filters.deal_status ? row.deal_status === filters.deal_status : true;
    const unitStatusValid = filters.unit_status ? row.unit_status === filters.unit_status : true;
    let moveOutValid = true;
    if (row.move_out === null || row.move_out === undefined || row.move_out === '') {
      moveOutValid = true;
    } else {
      if (filters.move_out_start) {
        moveOutValid = moveOutValid && (new Date(row.move_out) >= new Date(filters.move_out_start));
      }
      if (filters.move_out_end) {
        moveOutValid = moveOutValid && (new Date(row.move_out) <= new Date(filters.move_out_end));
      }
    }
    return dealStatusValid && unitStatusValid && moveOutValid;
  });
  
  console.log(`After filtering by status: ${filtered.length} items`);
  
  // Calculate days on market for each row
  const today = new Date();
  console.log(`Today's date: ${today.toISOString()}`);
  
  // Check first 5 rows for move_out dates
  console.log("First 5 rows move_out dates:");
  filtered.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}: move_out = ${row.move_out}`);
  });
  
  const validRows = filtered.filter(row => {
    // Skip rows without move_out date
    if (!row.move_out) {
      return false;
    }
    
    try {
      const moveOutDate = new Date(row.move_out);
      // Skip invalid dates
      if (isNaN(moveOutDate.getTime())) {
        return false;
      }
      
      // Calculate days on market
      const diffTime = today - moveOutDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Only include positive days on market
      return diffDays > 0;
    } catch (error) {
      console.error('Error calculating DOM:', error);
      return false;
    }
  });
  
  console.log(`Valid rows with days_on_market: ${validRows.length}`);
  
  if (!validRows.length) {
    console.log("No valid rows found for days on market calculation");
    return { avg: null, count: 0 };
  }
  
  // Log first 5 valid rows with their calculated DOM
  console.log("Sample DOM calculations:");
  validRows.slice(0, 5).forEach((row, i) => {
    const moveOutDate = new Date(row.move_out);
    const diffTime = today - moveOutDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(`Row ${i}: move_out = ${row.move_out}, DOM = ${diffDays} days`);
  });
  
  const total = validRows.reduce((sum, row) => {
    const moveOutDate = new Date(row.move_out);
    const diffTime = today - moveOutDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  
  const avg = total / validRows.length;
  console.log(`Final DOM calculation: ${total} / ${validRows.length} = ${avg}`);
  
  return { avg: avg, count: validRows.length };
}

export function calculateGenericAverage(data, filters) {
  console.log("calculateGenericAverage called with metric:", filters.metric);
  
  // Special handling for days_on_market which is calculated
  if (filters.metric === 'days_on_market') {
    return calculateDaysOnMarketMetric(data, filters);
  }
  
  // For other metrics
  const filtered = data.filter(row => {
    const dealStatusValid = filters.deal_status ? row.deal_status === filters.deal_status : true;
    const unitStatusValid = filters.unit_status ? row.unit_status === filters.unit_status : true;
    let moveOutValid = true;
    if (row.move_out === null || row.move_out === undefined || row.move_out === '') {
      moveOutValid = true;
    } else {
      if (filters.move_out_start) {
        moveOutValid = moveOutValid && (new Date(row.move_out) >= new Date(filters.move_out_start));
      }
      if (filters.move_out_end) {
        moveOutValid = moveOutValid && (new Date(row.move_out) <= new Date(filters.move_out_end));
      }
    }
    return dealStatusValid && unitStatusValid && moveOutValid;
  });

  if (!filters.metric) return { avg: null, count: 0 };
  
  console.log("Filtered rows:", filtered.length);
  console.log("Looking for metric:", filters.metric);
  
  const validRows = filtered.filter(row => {
    const value = Number(row[filters.metric]);
    return !isNaN(value) && value !== null;
  });
  
  console.log("Valid rows with metric value:", validRows.length);
  
  if (!validRows.length) return { avg: null, count: 0 };

  const sum = validRows.reduce((acc, row) => acc + Number(row[filters.metric]), 0);
  return { avg: sum / validRows.length, count: validRows.length };
}

// Update the getGroupedMetricChartData function to use this centralized calculation
export function getGroupedMetricChartData(data, filters, x_metric, y_metric, maxValue, chartStyle = 'bar') {
  console.log(`Getting chart data for ${x_metric} vs ${y_metric} with chart style ${chartStyle}`);
  
  if (!data || !data.length) {
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
  
  // Filter data based on filters
  const filtered = data.filter(row => {
    const dealStatusValid = filters.deal_status ? row.deal_status === filters.deal_status : true;
    const unitStatusValid = filters.unit_status ? row.unit_status === filters.unit_status : true;
    let moveOutValid = true;
    if (row.move_out === null || row.move_out === undefined || row.move_out === '') {
      moveOutValid = true;
    } else {
      if (filters.move_out_start) {
        moveOutValid = moveOutValid && (new Date(row.move_out) >= new Date(filters.move_out_start));
      }
      if (filters.move_out_end) {
        moveOutValid = moveOutValid && (new Date(row.move_out) <= new Date(filters.move_out_end));
      }
    }
    return dealStatusValid && unitStatusValid && moveOutValid;
  });

  if (x_metric === 'unit_status' || x_metric === 'deal_status') {
    // Category handling
    const categories = {};
    filtered.forEach(row => {
      const category = row[x_metric];
      if (category && !categories[category]) {
        categories[category] = {
          values: [],
          sum: 0,
          count: 0
        };
      }
      
      if (category) {
        let yValue = null;
        
        if (y_metric === 'avg_price_per_sqft') {
          yValue = calculatePricePerSqft(row);
        } else if (y_metric === 'days_on_market') {
          yValue = parseFloat(row.dom);
          if (isNaN(yValue) || yValue <= 0) yValue = null;
        } else {
          yValue = Number(row[y_metric]);
          if (isNaN(yValue)) yValue = null;
        }
        
        if (yValue !== null) {
          categories[category].values.push(yValue);
          categories[category].sum += yValue;
          categories[category].count++;
        }
      }
    });
    
    // Calculate averages for each category
    const categoryData = Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([category, data]) => ({
        category,
        average: data.sum / data.count,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    // Limit to top categories if needed
    const topCategories = categoryData.slice(0, 10);
    
    return {
      labels: topCategories.map(item => item.category),
      datasets: [
        {
          label: `${y_metric} by ${x_metric}`,
          data: topCategories.map(item => item.average),
          backgroundColor: '#1976d2',
        }
      ]
    };
  } else {
    // For numeric x-axis metrics
    const rawData = [];
    
    filtered.forEach(row => {
      let xValue = null;
      let yValue = null;
      
      // Get x value using centralized calculation
      if (x_metric === 'avg_price_per_sqft') {
        xValue = calculatePricePerSqft(row);
      } else if (x_metric === 'days_on_market') {
        xValue = parseFloat(row.dom);
        if (isNaN(xValue) || xValue <= 0) xValue = null;
      } else {
        xValue = Number(row[x_metric]);
        if (isNaN(xValue)) xValue = null;
      }
      
      // Get y value using centralized calculation
      if (y_metric === 'avg_price_per_sqft') {
        yValue = calculatePricePerSqft(row);
      } else if (y_metric === 'days_on_market') {
        yValue = parseFloat(row.dom);
        if (isNaN(yValue) || yValue <= 0) yValue = null;
      } else {
        yValue = Number(row[y_metric]);
        if (isNaN(yValue)) yValue = null;
      }
      
      if (xValue !== null && yValue !== null) {
        rawData.push({ x: xValue, y: yValue });
      }
    });
    
    // For line and scatter charts, return raw data without binning
    if (chartStyle === 'line' || chartStyle === 'scatter') {
      console.log(`Using raw data for ${chartStyle} chart with ${rawData.length} points`);
      
      // Sort by x value for line charts
      if (chartStyle === 'line') {
        rawData.sort((a, b) => a.x - b.x);
      }
      
      return {
        labels: [], // Not used for raw data
        datasets: [
          {
            label: `${y_metric} by ${x_metric}`,
            data: [], // Not used for raw data
            backgroundColor: '#1976d2',
          }
        ],
        rawData
      };
    }
    
    // For bar charts, bin the data
    if (rawData.length === 0) {
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
    
    // Sort by x value
    rawData.sort((a, b) => a.x - b.x);
    
    // Create bins for bar charts
    const xValues = rawData.map(point => point.x);
    const min = Math.min(...xValues);
    const max = Math.max(...xValues);
    
    // Determine appropriate bin count and size based on data range
    const range = max - min;
    let binCount = Math.min(10, Math.max(5, Math.ceil(rawData.length / 10)));
    
    // Adjust bin count for large ranges
    if (range > 10000) {
      binCount = Math.min(15, binCount);
    }
    
    const binSize = range / binCount;
    
    console.log(`Binning data with range ${min} to ${max}, ${binCount} bins of size ${binSize}`);
    
    const bins = [];
    const xMetricInfo = getMetricInfo(x_metric);

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binSize;
      const binEnd = i === binCount - 1 ? max : min + (i + 1) * binSize;
      
      // Format bin labels dynamically based on metric type
      let binLabel;
      
      if (xMetricInfo.type === 'currency') {
        const startFormatted = binStart.toFixed(xMetricInfo.decimals || 0);
        const endFormatted = binEnd.toFixed(xMetricInfo.decimals || 0);
        const prefix = xMetricInfo.prefix || '';
        const suffix = xMetricInfo.suffix || '';
        
        if (xMetricInfo.decimals === 0) {
          binLabel = `${prefix}${Math.round(binStart).toLocaleString()}-${prefix}${Math.round(binEnd).toLocaleString()}${suffix}`;
        } else {
          binLabel = `${prefix}${startFormatted}-${prefix}${endFormatted}${suffix}`;
        }
      } else if (xMetricInfo.type === 'number') {
        const decimals = xMetricInfo.decimals || 0;
        const suffix = xMetricInfo.suffix || '';
        
        if (decimals === 0) {
          const startRounded = Math.floor(binStart);
          const endRounded = Math.ceil(binEnd);
          
          // Always show as range for bins, never single values
          binLabel = `${startRounded}-${endRounded}${suffix}`;
        } else {
          binLabel = `${binStart.toFixed(decimals)}-${binEnd.toFixed(decimals)}${suffix}`;
        }
      } else {
        // Fallback for unknown types
        binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
      }
      
      bins.push({
        label: binLabel,
        start: binStart,
        end: binEnd,
        points: []
      });
    }
    
    // Add debugging to see the bins
    console.log(`DOM Chart Debug - Min: ${min}, Max: ${max}, Range: ${range}, Bin Size: ${binSize}`);
    console.log('X Metric Info:', xMetricInfo);
    console.log('Bin labels:', bins.map(b => b.label));
    
    // Assign points to bins
    rawData.forEach(point => {
      for (const bin of bins) {
        if (point.x >= bin.start && (point.x < bin.end || (bin.end === max && point.x <= max))) {
          bin.points.push(point);
          break;
        }
      }
    });
    
    // Calculate average y value for each bin
    const labels = bins.map(bin => bin.label);
    const data = bins.map(bin => {
      if (bin.points.length === 0) return null;
      const sum = bin.points.reduce((acc, point) => acc + point.y, 0);
      return sum / bin.points.length;
    });
    
    console.log(`Created ${bins.length} bins for bar chart with ${rawData.length} points`);
    bins.forEach((bin, i) => {
      console.log(`Bin ${i}: ${bin.label}, ${bin.points.length} points, avg: ${data[i]}`);
    });
    
    return {
      labels,
      datasets: [
        {
          label: `${y_metric} by ${x_metric}`,
          data,
          backgroundColor: '#1976d2',
        }
      ],
      rawData // Include raw data for potential use
    };
  }
}

export function getCurrentVacancyCount(data){
  if (!Array.isArray(data)) return 0;
  return data.filter(
    (row) =>
      (row.unit_status && row.unit_status.toLowerCase() === 'vacant') &&
      (row.rentable === 1 || row.rentable === true)
  ).length;
};

export function getExpectedVacancyCount(data) {
    if (!Array.isArray(data)) return 0;
    return data.filter(
      (row) =>
        (row.unit_status && row.unit_status.toLowerCase() === 'vacant') &&
        (row.rentable === 1 || row.rentable === true) &&
        !(
          row.deal_status &&
          typeof row.deal_status === 'string' &&
          row.deal_status.toLowerCase().includes('active')
        )
    ).length;
  };

/**
 * Calculates the Down Units.
 * Definition: Units with a unit_status that includes "dnr", "holdover", or "legal" (case-insensitive).
 * @param {Array} data - The array of unit objects.
 * @returns {object} - { count: number, percent: number }
 */
export function getDownUnitsMetric(data) {
  if (!Array.isArray(data) || data.length === 0) return { count: 0, percent: 0 };

  const downKeywords = ['dnr', 'do not rent', 'holdover', 'legal'];
  const count = data.filter(row =>
    // Down if unit_status matches keywords OR rentable is 0 (or '0')
    (row.unit_status &&
      downKeywords.some(keyword =>
        row.unit_status.toLowerCase().includes(keyword)
      )
    ) ||
    row.rentable === 0 ||
    row.rentable === '0'
  ).length;

  const percent = ((count / data.length) * 100).toFixed(1);

  return { count, percent };
}

// Returns an array of { label, value } for deal statuses within a given unit status
export function getDealStatusDistributionByUnitStatus(data, selectedUnitStatus) {
  if (!Array.isArray(data) || !selectedUnitStatus) return [];
  const filtered = data.filter(row => row.unit_status === selectedUnitStatus);
  const counts = {};
  filtered.forEach(row => {
    const dealStatus = row.deal_status || 'Unknown';
    counts[dealStatus] = (counts[dealStatus] || 0) + 1;
  });
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

// For dropdown options
export function getUniqueUnitStatuses(data) {
  return Array.from(new Set(data.map(row => row.unit_status).filter(Boolean)));
}

export function getAverageDaysOnMarket(data) {
  if (!Array.isArray(data) || data.length === 0) return 0;
  
  // Use the existing dom field from the data
  const validDomValues = data
    .map(row => parseFloat(row.dom))
    .filter(dom => !isNaN(dom) && dom > 0);
  
  if (validDomValues.length === 0) return 0;
  
  const sum = validDomValues.reduce((acc, dom) => acc + dom, 0);
  return Math.round(sum / validDomValues.length);
}

// Add a helper function to get metric type and formatting info
const getMetricInfo = (metric) => {
  const metricTypes = {
    'days_on_market': { type: 'number', suffix: ' days', decimals: 0 },
    'dom': { type: 'number', suffix: ' days', decimals: 0 },
    'gross': { type: 'currency', prefix: '$', decimals: 0 },
    'actual_rent': { type: 'currency', prefix: '$', decimals: 0 },
    'avg_price_per_sqft': { type: 'currency', prefix: '$', suffix: '/sqft', decimals: 2 },
    'sqft': { type: 'number', suffix: ' sqft', decimals: 0 },
    'unit_status': { type: 'category' },
    'deal_status': { type: 'category' },
    'bedrooms': { type: 'number', suffix: ' bed', decimals: 0 },
    'bathrooms': { type: 'number', suffix: ' bath', decimals: 1 }
  };
  
  return metricTypes[metric] || { type: 'number', decimals: 1 };
};

