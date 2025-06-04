import React from 'react';

export default function MiniChart({ data, xAxis, yAxis, color = '#1976d2' }) {
  console.log('📊 MiniChart received:', { data, xAxis, yAxis, dataLength: data.length });
  
  if (!data || data.length === 0) {
    return null;
  }

  const height = 40;
  const padding = 5;

  // Extract Y values
  const yValues = data.map(d => d.y);
  console.log('📈 Y Values:', yValues);
  console.log('📊 Y Values sample:', yValues.slice(0, 5));

  if (yValues.length === 0) return null;

  // Calculate range
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const range = maxY - minY;
  
  console.log('📊 Chart range:', { minY, maxY, range });

  if (range === 0) {
    // All values are the same, draw a flat line
    const y = height / 2;
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <svg width="100%" height={height} viewBox={`0 0 200 ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <line 
            x1={padding} 
            y1={y} 
            x2={200 - padding} 
            y2={y} 
            stroke={color} 
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // Create points for the line using viewBox coordinates
  const viewBoxWidth = 200;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (viewBoxWidth - 2 * padding);
    const y = padding + ((maxY - d.y) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  console.log('📈 SVG Points (first 3):', points.split(' ').slice(0, 3));
  console.log('📊 Chart dimensions:', { width: '100%', height, padding, pointsCount: data.length });

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${viewBoxWidth} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}