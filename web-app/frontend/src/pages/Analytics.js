import React, { useState, useEffect } from 'react';
import { trafficApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Car,
  CheckCircle
} from 'lucide-react';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState([]);

  // Load simulation results from localStorage
  useEffect(() => {
    const loadSimulationResults = () => {
      setLoading(true);
      try {
        const results = JSON.parse(localStorage.getItem('simulationResults') || '[]');
        setSimulationResults(results);
      } catch (error) {
        console.error('Failed to load simulation results:', error);
        toast.error('Failed to load simulation results');
      } finally {
        setLoading(false);
      }
    };

    loadSimulationResults();
    
    // Refresh data every 5 seconds in case new simulations are run
    const interval = setInterval(loadSimulationResults, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Calculate performance data from actual simulation results
  const calculatePerformanceData = () => {
    if (simulationResults.length === 0) {
      // Fallback data if no simulations have been run
      return {
        controllerPerformanceData: [
          { time: 'No Data', 'Fixed-Time': 0, 'Fuzzy Logic': 0, 'Hybrid AI': 0, throughput: 0 }
        ],
        intersectionDirections: [
          { name: 'Run simulations to see data', density: 0, waitTime: 0, controller: 'None', efficiency: 0 }
        ],
        vehicleTypeData: [
          { type: 'No simulations run yet', count: 0, color: '#cccccc' }
        ],
        systemMetrics: {
          totalDirections: 4,
          activeLanes: 8,
          avgWaitTime: '0s',
          systemEfficiency: 0,
          vehiclesProcessed: 0,
          co2Reduction: 0,
          aiLearningRate: 'ε=0.000',
          fuzzyRules: 15
        }
      };
    }

    // Group results by controller type
    const groupedResults = simulationResults.reduce((acc, result) => {
      const key = result.controllerName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    }, {});

    // Create performance comparison data
    const controllerPerformanceData = simulationResults.slice(-10).map((result, index) => {
      const timeLabel = new Date(result.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return {
        time: timeLabel,
        [result.controllerName]: result.avgWaitTime,
        throughput: result.throughput
      };
    });

    // Calculate average metrics by controller type
    const controllerAverages = Object.entries(groupedResults).map(([controller, results]) => {
      const avgWaitTime = results.reduce((sum, r) => sum + r.avgWaitTime, 0) / results.length;
      const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;
      const avgEfficiency = results.reduce((sum, r) => sum + r.efficiency, 0) / results.length;
      
      return {
        name: `${controller} (${results.length} runs)`,
        density: Math.floor(Math.random() * 20) + 10, // Simulated density
        waitTime: Math.round(avgWaitTime * 10) / 10,
        controller: controller,
        efficiency: Math.round(avgEfficiency)
      };
    });

    // Calculate total vehicles processed (simulated breakdown)
    const totalVehicles = simulationResults.reduce((sum, r) => sum + (r.throughput * (r.duration / 60)), 0);
    const regularVehicles = Math.floor(totalVehicles * 0.88);
    const publicTransport = Math.floor(totalVehicles * 0.08);
    const emergencyVehicles = Math.floor(totalVehicles * 0.04);

    const vehicleTypeData = [
      { type: 'Regular Vehicles', count: regularVehicles, color: '#4caf50' },
      { type: 'Public Transport', count: publicTransport, color: '#ff9800' },
      { type: 'Emergency Vehicles', count: emergencyVehicles, color: '#f44336' },
      { type: 'Priority Handled', count: publicTransport + emergencyVehicles, color: '#9c27b0' }
    ];

    // Calculate overall system metrics
    const avgWaitTime = simulationResults.reduce((sum, r) => sum + r.avgWaitTime, 0) / simulationResults.length;
    const avgEfficiency = simulationResults.reduce((sum, r) => sum + r.efficiency, 0) / simulationResults.length;
    const totalProcessed = Math.floor(totalVehicles);
    const co2Reduction = Math.max(0, 25 - (avgWaitTime * 0.5)); // Estimated CO2 reduction

    const systemMetrics = {
      totalDirections: 4,
      activeLanes: 8,
      avgWaitTime: `${Math.round(avgWaitTime * 10) / 10}s`,
      systemEfficiency: Math.round(avgEfficiency),
      vehiclesProcessed: totalProcessed,
      co2Reduction: Math.round(co2Reduction * 10) / 10,
      aiLearningRate: `ε=${(0.5 - (simulationResults.length * 0.02)).toFixed(3)}`,
      fuzzyRules: 15
    };

    return {
      controllerPerformanceData,
      intersectionDirections: controllerAverages,
      vehicleTypeData,
      systemMetrics
    };
  };

  const {
    controllerPerformanceData,
    intersectionDirections,
    vehicleTypeData,
    systemMetrics
  } = calculatePerformanceData();


  const MetricCard = ({ title, value, change, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ opacity: 0.8 }}>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {value}
              </Typography>
              {change && (
                <Box display="flex" alignItems="center" mt={1}>
                  {change > 0 ? (
                    <TrendingUp size={16} style={{ color: '#4caf50' }} />
                  ) : (
                    <TrendingDown size={16} style={{ color: '#f44336' }} />
                  )}
                  <Typography variant="body2" ml={0.5}>
                    {Math.abs(change)}%
                  </Typography>
                </Box>
              )}
            </Box>
            <Icon size={40} style={{ opacity: 0.6 }} />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 4, pt: 12 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {simulationResults.length > 0 
              ? `Showing data from ${simulationResults.length} simulation${simulationResults.length !== 1 ? 's' : ''}`
              : 'No simulation data available - run simulations to see analytics'
            }
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {simulationResults.length > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem('simulationResults');
                setSimulationResults([]);
                toast.success('Analytics data cleared');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Data
            </button>
          )}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Efficiency"
            value={`${systemMetrics.systemEfficiency}%`}
            change={12}
            icon={TrendingUp}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Vehicles Processed"
            value={systemMetrics.vehiclesProcessed.toLocaleString()}
            change={8}
            icon={Car}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Wait Time"
            value={systemMetrics.avgWaitTime}
            change={-15}
            icon={Clock}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CO₂ Reduction"
            value={`${systemMetrics.co2Reduction}%`}
            change={5}
            icon={CheckCircle}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Traffic Flow Chart */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Controller Performance Comparison
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average wait times by controller type over 24 hours
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={controllerPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis label={{ value: 'Wait Time (s)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {simulationResults.length > 0 ? (
                    // Dynamic areas based on actual controller types used
                    Object.keys(controllerPerformanceData[0] || {})
                      .filter(key => key !== 'time' && key !== 'throughput')
                      .map((controllerKey, index) => {
                        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12', '#9b59b6'];
                        return (
                          <Area
                            key={controllerKey}
                            type="monotone"
                            dataKey={controllerKey}
                            stackId={index + 1}
                            stroke={colors[index % colors.length]}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.6}
                            name={`${controllerKey} (Wait Time)`}
                          />
                        );
                      })
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="No Data"
                      stroke="#cccccc"
                      fill="#cccccc"
                      fillOpacity={0.6}
                      name="No Simulation Data"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Violation Types */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vehicle Types Processed
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Priority vehicle handling and regular traffic
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ type, count }) => `${type}: ${count}`}
                  >
                    {vehicleTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Intersection Performance */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Direction Performance (4-Way Intersection)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Real-time metrics by intersection direction and active controller
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={intersectionDirections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Wait Time (s)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="waitTime" fill="#8884d8" name="Avg Wait Time (s)" />
                </BarChart>
              </ResponsiveContainer>
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Active Controllers by Direction:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {intersectionDirections.map((direction, index) => (
                    <Chip
                      key={index}
                      label={`${direction.name}: ${direction.controller}`}
                      size="small"
                      sx={{
                        backgroundColor: direction.controller === 'Hybrid AI' ? '#4caf50' : 
                                       direction.controller === 'Fuzzy Logic' ? '#ff9800' : '#f44336',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
