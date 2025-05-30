import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Box } from '@mui/material';

const DraggableContainer = ({ 
  children, 
  defaultPosition, 
  noShadow = true,
  componentId = 'default-component',
  dashboardId = 'default-dashboard'
}) => {
  // Generate a unique storage key for this component in this dashboard
  const storageKey = `dashboard-${dashboardId}-component-${componentId}`;
  
  // Grid size for snapping (should match the grid size in the dashboard)
  const gridSize = 20;
  
  // Minimum dimensions to prevent components from becoming too small
  const minWidth = 80;
  const minHeight = 60;
  
  // Initialize position state from localStorage or use default
  const [position, setPosition] = useState(() => {
    try {
      const savedPosition = localStorage.getItem(storageKey);
      let positionData = savedPosition ? JSON.parse(savedPosition) : {
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultPosition.width || 300,
        height: defaultPosition.height || 200,
      };
      
      // Ensure initial position is grid-aligned and respects minimum dimensions
      return {
        x: Math.round(positionData.x / gridSize) * gridSize,
        y: Math.round(positionData.y / gridSize) * gridSize,
        width: Math.max(Math.round(positionData.width / gridSize) * gridSize, minWidth),
        height: Math.max(Math.round(positionData.height / gridSize) * gridSize, minHeight)
      };
    } catch (e) {
      console.error('Error loading saved position', e);
      return {
        x: Math.round(defaultPosition.x / gridSize) * gridSize,
        y: Math.round(defaultPosition.y / gridSize) * gridSize,
        width: Math.max(Math.round((defaultPosition.width || 300) / gridSize) * gridSize, minWidth),
        height: Math.max(Math.round((defaultPosition.height || 200) / gridSize) * gridSize, minHeight),
      };
    }
  });

  // Function to log all dashboard component positions
  const logAllPositions = () => {
    console.log("=== ALL DASHBOARD COMPONENT POSITIONS ===");
    const positions = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`dashboard-${dashboardId}-component-`)) {
        const compId = key.replace(`dashboard-${dashboardId}-component-`, '');
        const pos = JSON.parse(localStorage.getItem(key));
        positions[compId] = pos;
      }
    }
    
    console.log(JSON.stringify(positions, null, 2));
    console.log("=== END POSITIONS ===");
  };

  // Save position to localStorage when it changes
  const savePosition = (newPosition) => {
    // Snap to grid and enforce minimum dimensions
    const snappedPosition = {
      x: Math.round(newPosition.x / gridSize) * gridSize,
      y: Math.round(newPosition.y / gridSize) * gridSize,
      width: Math.max(Math.round(newPosition.width / gridSize) * gridSize, minWidth),
      height: Math.max(Math.round(newPosition.height / gridSize) * gridSize, minHeight)
    };
    
    setPosition(snappedPosition);
    localStorage.setItem(storageKey, JSON.stringify(snappedPosition));
    
    // Log all positions after updating
    logAllPositions();
  };

  return (
    <Rnd
      default={{
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      }}
      position={{ x: position.x, y: position.y }}
      size={{ width: position.width, height: position.height }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="parent"
      dragGrid={[gridSize, gridSize]}
      resizeGrid={[gridSize, gridSize]}
      disableDragging={false}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      onDragStop={(e, d) => {
        savePosition({
          ...position,
          x: d.x,
          y: d.y
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        savePosition({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight
        });
      }}
      style={{
        position: 'absolute',
        zIndex: 1
      }}
    >
      <Box 
        sx={{ 
          height: '100%', 
          width: '100%', 
          p: 0,
          backgroundColor: '#ffffff',
          border: '2px solid #e6e6e6',
          borderRadius: '12px',
          overflow: 'auto',
          boxShadow: noShadow ? 'none' : '0px 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {children}
      </Box>
    </Rnd>
  );
};

export default DraggableContainer; 