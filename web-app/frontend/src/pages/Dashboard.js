import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Speed,
  Timeline,
  EmojiTransportation,
  Psychology,
  Computer,
  TrendingUp,
  Traffic,
  PlayArrow,
} from '@mui/icons-material';
import { trafficApi } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemResponse, performanceResponse] = await Promise.all([
          trafficApi.getSystemInfo(),
          trafficApi.performance.getHistory(),
        ]);
        
        setSystemInfo(systemResponse.data);
        setPerformanceData(performanceResponse.data);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickStart = () => {
    window.location.href = '/simulation';
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress sx={{ mb: 4 }} />
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  const statsCards = [
    {
      title: 'System Status',
      value: 'Online',
      icon: Computer,
      color: '#50fa7b',
      trend: '+100%',
    },
    {
      title: 'Active Controllers',
      value: '3',
      icon: Psychology,
      color: '#00ff88',
      trend: '+0%',
    },
    {
      title: 'Avg Performance',
      value: '87%',
      icon: TrendingUp,
      color: '#0099ff',
      trend: '+12%',
    },
    {
      title: 'Traffic Efficiency',
      value: '94%',
      icon: Speed,
      color: '#ff6b6b',
      trend: '+8%',
    },
  ];

  return (
    <Box sx={{ p: 4, pt: 12, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #00ff88, #0099ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Traffic Control Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Smart Traffic Management with Hybrid Fuzzy-AI Control
          </Typography>
        </Box>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card sx={{ mb: 4, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Traffic sx={{ color: '#00ff88', fontSize: 28 }} />
            <Typography variant="h5" fontWeight={600}>
              Quick Actions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleQuickStart}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #0099ff)',
                color: '#0f0f23',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(45deg, #4dffab, #4db8ff)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 255, 136, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Simulation
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/fuzzy-tester"
              sx={{ px: 3, py: 1.5 }}
            >
              Test Fuzzy Logic
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/analytics"
              sx={{ px: 3, py: 1.5 }}
            >
              View Analytics
            </Button>
          </Box>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card
                  sx={{
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    border: `1px solid ${stat.color}30`,
                    '&:hover': {
                      border: `1px solid ${stat.color}60`,
                      boxShadow: `0 8px 25px ${stat.color}25`,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          background: `${stat.color}20`,
                          color: stat.color,
                          mr: 2,
                        }}
                      >
                        <stat.icon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={stat.trend}
                      size="small"
                      sx={{
                        background: `${stat.color}20`,
                        color: stat.color,
                        fontWeight: 600,
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* System Components */}
      {systemInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '400px', p: 3 }}>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                  System Components
                </Typography>
                <Grid container spacing={2}>
                  {systemInfo.components.map((component, index) => (
                    <Grid item xs={12} sm={6} key={component.name}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            p: 2,
                            height: '120px',
                            border: '1px solid rgba(0, 255, 136, 0.2)',
                            '&:hover': {
                              border: '1px solid rgba(0, 255, 136, 0.4)',
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ mb: 1, color: '#00ff88' }}
                          >
                            {component.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.85rem' }}
                          >
                            {component.description}
                          </Typography>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '400px', p: 3 }}>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                  Objectives Achieved
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {systemInfo.objectives.map((objective, index) => (
                    <motion.div
                      key={objective}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#50fa7b',
                            boxShadow: '0 0 10px #50fa7b',
                          }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                          {objective}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}
    </Box>
  );
};

export default Dashboard;
