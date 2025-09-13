import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Cloud,
  Database,
  Cpu,
  Monitor,
  Wifi,
  Shield,
  Zap,
  Globe,
  Server,
  Smartphone,
  Camera,
  BarChart3,
  GitBranch,
  Settings,
  CheckCircle,
  Code,
  Layers,
  Network
} from 'lucide-react';
import { ExpandMore } from '@mui/icons-material';

const SystemOverview = () => {
  const [activeTab, setActiveTab] = useState(0);

  const systemComponents = [
    {
      name: 'Fuzzy Logic Controller',
      description: 'Rule-based adaptive signal control with uncertainty handling',
      icon: Cpu,
      status: 'Active',
      technology: 'Python, scikit-fuzzy, NumPy',
      specs: 'Input: Density(0-50), Wait(0-180s), Priority(0-2) → Output: Green time(10-120s)'
    },
    {
      name: 'Deep Q-Network Agent',
      description: 'Reinforcement learning for traffic optimization',
      icon: Zap,
      status: 'Active',
      technology: 'TensorFlow, Keras, Experience Replay',
      specs: 'Architecture: 128→64→32→4, State: 16D, Action: 4D, ε-greedy exploration'
    },
    {
      name: 'Traffic Intersection Simulator',
      description: '4-way intersection with realistic vehicle flows',
      icon: Globe,
      status: 'Active',
      technology: 'Python, NumPy, Stochastic modeling',
      specs: '8 lanes (2/direction), Poisson arrivals, 3 vehicle types, Real-time metrics'
    },
    {
      name: 'Hybrid Controller',
      description: 'AI-enhanced fuzzy logic with performance feedback',
      icon: Database,
      status: 'Active',
      technology: 'Python, Integration layer, Target networks',
      specs: 'Combines fuzzy baseline + AI adjustments, Safety bounds (10-120s)'
    },
    {
      name: 'Performance Evaluator',
      description: 'Statistical analysis and controller comparison',
      icon: Monitor,
      status: 'Active',
      technology: 'Pandas, Matplotlib, Statistical tests',
      specs: 'Wait time, throughput, emissions, CO2 tracking, Report generation'
    },
    {
      name: 'Web Dashboard',
      description: 'React-based interface for system monitoring',
      icon: Monitor,
      status: 'Active',
      technology: 'React, Material-UI, Recharts, Three.js',
      specs: 'Real-time charts, 3D visualization, Controller comparison'
    },
    {
      name: 'WebSocket API Server',
      description: 'Node.js backend for real-time communication',
      icon: Server,
      status: 'Active',
      technology: 'Node.js, Express, Socket.IO, Child processes',
      specs: 'Python integration, Real-time data streaming, Simulation control'
    },
    {
      name: 'Vehicle Priority System',
      description: 'Emergency and public transport priority handling',
      icon: Shield,
      status: 'Active',
      technology: 'Enum-based classification, Queue sorting',
      specs: 'Emergency (priority 2), Public transport (1), Regular (0)'
    }
  ];

  const architectureLayers = [
    {
      layer: 'User Interface Layer',
      components: ['React Dashboard', '3D Visualization', 'Analytics Charts', 'Controller Comparison'],
      technologies: ['React.js', 'Material-UI', 'Recharts', 'Three.js', 'Framer Motion'],
      description: 'Interactive web interface for traffic system monitoring and analysis'
    },
    {
      layer: 'API & Communication Layer',
      components: ['Express Server', 'WebSocket Handler', 'Python Integration', 'Real-time Updates'],
      technologies: ['Node.js', 'Express.js', 'Socket.IO', 'Child Process', 'HTTP/REST'],
      description: 'Backend services for real-time communication and Python integration'
    },
    {
      layer: 'Control Intelligence Layer',
      components: ['Fuzzy Logic Controller', 'DQN Agent', 'Hybrid Controller', 'Performance Feedback'],
      technologies: ['scikit-fuzzy', 'TensorFlow/Keras', 'NumPy', 'Experience Replay', 'Target Networks'],
      description: 'AI and fuzzy logic systems for adaptive traffic signal control'
    },
    {
      layer: 'Simulation & Environment Layer',
      components: ['Traffic Intersection', 'Vehicle Generator', 'Signal Controller', 'Performance Tracker'],
      technologies: ['Python Classes', 'Stochastic Modeling', 'Poisson Process', 'Enum-based Types'],
      description: 'Realistic 4-way intersection simulation with multiple vehicle types'
    },
    {
      layer: 'Evaluation & Analytics Layer',
      components: ['Performance Evaluator', 'Statistical Analysis', 'Report Generation', 'Comparison Tools'],
      technologies: ['Pandas', 'Matplotlib', 'Statistical Tests', 'Markdown Reports', 'Data Visualization'],
      description: 'Comprehensive evaluation framework for controller performance analysis'
    },
    {
      layer: 'Data Management Layer',
      components: ['Simulation State', 'Performance Metrics', 'Training Data', 'Result Storage'],
      technologies: ['Python Data Structures', 'JSON', 'CSV Export', 'Memory Management'],
      description: 'Data storage and management for simulation results and training data'
    }
  ];

  const systemSpecs = [
    { metric: 'Fuzzy Input Variables', value: '3', description: 'Density, Wait Time, Priority' },
    { metric: 'Fuzzy Rules', value: '15', description: 'Complete rule coverage for all scenarios' },
    { metric: 'DQN Architecture', value: '128→64→32→4', description: 'Neural network layer sizes with dropout' },
    { metric: 'State Space Dimension', value: '16D', description: 'Lane densities + wait times + priorities + fuzzy outputs' },
    { metric: 'Intersection Lanes', value: '8 lanes', description: '4-way intersection, 2 lanes per direction' },
    { metric: 'Vehicle Types', value: '3 types', description: 'Regular, Public Transport, Emergency' },
    { metric: 'Performance Improvement', value: '~35%', description: 'Hybrid AI vs Fixed-Time wait time reduction' },
    { metric: 'Green Signal Range', value: '10-120s', description: 'Safety bounds for signal timing' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#4caf50';
      case 'Development': return '#ff9800';
      case 'Maintenance': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const ComponentCard = ({ component }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <Card sx={{ height: '100%', cursor: 'pointer' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <component.icon size={40} color="#1976d2" />
            <Chip
              label={component.status}
              size="small"
              sx={{
                backgroundColor: getStatusColor(component.status),
                color: 'white'
              }}
            />
          </Box>
          <Typography variant="h6" gutterBottom>
            {component.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {component.description}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Technology:</strong> {component.technology}
          </Typography>
          <Typography variant="caption" display="block">
            <strong>Specs:</strong> {component.specs}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const LayerCard = ({ layer, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Layers color="#1976d2" />
            <Typography variant="h6">{layer.layer}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {layer.description}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Components:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {layer.components.map((component, idx) => (
                <Chip key={idx} label={component} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Technologies:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {layer.technologies.map((tech, idx) => (
                <Chip key={idx} label={tech} size="small" color="primary" />
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </motion.div>
  );

  return (
    <Box sx={{ p: 4, pt: 12 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        System Architecture
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Comprehensive overview of the Smart Traffic Management System architecture, components, and technical specifications.
      </Alert>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="System Components" icon={<Settings />} />
          <Tab label="Architecture Layers" icon={<Layers />} />
          <Tab label="System Specifications" icon={<BarChart3 />} />
          <Tab label="Data Flow" icon={<GitBranch />} />
        </Tabs>
      </Paper>

      {/* System Components Tab */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Core System Components
          </Typography>
          <Grid container spacing={3}>
            {systemComponents.map((component, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <ComponentCard component={component} />
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* Architecture Layers Tab */}
      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Layered Architecture Overview
          </Typography>
          <Box>
            {architectureLayers.map((layer, index) => (
              <Box key={index} mb={1}>
                <LayerCard layer={layer} index={index} />
              </Box>
            ))}
          </Box>
        </motion.div>
      )}

      {/* System Specifications Tab */}
      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Technical Specifications
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Metric</strong></TableCell>
                  <TableCell><strong>Value</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {systemSpecs.map((spec, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    component={TableRow}
                  >
                    <TableCell>{spec.metric}</TableCell>
                    <TableCell>
                      <Chip label={spec.value} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{spec.description}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      )}

      {/* Data Flow Tab */}
      {activeTab === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            System Data Flow
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Network color="#1976d2" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Simulation Input Sources
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Database size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="Vehicle Generator (Poisson Process)" 
                      secondary="Stochastic vehicle arrivals: Regular, Public Transport, Emergency types"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Cpu size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="Lane State Monitor" 
                      secondary="Real-time density (0-50), wait times (0-180s), priority levels (0-2)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Monitor size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="User Dashboard Interface" 
                      secondary="React frontend for simulation control and performance monitoring"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Server size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="Python Simulation Scripts" 
                      secondary="Main.py, run_simulation.py integration with Node.js backend"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Code color="#1976d2" style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  AI & Control Processing Pipeline
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Zap size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="Fuzzy Logic Inference" 
                      secondary="15 rules process density, wait time, priority → green signal duration"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Cpu size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="DQN Agent Processing" 
                      secondary="128→64→32→4 neural network with ε-greedy exploration and experience replay"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BarChart3 size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="Performance Evaluation" 
                      secondary="Calculate wait time, throughput, CO2 emissions, generate comparison reports"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Globe size={20} /></ListItemIcon>
                    <ListItemText 
                      primary="WebSocket Real-time Streaming" 
                      secondary="Live metrics from Python simulation to React dashboard via Socket.IO"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Integration & Technology Stack
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Cpu size={40} color="#1976d2" />
                  <Typography variant="subtitle2" mt={1}>
                    Python-Node.js Bridge
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Child process integration
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Database size={40} color="#1976d2" />
                  <Typography variant="subtitle2" mt={1}>
                    Memory-based Storage
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    In-memory simulation state
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Zap size={40} color="#1976d2" />
                  <Typography variant="subtitle2" mt={1}>
                    TensorFlow Models
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Keras DQN implementation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <CheckCircle size={40} color="#4caf50" />
                  <Typography variant="subtitle2" mt={1}>
                    Performance Tracking
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pandas-based evaluation
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};

export default SystemOverview;
