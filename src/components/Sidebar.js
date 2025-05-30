import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Backdrop,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import FolderIcon from '@mui/icons-material/Folder';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const SIDEBAR_WIDTH = 250;

const Sidebar = ({ open, onToggle, onNavigate }) => {
  const [openDashboards, setOpenDashboards] = useState(true);
  const [openComparables, setOpenComparables] = useState(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  
  // Get user info from localStorage
  const userEmail = localStorage.getItem('email_address') || 'NA@example.com';
  const userFullName = localStorage.getItem('full_name') || 'User';
  
  // Get user initials from email
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  
  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('sessionKey');
    onNavigate('/login');
    handleProfileMenuClose();
  };

  return (
    <>
      {/* Backdrop for closing sidebar when clicking outside */}
      {open && (
        <Backdrop
          open={open}
          onClick={onToggle}
          sx={{
            zIndex: 1100, // less than sidebar zIndex
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.08)',
          }}
        />
      )}
      {/* Open Sidebar Button (only when sidebar is closed) */}
      {!open && (
        <IconButton
          onClick={onToggle}
          sx={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: 2001,
            background: '#f5f5f5',
            color: '#888',
            width: 36,
            height: 36,
            borderRadius: '50%',
            boxShadow: 'none',
            border: '1px solid #e0e0e0',
            '&:hover': { background: '#e0e0e0', color: '#555' },
            transition: 'background 0.2s, color 0.2s',
          }}
          size="medium"
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      )}

      {/* Sidebar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : -SIDEBAR_WIDTH,
          width: SIDEBAR_WIDTH,
          height: '100vh',
          bgcolor: '#fff',
          boxShadow: open ? 3 : 'none',
          zIndex: 1200,
          transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 3. Close Sidebar Icon (top right inside sidebar) */}
        {open && (
          <IconButton
            onClick={onToggle}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2100,
              background: '#f5f5f5',
              color: '#888',
              width: 28,
              height: 28,
              borderRadius: '50%',
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              '&:hover': { background: '#e0e0e0', color: '#555' },
              transition: 'background 0.2s, color 0.2s',
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        {/* Sidebar content: always rendered, but hidden when closed */}
        <Box
          sx={{
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.2s',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
              Vector Dash
            </Typography>
          </Box>
          <Divider />

          {/* Main Navigation */}
          <Box sx={{ pt: 1, px: 1, flex: 1, overflowY: 'auto' }}>
            <List sx={{ flex: 1, p: 1 }}>
              {/* Dashboards Folder */}
              <ListItemButton 
                onClick={() => setOpenDashboards((prev) => !prev)}
                sx={{ borderRadius: '8px', mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FolderIcon sx={{ color: '#6366f1' }} />
                </ListItemIcon>
                <ListItemText primary="Dashboards" />
                {openDashboards ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openDashboards} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton 
                    sx={{ pl: 3, borderRadius: '8px', ml: 1 }} 
                    onClick={() => { onNavigate('/Dash1'); onToggle(); }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DashboardIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard 1" />
                  </ListItemButton>
                  <ListItemButton 
                    sx={{ pl: 3, borderRadius: '8px', ml: 1 }} 
                    onClick={() => { onNavigate('/Dash2'); onToggle(); }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DashboardIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard 2" />
                  </ListItemButton>
                  <ListItemButton 
                    sx={{ pl: 3, borderRadius: '8px', ml: 1 }} 
                    onClick={() => { onNavigate('/ClientDataView'); onToggle(); }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DashboardIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Client Data View" />
                  </ListItemButton>
                </List>
              </Collapse>
              
              {/* Comparables Folder */}
              <ListItemButton 
                onClick={() => setOpenComparables((prev) => !prev)}
                sx={{ borderRadius: '8px', mb: 0.5, mt: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BarChartIcon sx={{ color: '#6366f1' }} />
                </ListItemIcon>
                <ListItemText primary="Comparables" />
                {openComparables ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openComparables} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton 
                    sx={{ pl: 3, borderRadius: '8px', ml: 1 }} 
                    onClick={() => { onNavigate('/Analysis'); onToggle(); }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ListAltIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Analysis" />
                  </ListItemButton>
                  <ListItemButton 
                    sx={{ pl: 3, borderRadius: '8px', ml: 1 }} 
                    onClick={() => { onNavigate('/Listings'); onToggle(); }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ListAltIcon sx={{ color: '#666' }} />
                    </ListItemIcon>
                    <ListItemText primary="Listings" />
                  </ListItemButton>
                </List>
              </Collapse>
              
              {/* Reports direct link (not in a folder) */}
              <ListItemButton
                sx={{ borderRadius: '8px', mb: 0.5, mt: 1 }}
                onClick={() => { onNavigate('/Reports'); onToggle(); }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BarChartIcon sx={{ color: '#6366f1' }} />
                </ListItemIcon>
                <ListItemText primary="Reports" />
              </ListItemButton>
            </List>
          </Box>
          {/* User profile section at the very bottom */}
          <Box 
            sx={{ 
              p: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              borderTop: '1px solid #e0e0e0',
              mt: 'auto',
              zIndex: 2101, // ensure above sidebar
              background: '#fff'
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: '#4a6da7', 
                width: 36, 
                height: 36,
                fontSize: '0.9rem'
              }}
            >
              {getUserInitials(userFullName)}
            </Avatar>
            <Box sx={{ ml: 1.5, flex: 1, overflow: 'hidden' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {userFullName}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#888',
                  fontSize: '0.85em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {userEmail}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleProfileMenuOpen}
              aria-controls="profile-menu"
              aria-haspopup="true"
              sx={{ zIndex: 2102 }} // ensure above sidebar
            >
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              id="profile-menu"
              anchorEl={profileMenuAnchorEl}
              open={Boolean(profileMenuAnchorEl)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              slotProps={{
                paper: { sx: { zIndex: 10500 } }
              }}
            >
              <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Sidebar; 