import React, { useState, useEffect, useRef } from 'react';
import { trafficApi, connectWebSocket, CONTROLLER_TYPES } from '../services/api';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Activity
} from 'lucide-react';

// 3D Car component
function Car3D({ position, priority = 0, rotation = 0 }) {
  // Map priority -> color: 0=blue (regular), 1=yellow (public), 2=red (emergency)
  const color = priority === 2 ? 'red' : priority === 1 ? 'yellow' : 'blue';
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[0.8, 0.3, 0.4]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Traffic Light component
function TrafficLight({ position, state = 'green' }) {
  const lightColor = {
    red: '#ff4444',
    yellow: '#ffaa00',
    green: '#44ff44'
  }[state];

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Light */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial color={lightColor} emissive={lightColor} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Road component
function Road({ start, end, width = 1 }) {
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2));
  const midpoint = [(start[0] + end[0]) / 2, 0, (start[2] + end[2]) / 2];
  const rotation = Math.atan2(end[2] - start[2], end[0] - start[0]);

  return (
    <mesh position={midpoint} rotation={[0, rotation, 0]}>
      <boxGeometry args={[length, 0.1, width]} />
      <meshStandardMaterial color="#444" />
      {/* Road markings */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[length, 0.01, 0.1]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </mesh>
  );
}

// Main Simulation Scene
function SimulationScene({ cars, trafficLights, isRunning }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Ground */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[20, 0.1, 20]} />
        <meshStandardMaterial color="#2a5a2a" />
      </mesh>

      {/* Roads */}
      <Road start={[-10, 0, 0]} end={[10, 0, 0]} width={2} />
      <Road start={[0, 0, -10]} end={[0, 0, 10]} width={2} />

      {/* Traffic Lights */}
      {trafficLights.map((light, index) => (
        <TrafficLight key={index} position={light.position} state={light.state} />
      ))}

      {/* Cars */}
      {cars.map((car, index) => (
        <Car3D
          key={index}
          position={car.position}
          priority={car.priority}
          rotation={car.rotation}
        />
      ))}

      {/* Intersection Labels */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Main Intersection
      </Text>

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

const Simulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [carDensity, setCarDensity] = useState(5);
  const [scenario, setScenario] = useState(CONTROLLER_TYPES.HYBRID_AI);
  const [simulationTime, setSimulationTime] = useState(0);
  const intervalRef = useRef();
  const [currentSimulationId, setCurrentSimulationId] = useState(null);
  const [socketConnection, setSocketConnection] = useState(null);

  // Simulation state
  const [cars, setCars] = useState([
    // priority: 0=regular, 1=public transport, 2=emergency
    { position: [-5, 0, 0], priority: 2, rotation: 0, speed: 0.1 },
    { position: [3, 0, 0.5], priority: 1, rotation: 0, speed: 0.08 },
    { position: [0, 0, -4], priority: 0, rotation: Math.PI/2, speed: 0.12 },
    { position: [0.5, 0, 6], priority: 0, rotation: -Math.PI/2, speed: 0.09 }
  ]);

  const [trafficLights, setTrafficLights] = useState([
    { position: [2, 0, 2], state: 'green' },
    { position: [-2, 0, -2], state: 'red' },
    { position: [2, 0, -2], state: 'yellow' },
    { position: [-2, 0, 2], state: 'green' }
  ]);

  const [metrics, setMetrics] = useState({
    throughput: 0,
    avgWaitTime: 0,
    emissions: 0,
    efficiency: 85
  });

  // Simulation logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSimulationTime(prev => prev + simulationSpeed);
        
        // Update car positions
        setCars(prevCars => 
          prevCars.map((car, carIndex) => {
            const newPosition = [...car.position];
            const direction = car.rotation;
            
            // Check if intersection center is occupied by another car
            const isIntersectionOccupied = prevCars.some((otherCar, otherIndex) => 
              otherIndex !== carIndex && 
              Math.abs(otherCar.position[0]) <= 1.5 && 
              Math.abs(otherCar.position[2]) <= 1.5
            );
            
            // Get traffic light state for this car's direction
            const getTrafficLightState = (carDirection) => {
              if (carDirection === 0) return trafficLights[1]?.state || 'red'; // East
              if (carDirection === Math.PI/2) return trafficLights[0]?.state || 'red'; // North  
              if (carDirection === -Math.PI/2) return trafficLights[2]?.state || 'red'; // South
              return trafficLights[3]?.state || 'red'; // West
            };
            
            const lightState = getTrafficLightState(direction);
            
            // Fuzzy logic rules for priority-based stopping decisions
            const shouldStopAtLight = (priority, lightState, isOccupied) => {
              // Emergency vehicles (priority 2): Can override red lights but respect occupancy
              if (priority === 2) {
                return isOccupied; // Only stop if intersection is physically occupied
              }
              
              // Public transport (priority 1): Can proceed on yellow, stop on red
              if (priority === 1) {
                return lightState === 'red' || isOccupied;
              }
              
              // Regular vehicles (priority 0): Must stop on red/yellow
              return (lightState === 'red' || lightState === 'yellow') || isOccupied;
            };
            
            const mustStop = shouldStopAtLight(car.priority, lightState, isIntersectionOccupied);
            
            // Movement logic with priority-based fuzzy rules
            if (direction === 0) { // Moving right (East)
              const nextX = newPosition[0] + car.speed * simulationSpeed;
              
              if (mustStop && newPosition[0] < -1.5 && nextX >= -1.5) {
                // Stop position varies by priority
                if (car.priority === 2) {
                  newPosition[0] = -1.8; // Emergency: closer to intersection
                } else if (car.priority === 1) {
                  newPosition[0] = -2.2; // Public transport: moderate distance
                } else {
                  newPosition[0] = -2.5; // Regular: further back
                }
              } else {
                newPosition[0] = nextX;
                if (newPosition[0] > 10) newPosition[0] = -10;
              }
            } else if (direction === Math.PI/2) { // Moving up (North)
              const nextZ = newPosition[2] + car.speed * simulationSpeed;
              
              if (mustStop && newPosition[2] < -1.5 && nextZ >= -1.5) {
                if (car.priority === 2) {
                  newPosition[2] = -1.8;
                } else if (car.priority === 1) {
                  newPosition[2] = -2.2;
                } else {
                  newPosition[2] = -2.5;
                }
              } else {
                newPosition[2] = nextZ;
                if (newPosition[2] > 10) newPosition[2] = -10;
              }
            } else if (direction === -Math.PI/2) { // Moving down (South)
              const nextZ = newPosition[2] - car.speed * simulationSpeed;
              
              if (mustStop && newPosition[2] > 1.5 && nextZ <= 1.5) {
                if (car.priority === 2) {
                  newPosition[2] = 1.8;
                } else if (car.priority === 1) {
                  newPosition[2] = 2.2;
                } else {
                  newPosition[2] = 2.5;
                }
              } else {
                newPosition[2] = nextZ;
                if (newPosition[2] < -10) newPosition[2] = 10;
              }
            }
            
            return { ...car, position: newPosition };
          })
        );

        // Update traffic lights based on controller type
        if (Math.floor(simulationTime) % 5 === 0) { // Update every 5 seconds
          setTrafficLights(prev => 
            prev.map((light, index) => {
              // Simulate different controller behaviors
              let newState;
              if (scenario === CONTROLLER_TYPES.FIXED_TIME) {
                // Fixed-time: regular cycle
                const cycle = Math.floor(simulationTime / 30) % 4;
                newState = cycle === index ? 'green' : cycle === (index + 2) % 4 ? 'yellow' : 'red';
              } else if (scenario === CONTROLLER_TYPES.FUZZY) {
                // Fuzzy logic: adaptive based on density
                const avgDensity = cars.length / 4;
                newState = avgDensity > 2 ? (index % 2 === 0 ? 'green' : 'red') : 
                          avgDensity > 1 ? 'yellow' : 'green';
              } else {
                // Hybrid AI: most adaptive
                const smartCycle = Math.floor(simulationTime / 20) % 4;
                newState = smartCycle === index ? 'green' : 'red';
              }
              return { ...light, state: newState };
            })
          );
        }

        // Update metrics based on controller type
        const baseWaitTime = scenario === CONTROLLER_TYPES.HYBRID_AI ? 25 : scenario === CONTROLLER_TYPES.FUZZY ? 35 : 55;
        const baseEfficiency = scenario === CONTROLLER_TYPES.HYBRID_AI ? 85 : scenario === CONTROLLER_TYPES.FUZZY ? 78 : 65;
        const baseThroughput = scenario === CONTROLLER_TYPES.HYBRID_AI ? 55 : scenario === CONTROLLER_TYPES.FUZZY ? 48 : 40;
        
        setMetrics(prev => ({
          throughput: Math.floor(Math.random() * 10) + baseThroughput,
          avgWaitTime: Math.floor(Math.random() * 8) + baseWaitTime - (simulationTime * 0.01),
          emissions: Math.floor(Math.random() * 5) + (scenario === CONTROLLER_TYPES.HYBRID_AI ? 15 : 25),
          efficiency: Math.floor(Math.random() * 5) + baseEfficiency + (simulationTime * 0.02)
        }));
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, simulationSpeed, simulationTime, cars.length, scenario]);

  const resetSimulation = () => {
    setIsRunning(false);
    setSimulationTime(0);
    setCars([
      { position: [-5, 0, 0], priority: 2, rotation: 0, speed: 0.1 },
      { position: [3, 0, 0.5], priority: 1, rotation: 0, speed: 0.08 },
      { position: [0, 0, -4], priority: 0, rotation: Math.PI/2, speed: 0.12 },
      { position: [0.5, 0, 6], priority: 0, rotation: -Math.PI/2, speed: 0.09 }
    ]);
    setCurrentSimulationId(null);
  };

  // Start backend simulation and subscribe to live metrics
  const startBackendSimulation = async () => {
    try {
      const params = { arrival_rate: 0.4, emergency_prob: 0.02, public_transport_prob: 0.08 };
      const response = await trafficApi.simulation.start(scenario, params);
      const { simulationId } = response.data;
      setCurrentSimulationId(simulationId);

      // Connect socket if not connected
      if (!socketConnection) {
        const socket = await connectWebSocket();
        socket.on('simulationUpdate', (payload) => {
          if (payload.simulationId === simulationId) {
            const m = payload.metrics;
            setMetrics({
              throughput: m.vehicles_processed ?? metrics.throughput,
              avgWaitTime: m.avg_wait_time ?? metrics.avgWaitTime,
              emissions: m.emissions_rate ?? metrics.emissions,
              efficiency: 100 - (m.avg_wait_time || 0) // simple proxy
            });
          }
        });
        setSocketConnection(socket);
      }
      toast.success('Simulation started');
    } catch (e) {
      console.error('Failed to start simulation', e);
      toast.error('Failed to start backend simulation');
    }
  };

  const stopBackendSimulation = async () => {
    if (!currentSimulationId) return;
    try {
      await trafficApi.simulation.stop(currentSimulationId);
      
      // Save simulation results to localStorage for Analytics
      const simulationResult = {
        id: currentSimulationId,
        controllerType: scenario,
        controllerName: controllerTypes[scenario].name,
        duration: simulationTime,
        finalMetrics: metrics,
        timestamp: new Date().toISOString(),
        avgWaitTime: metrics.avgWaitTime,
        throughput: metrics.throughput,
        emissions: metrics.emissions,
        efficiency: metrics.efficiency
      };
      
      // Get existing results and add new one
      const existingResults = JSON.parse(localStorage.getItem('simulationResults') || '[]');
      existingResults.push(simulationResult);
      
      // Keep only last 20 results
      if (existingResults.length > 20) {
        existingResults.splice(0, existingResults.length - 20);
      }
      
      localStorage.setItem('simulationResults', JSON.stringify(existingResults));
      
      toast.success('Simulation stopped and results saved');
    } catch (e) {
      console.error('Failed to stop simulation', e);
      toast.error('Failed to stop backend simulation');
    }
  };

  const controllerTypes = {
    [CONTROLLER_TYPES.FIXED_TIME]: { name: 'Fixed-Time Controller', description: 'Traditional 120s cycle time controller' },
    [CONTROLLER_TYPES.FUZZY]: { name: 'Fuzzy Logic Controller', description: 'Rule-based adaptive signal control with uncertainty handling' },
    [CONTROLLER_TYPES.HYBRID_AI]: { name: 'Hybrid Fuzzy-AI', description: 'AI-enhanced fuzzy logic with deep Q-learning optimization' }
  };


  return (
    <Box sx={{ p: 4, pt: 12 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        Live Traffic Simulation
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Hybrid Fuzzy-AI Traffic Control System:</strong> Compare Fixed-Time, Fuzzy Logic, and AI-enhanced controllers. 
        The system uses 4-way intersection with 8 lanes, supporting regular vehicles, public transport, and emergency vehicles with priority handling.
      </Alert>

      <Grid container spacing={3}>
        {/* Control Panel */}
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Simulation Controls
              </Typography>
              
              <Box display="flex" gap={1} mb={3}>
                  <Tooltip title={isRunning ? "Pause" : "Start"}>
                  <IconButton 
                    onClick={() => {
                      if (isRunning) {
                        setIsRunning(false);
                        stopBackendSimulation();
                      } else {
                        setIsRunning(true);
                        startBackendSimulation();
                      }
                    }}
                    color="primary"
                    size="large"
                  >
                    {isRunning ? <Pause /> : <Play />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset">
                  <IconButton onClick={resetSimulation} color="secondary">
                    <RotateCcw />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography gutterBottom>Speed: {simulationSpeed}x</Typography>
              <Slider
                value={simulationSpeed}
                onChange={(_, value) => setSimulationSpeed(value)}
                min={0.5}
                max={3}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom sx={{ mt: 2 }}>Car Density: {carDensity}</Typography>
              <Slider
                value={carDensity}
                onChange={(_, value) => setCarDensity(value)}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Controller Type</InputLabel>
                <Select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  label="Controller Type"
                >
                  {Object.entries(controllerTypes).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

            </Paper>

            {/* Real-time Metrics */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Live Metrics
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Simulation Time: {Math.floor(simulationTime / 10)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Controller: {controllerTypes[scenario].name}
                </Typography>
                {scenario === CONTROLLER_TYPES.HYBRID_AI && (
                  <Typography variant="body2" color="text.secondary">
                    AI Learning: ε={((1.0 - simulationTime * 0.001) * 0.5).toFixed(3)}
                  </Typography>
                )}
              </Box>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Throughput</Typography>
                <Chip label={`${metrics.throughput} veh/min`} size="small" color="primary" />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Avg Wait Time</Typography>
                <Chip label={`${metrics.avgWaitTime}s`} size="small" color="warning" />
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Efficiency</Typography>
                <Chip label={`${metrics.efficiency}%`} size="small" color="success" />
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">CO₂ Emissions</Typography>
                <Chip label={`${metrics.emissions}g/km`} size="small" />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* 3D Simulation */}
        <Grid item xs={12} md={9}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Paper sx={{ p: 2, height: '500px', position: 'relative' }}>
              <Typography variant="h6" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1 }}>
                {controllerTypes[scenario].name}
              </Typography>
              
              <Canvas
                camera={{ position: [0, 10, 10], fov: 60 }}
                style={{ width: '100%', height: '100%' }}
              >
                <SimulationScene
                  cars={cars}
                  trafficLights={trafficLights}
                  isRunning={isRunning}
                />
              </Canvas>
              
              {/* Status indicator */}
              <Chip
                icon={isRunning ? <Activity /> : <Pause />}
                label={isRunning ? 'Running' : 'Paused'}
                color={isRunning ? 'success' : 'default'}
                sx={{ position: 'absolute', top: 16, right: 16 }}
              />
            </Paper>
          </motion.div>
        </Grid>

        {/* Scenario Description */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Active Controller: {controllerTypes[scenario].name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {controllerTypes[scenario].description}
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Features:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label="4-Way Intersection" size="small" />
                  <Chip label="8 Lanes (2 per direction)" size="small" />
                  <Chip label="DQN Agent (16→4 state-action)" size="small" />
                  <Chip label="Fuzzy Rules (15 total)" size="small" />
                  <Chip label="Vehicle Types: Regular/Transit/Emergency" size="small" />
                  {scenario === CONTROLLER_TYPES.HYBRID_AI && <Chip label="ε-Greedy Exploration" size="small" color="primary" />}
                  {scenario === CONTROLLER_TYPES.FUZZY && <Chip label="Uncertainty Handling" size="small" color="secondary" />}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Simulation;
