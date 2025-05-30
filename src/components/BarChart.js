import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ labels, values }) => {
  return (
    <Box p={2} bgcolor="background.paper" sx={{ height: '100%', width: '100%' }}>
      <Bar
        data={{
          labels: labels,
          datasets: [
            {
              label: 'Sample Data',
              data: values,
              backgroundColor: 'rgba(75,192,192,0.4)',
            },
          ],
        }}
        options={{
          maintainAspectRatio: false, // Allow the chart to resize
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: true,
              text: 'Bar Chart Example',
            },
          },
        }}
      />
    </Box>
  );
};

export default BarChart;
