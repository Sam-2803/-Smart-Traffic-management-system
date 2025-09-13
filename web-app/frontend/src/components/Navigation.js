import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Box,
  Badge,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Dashboard,
  PlayArrow,
  Analytics,
  Settings,
  Menu,
  Close,
  Traffic,
  Computer,
  PsychologyAlt,
} from '@mui/icons-material';

const navigationItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: Dashboard,
    description: 'System overview and real-time metrics'
  },
  {
    title: 'Live Simulation',
    path: '/simulation', 
    icon: PlayArrow,
    description: 'Run traffic simulations in real-time'
  },
  {
    title: 'Analytics',
    path: '/analytics',
    icon: Analytics,
    description: 'Performance analysis and comparisons'
  },
  {
    title: 'Fuzzy Tester',
    path: '/fuzzy-tester',
    icon: PsychologyAlt,
    description: 'Test fuzzy logic controller'
  },
  {
    title: 'System Architecture',
    path: '/system',
    icon: Computer,
    description: 'System components and documentation'
  },
];

const Navigation = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          background: 'linear-gradient(90deg, rgba(26, 26, 62, 0.95) 0%, rgba(45, 27, 105, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #0099ff)',
                color: '#0f0f23',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4dffab, #4db8ff)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {drawerOpen ? <Close /> : <Menu />}
            </IconButton>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Traffic sx={{ color: '#00ff88', fontSize: 32 }} />
                <Typography 
                  variant="h5" 
                  component="div"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #00ff88, #0099ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Smart Traffic Management
                </Typography>
              </Box>
            </motion.div>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge 
              badgeContent="AI" 
              sx={{
                '& .MuiBadge-badge': {
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  color: 'white',
                  fontWeight: 'bold',
                },
              }}
            >
              <Tooltip title="System Status: Online">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#50fa7b',
                    boxShadow: '0 0 10px #50fa7b',
                    animation: 'pulse 2s infinite',
                  }}
                />
              </Tooltip>
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: 300,
            background: 'linear-gradient(180deg, rgba(15, 15, 35, 0.98) 0%, rgba(26, 26, 62, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderLeft: 'none',
          },
        }}
      >
        <Box sx={{ pt: 10, px: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              px: 2, 
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 300,
            }}
          >
            Navigation
          </Typography>

          <List>
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: '12px',
                        mx: 1,
                        background: active ? 
                          'linear-gradient(45deg, rgba(0, 255, 136, 0.1), rgba(0, 153, 255, 0.1))' : 
                          'transparent',
                        border: active ? 
                          '1px solid rgba(0, 255, 136, 0.3)' : 
                          '1px solid transparent',
                        '&:hover': {
                          background: 'linear-gradient(45deg, rgba(0, 255, 136, 0.05), rgba(0, 153, 255, 0.05))',
                          border: '1px solid rgba(0, 255, 136, 0.2)',
                          transform: 'translateX(8px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <ListItemIcon>
                        <Icon 
                          sx={{ 
                            color: active ? '#00ff88' : 'rgba(255, 255, 255, 0.7)',
                            transition: 'color 0.3s ease',
                          }} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.description}
                        primaryTypographyProps={{
                          fontWeight: active ? 600 : 400,
                          color: active ? '#00ff88' : 'rgba(255, 255, 255, 0.9)',
                        }}
                        secondaryTypographyProps={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '0.75rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
