// Status color mapping utility for consistent styling across the application
export const statusColors = {
  // Unit status colors
  'occupied': { backgroundColor: '#ffebee', color: '#b71c1c' }, // Dark red text, light red background
  'closed': { backgroundColor: '#ffebee', color: '#b71c1c' }, // Dark red text, light red background
  'vacant': { backgroundColor: '#e6f7e6', color: '#2e7d32' }, // Pastel green
  'dnr': { backgroundColor: '#e0e0e0', color: '#212121' }, // Dark grey
  
  // Deal status colors
  'active deal': { backgroundColor: '#e3f2fd', color: '#1565c0' }, // Pastel blue
  // Default color for unknown statuses
  'default': { backgroundColor: '#f5f5f5', color: '#616161' }
};

// Helper function to get status color
export const getStatusColor = (status) => {
  if (!status || status === '-') return statusColors.default;
  const normalizedStatus = status.toString().toLowerCase();
  return statusColors[normalizedStatus] || statusColors.default;
};

// Format cell values for display
export const formatCellValue = (value, type) => {
  // Handle null, undefined, NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '-';
  }

  switch (type) {
    case 'date':
      if (value === '-' || value === 'null' || !value) {
        return '-';
      }
      
      let formattedDate;
      try {
        // Parse the date string directly without timezone shifting
        let year, month, day;
        
        if (typeof value === 'string') {
          // Handle ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
          if (value.includes('T')) {
            // Extract just the date part before 'T'
            const [datePart] = value.split('T');
            [year, month, day] = datePart.split('-').map(Number);
          } else if (value.includes('-') && value.split('-').length === 3) {
            // YYYY-MM-DD format
            [year, month, day] = value.split('-').map(Number);
          } else if (value.includes('/')) {
            // MM/DD/YYYY or similar format
            const parts = value.split('/');
            if (parts.length === 3) {
              [month, day, year] = parts.map(Number);
              // Handle 2-digit years
              if (year < 100) {
                year += year < 50 ? 2000 : 1900;
              }
            }
          } else {
            // Fallback: try to parse as date
            const dateObj = new Date(value + 'T00:00:00'); // Add time to avoid timezone issues
            if (!isNaN(dateObj.getTime())) {
              year = dateObj.getFullYear();
              month = dateObj.getMonth() + 1;
              day = dateObj.getDate();
            }
          }
        } else {
          // If it's already a Date object, extract components
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            year = dateObj.getFullYear();
            month = dateObj.getMonth() + 1;
            day = dateObj.getDate();
          }
        }
        
        // Validate parsed components
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return '-';
        }
        
        // Create date object using local date components (no timezone shift)
        const localDate = new Date(year, month - 1, day);
        
        // Format as "Jun 5th, 2024"
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const dayWithOrdinal = (day) => {
          const j = day % 10;
          const k = day % 100;
          if (j === 1 && k !== 11) return day + 'st';
          if (j === 2 && k !== 12) return day + 'nd';
          if (j === 3 && k !== 13) return day + 'rd';
          return day + 'th';
        };
        
        formattedDate = `${monthNames[month - 1]} ${dayWithOrdinal(day)}, ${year}`;
        
      } catch (e) {
        console.error('Error formatting date:', e, value);
        return '-';
      }

      const shouldStrikethrough = formattedDate.includes('Dec 31st, 1979');

      return (
        <span style={{ 
          textDecoration: shouldStrikethrough ? 'line-through' : 'none',
          opacity: shouldStrikethrough ? 0.5 : 1
        }}>
          {formattedDate}
        </span>
      );
    
    case 'currency':
      if (value === '-') return '-';
      
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) return '-';
      
      // Check if the value has cents (decimal places)
      const hasCents = numValue % 1 !== 0;
      
      return `$${numValue.toLocaleString('en-US', { 
        minimumFractionDigits: hasCents ? 2 : 0, 
        maximumFractionDigits: 2 
      })}`;
    
    case 'number':
      return typeof value === 'number'
        ? value.toLocaleString('en-US')
        : (value === '-' ? '-' : parseFloat(value).toLocaleString('en-US'));
    
    case 'percentage_change':
      if (value === '-' || value === null || value === undefined) {
        return {
          component: 'span',
          props: {
            style: { color: '#999' },
            children: '-'
          }
        };
      }
      
      // Check if the value starts with '+' to determine if it's positive
      const isPositive = value.startsWith('+');
      return {
        component: 'span',
        props: {
          style: {
            color: isPositive ? '#4caf50' : '#ef5350', // Pastel green for positive, pastel red for negative
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '0.7rem',
            fontWeight: '600',
            border: `1px solid ${isPositive ? '#81c784' : '#e57373'}`, // Lighter pastel green/red for border
            display: 'inline-block',
            lineHeight: '1',
            height: 'fit-content',
            minHeight: 'unset'
          },
          children: value
        }
      };
    
    case 'badge':
      return {
        component: 'chip',
        props: {
          label: value,
          style: {
            ...getStatusColor(value),
            fontWeight: 'bold',
            borderRadius: '6px',
            padding: 0
          }
        }
      };
      
    default:
      return value;
  }
}; 