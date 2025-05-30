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

const Sidebar = ({ open, onToggle, onNavigate }) => {
  const [openDashboards, setOpenDashboards] = useState(true);
  const [openComparables, setOpenComparables] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  
  // Get user email from localStorage or use default
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  
  // Get user initials from email
  const getUserInitials = (email) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    return parts.map(part => part[0]).join('').toUpperCase();
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
    <Box
      sx={{
        width: open ? 250 : 0,
        bgcolor: '#f8fafd',
        height: '100vh',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        zIndex: 1200,
      }}
    >
      {/* Toggle button: always visible, position depends on open/closed */}
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'fixed',
          top: 10,
          left: open ? 250 - 40 : 10, // 250px sidebar - 40px button width
          zIndex: 2000,
          bgcolor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.10)',
          transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
          '&:hover': { bgcolor: '#f5f5f5' },
        }}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>

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
                sx={{ pl: 4, borderRadius: '8px', ml: 1 }} 
                onClick={() => onNavigate('/Dash1')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DashboardIcon sx={{ color: '#666' }} />
                </ListItemIcon>
                <ListItemText primary="Dashboard 1" />
              </ListItemButton>
              <ListItemButton 
                sx={{ pl: 4, borderRadius: '8px', ml: 1 }} 
                onClick={() => onNavigate('/Dash2')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DashboardIcon sx={{ color: '#666' }} />
                </ListItemIcon>
                <ListItemText primary="Dashboard 2" />
              </ListItemButton>
              <ListItemButton 
                sx={{ pl: 4, borderRadius: '8px', ml: 1 }} 
                onClick={() => onNavigate('/ClientDataView')}
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
                sx={{ pl: 4, borderRadius: '8px', ml: 1 }} 
                onClick={() => onNavigate('/Analysis')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <ListAltIcon sx={{ color: '#666' }} />
                </ListItemIcon>
                <ListItemText primary="Analysis" />
              </ListItemButton>
              <ListItemButton 
                sx={{ pl: 4, borderRadius: '8px', ml: 1 }} 
                onClick={() => onNavigate('/Listings')}
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
            onClick={() => onNavigate('/Reports')}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BarChartIcon sx={{ color: '#6366f1' }} />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        </List>
        
        {/* User profile section */}
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            borderTop: '1px solid #e0e0e0',
            mt: 'auto'
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
            {getUserInitials(userEmail)}
          </Avatar>
          <Box sx={{ ml: 1.5, flex: 1, overflow: 'hidden' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'medium',
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
          >
            <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar; 