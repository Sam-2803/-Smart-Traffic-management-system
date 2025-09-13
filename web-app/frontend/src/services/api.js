import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const trafficApi = {
  // Health check
  health: () => api.get('/health'),

  // System information
  getSystemInfo: () => api.get('/system-info'),

  // Simulation endpoints
  simulation: {
    start: (controllerType, parameters) => 
      api.post('/simulation/start', { controllerType, parameters }),
    
    stop: (simulationId) => 
      api.post(`/simulation/stop/${simulationId}`),
    
    getStatus: (simulationId) => 
      api.get(`/simulation/${simulationId}/status`),
  },

  // Fuzzy controller testing
  fuzzy: {
    test: (density, waitTime, priority) => 
      api.post('/fuzzy/test', { density, waitTime, priority }),
  },

  // Performance comparison
  comparison: {
    run: (duration = 600) => 
      api.post('/comparison/run', { duration }),
  },

  // Performance data
  performance: {
    getHistory: () => api.get('/performance/history'),
  },
};

// WebSocket connection utility
export const connectWebSocket = () => {
  const socketUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
  
  // Dynamically import socket.io-client to avoid SSR issues
  return import('socket.io-client').then(({ io }) => {
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
    });

    return socket;
  });
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || data?.error || `HTTP ${status} Error`,
      details: data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'No response from server. Please check your connection.',
      details: null,
    };
  } else {
    // Request setup error
    return {
      status: -1,
      message: error.message || 'An unexpected error occurred',
      details: null,
    };
  }
};

// Controller type mapping
export const CONTROLLER_TYPES = {
  FIXED_TIME: 'fixed-time',
  FUZZY: 'fuzzy',
  HYBRID_AI: 'hybrid-ai',
};

export const CONTROLLER_NAMES = {
  [CONTROLLER_TYPES.FIXED_TIME]: 'Fixed-Time Controller',
  [CONTROLLER_TYPES.FUZZY]: 'Pure Fuzzy Logic',
  [CONTROLLER_TYPES.HYBRID_AI]: 'Hybrid Fuzzy-AI',
};

// Default simulation parameters
export const DEFAULT_SIMULATION_PARAMS = {
  lanes_per_direction: 2,
  arrival_rate: 0.4,
  emergency_prob: 0.02,
  public_transport_prob: 0.05,
  cycle_time: 120,
  duration: 300,
};

export default api;
