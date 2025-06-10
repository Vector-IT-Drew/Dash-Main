import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

/**
 * tabs: [{ label: string, value: string }]
 * selectedTab: string
 * onTabChange: (tabValue: string|null) => void
 */
const QuickFilterTabs = ({ tabs = [], selectedTab, onTabChange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center'}}>
      <ToggleButtonGroup
        value={selectedTab}
        exclusive
        onChange={(e, newValue) => {
          if (selectedTab === newValue) onTabChange(null);
          else onTabChange(newValue);
        }}
        sx={{
          background: 'transparent',
          borderRadius: 999,
          boxShadow: 'none',
          px: 0,
          mx: 0,
        }}
      >
        {tabs.map(tab => (
          <ToggleButton
            key={tab.value}
            value={tab.value}
            sx={theme => ({
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.92rem',
              px: 2,
              py: 0,
              my: 0,
              border: '1.5px solid',
              borderColor: selectedTab === tab.value ? theme.palette.primary.main : '#ccc',
              borderRadius: 0,
              color: selectedTab === tab.value ? '#fff' : '#666',
              backgroundColor: selectedTab === tab.value ? 'rgba(25, 118, 210, 0.85)' : 'transparent',
              '&.Mui-selected': {
                color: '#fff',
                backgroundColor: 'rgba(25, 118, 210, 0.85)',
                borderColor: 'rgba(25, 118, 210, 0.85)',
              },
              '&:hover': {
                backgroundColor: selectedTab === tab.value ? 'rgba(25, 118, 210, 0.95)' : '#f8f8f8',
                borderColor: selectedTab === tab.value ? 'rgba(25, 118, 210, 0.95)' : '#999',
              },
              minWidth: 80,
              height: 32,
              lineHeight: 1,
              transition: 'all 0.15s',
              borderLeftWidth: '1.5px',
              borderLeftStyle: 'solid',
              borderTopLeftRadius: tab === tabs[0] ? 999 : 0,
              borderBottomLeftRadius: tab === tabs[0] ? 999 : 0,
              borderTopRightRadius: tab === tabs[tabs.length-1] ? 999 : 0,
              borderBottomRightRadius: tab === tabs[tabs.length-1] ? 999 : 0,
            })}
          >
            {tab.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default QuickFilterTabs; 