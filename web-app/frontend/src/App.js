import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Dashboard from './pages/Dashboard';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import FuzzyTester from './pages/FuzzyTester';
import SystemOverview from './pages/SystemOverview';

// Components
import Navigation from './components/Navigation';
import LoadingScreen from './components/LoadingScreen';

// Services
import { trafficApi } from './services/api';

// Styles
import './styles/App.css';

// Create custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff88',
      dark: '#00cc6a',
      light: '#4dffab',
    },
    secondary: {
      main: '#0099ff',
      dark: '#007acc',
      light: '#4db8ff',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a3e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    error: {
      main: '#ff5555',
    },
    warning: {
      main: '#ffb86c',
    },
    info: {
      main: '#8be9fd',
    },
    success: {
      main: '#50fa7b',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.9rem',
    },
    body2: {
      fontSize: '0.8rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 255, 136, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '15px',
          backgroundImage: 'linear-gradient(145deg, rgba(26, 26, 62, 0.8) 0%, rgba(45, 27, 105, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '15px',
          backgroundImage: 'linear-gradient(145deg, rgba(26, 26, 62, 0.8) 0%, rgba(45, 27, 105, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 0.95,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check system health
        const healthResponse = await trafficApi.health();
        setSystemStatus(healthResponse.data);

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to connect to the traffic management system');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="error-screen">
          <div className="error-content">
            <h1>🚫 Connection Error</h1>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <Navigation />
          
          <main className="main-content">
            <AnimatePresence mode="wait">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Navigate to="/dashboard" replace />
                    </motion.div>
                  } 
                />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Dashboard />
                    </motion.div>
                  } 
                />
                
                <Route 
                  path="/simulation" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Simulation />
                    </motion.div>
                  } 
                />
                
                <Route 
                  path="/analytics" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Analytics />
                    </motion.div>
                  } 
                />
                
                <Route 
                  path="/fuzzy-tester" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <FuzzyTester />
                    </motion.div>
                  } 
                />
                
                <Route 
                  path="/system" 
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <SystemOverview />
                    </motion.div>
                  } 
                />
              </Routes>
            </AnimatePresence>
          </main>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(26, 26, 62, 0.9)',
                color: '#ffffff',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
              },
              success: {
                iconTheme: {
                  primary: '#50fa7b',
                  secondary: '#0f0f23',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff5555',
                  secondary: '#0f0f23',
                },
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
