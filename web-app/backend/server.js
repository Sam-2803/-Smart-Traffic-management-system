const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store active simulations
const activeSimulations = new Map();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Traffic Management API is running' });
});

// Get system architecture info
app.get('/api/system-info', (req, res) => {
  res.json({
    components: [
      {
        name: 'Fuzzy Logic Controller',
        description: 'Handles uncertainty with expert rules',
        inputs: ['Traffic Density (0-50)', 'Wait Time (0-180s)', 'Priority (0-2)'],
        output: 'Green signal duration (10-120s)'
      },
      {
        name: 'Deep Q-Network Agent', 
        description: 'AI optimization with reinforcement learning',
        stateSpace: '16-dimensional',
        actionSpace: '4-dimensional adjustment factors',
        architecture: '128→64→32→4 neurons'
      },
      {
        name: 'Traffic Simulation',
        description: '4-way intersection with realistic vehicle flows',
        features: ['Stochastic arrivals', 'Multiple vehicle types', 'Real-time metrics']
      }
    ],
    objectives: [
      'Real-time adaptive signal control',
      'Uncertainty handling via fuzzy logic', 
      'AI-based optimization over time',
      'Priority vehicle support',
      'Environmental impact reduction',
      'Performance benchmarking'
    ]
  });
});

// Start traffic simulation
app.post('/api/simulation/start', async (req, res) => {
  try {
    const { controllerType, parameters } = req.body;
    const simulationId = `sim_${Date.now()}`;
    
    // Python script path
    const pythonScript = path.join(__dirname, '..', '..', 'run_simulation.py');
    
    // Start Python simulation process
    const pythonProcess = spawn('python', [pythonScript, controllerType, JSON.stringify(parameters)]);
    
    // Store simulation process
    activeSimulations.set(simulationId, {
      process: pythonProcess,
      controllerType,
      parameters,
      startTime: new Date(),
      status: 'running'
    });
    
    // Handle Python output
    pythonProcess.stdout.on('data', (data) => {
      try {
        const output = data.toString().trim();
        if (output) {
          const metrics = JSON.parse(output);
          io.emit('simulationUpdate', {
            simulationId,
            metrics,
            timestamp: new Date()
          });
        }
      } catch (e) {
        console.log('Python output:', data.toString());
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Simulation ${simulationId} closed with code ${code}`);
      const sim = activeSimulations.get(simulationId);
      if (sim) {
        sim.status = 'completed';
        activeSimulations.set(simulationId, sim);
      }
    });
    
    res.json({
      simulationId,
      status: 'started',
      controllerType,
      parameters
    });
    
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});

// Stop simulation
app.post('/api/simulation/stop/:id', (req, res) => {
  const simulationId = req.params.id;
  const simulation = activeSimulations.get(simulationId);
  
  if (simulation && simulation.process) {
    simulation.process.kill();
    simulation.status = 'stopped';
    activeSimulations.set(simulationId, simulation);
    
    res.json({ status: 'stopped', simulationId });
  } else {
    res.status(404).json({ error: 'Simulation not found' });
  }
});

// Get simulation status
app.get('/api/simulation/:id/status', (req, res) => {
  const simulationId = req.params.id;
  const simulation = activeSimulations.get(simulationId);
  
  if (simulation) {
    res.json({
      simulationId,
      status: simulation.status,
      controllerType: simulation.controllerType,
      startTime: simulation.startTime,
      parameters: simulation.parameters
    });
  } else {
    res.status(404).json({ error: 'Simulation not found' });
  }
});

// Run controller comparison
app.post('/api/comparison/run', async (req, res) => {
  try {
    const { duration = 600 } = req.body;
    
    // Run comparison script
    const comparisonScript = path.join(__dirname, '..', '..', 'run_comparison.py');
    const pythonProcess = spawn('python', [comparisonScript, duration.toString()]);
    
    let results = '';
    
    pythonProcess.stdout.on('data', (data) => {
      results += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const comparisonResults = JSON.parse(results);
          res.json(comparisonResults);
        } catch (e) {
          res.json({ raw: results });
        }
      } else {
        res.status(500).json({ error: 'Comparison failed' });
      }
    });
    
  } catch (error) {
    console.error('Error running comparison:', error);
    res.status(500).json({ error: 'Failed to run comparison' });
  }
});

// Test fuzzy controller
app.post('/api/fuzzy/test', async (req, res) => {
  try {
    const { density, waitTime, priority } = req.body;
    
    const testScript = path.join(__dirname, '..', '..', 'test_fuzzy.py');
    const pythonProcess = spawn('python', [testScript, density, waitTime, priority]);
    
    let result = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ greenTime: parseFloat(result.trim()) });
      } else {
        res.status(500).json({ error: 'Fuzzy test failed' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to test fuzzy controller' });
  }
});

// Get historical performance data
app.get('/api/performance/history', (req, res) => {
  // Mock historical data - in real implementation, this would come from database
  const mockData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    avgWaitTime: Math.random() * 30 + 10,
    throughput: Math.random() * 50 + 150,
    emissions: Math.random() * 2 + 1,
    controllerType: ['Fixed-Time', 'Fuzzy Logic', 'Hybrid AI'][i % 3]
  }));
  
  res.json(mockData);
});

// Socket.IO connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinSimulation', (simulationId) => {
    socket.join(simulationId);
    console.log(`Socket ${socket.id} joined simulation ${simulationId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚦 Smart Traffic Management API running on port ${PORT}`);
  console.log(`📊 Dashboard will be available at http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  
  // Kill all active simulations
  activeSimulations.forEach((sim, id) => {
    if (sim.process && !sim.process.killed) {
      sim.process.kill();
      console.log(`Killed simulation ${id}`);
    }
  });
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
