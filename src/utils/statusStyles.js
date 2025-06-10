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
      if (value === null || value === undefined || value === '-') {
        return '-';
      }
      
      let formattedDate;
      try {
        // If it's already a Date object, use it directly
        // If it's a string, convert it to a Date object
        const date = value instanceof Date ? value : new Date(value);
        formattedDate = date instanceof Date && !isNaN(date) 
          ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '-';
      } catch (e) {
        formattedDate = '-';
      }

      const shouldStrikethrough = formattedDate === 'Dec 31, 1979';

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
      
      // Format with up to 2 decimal places, but remove unnecessary .00
      let formatted = numValue.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });
      
      return `$${formatted}`;
    
    case 'number':
      if (value === '-') return '-';
      
      const numberValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numberValue)) return '-';
      
      // Format with up to 2 decimal places, but remove unnecessary .00
      return numberValue.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });
    
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
      
      // Clean the value - remove .00 if present
      let cleanValue = value;
      if (typeof value === 'string' && value.endsWith('.00%')) {
        cleanValue = value.replace('.00%', '%');
      } else if (typeof value === 'string' && value.includes('.00')) {
        cleanValue = value.replace('.00', '');
      }
      
      // Check if the value starts with '+' to determine if it's positive
      const isPositive = cleanValue.startsWith('+');
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
          children: cleanValue
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