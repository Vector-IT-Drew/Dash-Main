import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Navbar = ({ children }) => {
  return (
    <AppBar position="fixed" sx={{ backgroundColor: '#3f51b5', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {children}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          My Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
