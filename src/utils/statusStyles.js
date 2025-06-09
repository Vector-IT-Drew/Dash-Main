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

// Generate blue color based on days until move-out for renewal horizon
export const getRenewalHorizonColor = (dateValue) => {
  if (!dateValue || dateValue === '-') {
    return { color: '#999', backgroundColor: 'transparent' };
  }

  try {
    const moveOutDate = new Date(dateValue);
    const currentDate = new Date();
    
    // Calculate days difference
    const timeDiff = moveOutDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    console.log('🔢 Date calculation:', {
      originalDate: dateValue,
      moveOutDate: moveOutDate.toISOString().split('T')[0],
      currentDate: currentDate.toISOString().split('T')[0],
      daysDiff
    });
    
    // Define color ranges - darker blue for dates further out
    let color, backgroundColor;
    
    if (daysDiff < 0) {
      // Past dates - dark red
      color = '#fff';
      backgroundColor = '#d32f2f';
      console.log('🔴 Past date - red');
    } else if (daysDiff <= 30) {
      // 0-30 days - light blue
      color = '#fff';
      backgroundColor = '#1976d2';
      console.log('🔵 0-30 days - light blue');
    } else if (daysDiff <= 60) {
      // 31-60 days - medium blue
      color = '#fff';
      backgroundColor = '#1565c0';
      console.log('🔵 31-60 days - medium blue');
    } else if (daysDiff <= 90) {
      // 61-90 days - darker blue
      color = '#fff';
      backgroundColor = '#0d47a1';
      console.log('🔵 61-90 days - darker blue');
    } else if (daysDiff <= 180) {
      // 91-180 days - very dark blue
      color = '#fff';
      backgroundColor = '#0a3d8a';
      console.log('🔵 91-180 days - very dark blue');
    } else {
      // 180+ days - darkest blue
      color = '#fff';
      backgroundColor = '#083372';
      console.log('🔵 180+ days - darkest blue');
    }
    
    const styleObject = {
      color,
      backgroundColor,
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '500',
      border: `1px solid ${backgroundColor}`,
      display: 'inline-block',
      minWidth: '70px',
      textAlign: 'center'
    };
    
    console.log('🎨 Final style object:', styleObject);
    return styleObject;
  } catch (e) {
    console.error('❌ Error in getRenewalHorizonColor:', e);
    return { color: '#999', backgroundColor: 'transparent' };
  }
};

// Format cell values for display
export const formatCellValue = (value, type) => {
  // Handle null, undefined, NaN values
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '-';
  }

  switch (type) {
    case 'date':
      let formattedDate;
      try {
        const date = new Date(value);
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
    
    case 'date_color_ascending':
      if (!value || value === '-') {
        return <span style={{ color: '#888', opacity: 0.7 }}>-</span>;
      }
      
      try {
        // Format the date first
        const date = new Date(value);
        const formattedDateColored = date instanceof Date && !isNaN(date) 
          ? `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`
          : '-';
        
        // Apply renewal horizon coloring
        const colorStyle = getRenewalHorizonColor(value);
        console.log('🎨 Applying date_color_ascending for:', value, 'style:', colorStyle);
        
        return (
          <span style={colorStyle}>
            {formattedDateColored}
          </span>
        );
      } catch (e) {
        console.error('❌ Error in date_color_ascending:', e);
        return <span style={{ color: '#888', opacity: 0.7 }}>-</span>;
      }

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