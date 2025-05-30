import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import DraggableContainer from '../components/DraggableContainer'; // Import the new DraggableContainer component
import BarChart from '../components/BarChart'; // Import the new BarChart component

const Dashboard = () => {
  const { id } = useParams(); // Use the useParams hook to get the route parameter
  const [data, setData] = useState(null);

  useEffect(() => {
    // Mock data for demonstration purposes
    const fetchData = async () => {
      const mockData = {
        1: {
          labels: ['January', 'February', 'March', 'April'],
          values: [10, 20, 30, 40],
        },
        2: {
          labels: ['May', 'June', 'July', 'August'],
          values: [15, 25, 35, 45],
        },
      };
      setData(mockData[id]);
    };
    fetchData();
  }, [id]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 60px)', // Adjust for navbar height
        top: '60px', // Offset by navbar height
        backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }}
    >
      <DraggableContainer defaultPosition={{ x: 0, y: 0 }}>
        {data && <BarChart labels={data.labels} values={data.values} />}
      </DraggableContainer>
      <DraggableContainer defaultPosition={{ x: 320, y: 0 }}>
        <Box p={2} bgcolor="background.paper">
          {/* Render table or other components here */}
        </Box>
      </DraggableContainer>
    </div>
  );
};

export default Dashboard; 