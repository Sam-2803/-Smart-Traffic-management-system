import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Slider, 
  Button, 
  Grid,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { Psychology } from '@mui/icons-material';
import { trafficApi } from '../services/api';
import toast from 'react-hot-toast';

const FuzzyTester = () => {
  const [density, setDensity] = useState(25);
  const [waitTime, setWaitTime] = useState(60);
  const [priority, setPriority] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await trafficApi.fuzzy.test(density, waitTime, priority);
      setResult(response.data.greenTime);
      toast.success('Fuzzy controller test completed!');
    } catch (error) {
      console.error('Fuzzy test failed:', error);
      toast.error('Failed to test fuzzy controller');
    } finally {
      setLoading(false);
    }
  };

  const priorityLabels = ['None', 'Public Transport', 'Emergency'];

  return (
    <Box sx={{ p: 4, pt: 12, minHeight: '100vh' }}>
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
            <Psychology sx={{ mr: 2, fontSize: '1em', verticalAlign: 'middle' }} />
            Fuzzy Logic Tester
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Test the fuzzy logic controller with different traffic scenarios
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Input Parameters
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#00ff88' }}>
                  Traffic Density: {density} vehicles/lane
                </Typography>
                <Slider
                  value={density}
                  onChange={(_, value) => setDensity(value)}
                  min={0}
                  max={50}
                  step={1}
                  sx={{ color: '#00ff88' }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#0099ff' }}>
                  Average Wait Time: {waitTime} seconds
                </Typography>
                <Slider
                  value={waitTime}
                  onChange={(_, value) => setWaitTime(value)}
                  min={0}
                  max={180}
                  step={1}
                  sx={{ color: '#0099ff' }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff6b6b' }}>
                  Priority Level: {priorityLabels[priority]}
                </Typography>
                <Slider
                  value={priority}
                  onChange={(_, value) => setPriority(value)}
                  min={0}
                  max={2}
                  step={1}
                  marks={[
                    { value: 0, label: 'None' },
                    { value: 1, label: 'Public' },
                    { value: 2, label: 'Emergency' }
                  ]}
                  sx={{ color: '#ff6b6b' }}
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleTest}
                disabled={loading}
                fullWidth
                sx={{
                  background: 'linear-gradient(45deg, #00ff88, #0099ff)',
                  color: '#0f0f23',
                  fontWeight: 600,
                  py: 2,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4dffab, #4db8ff)',
                  },
                }}
              >
                {loading ? 'Testing...' : 'Test Fuzzy Controller'}
              </Button>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Fuzzy Controller Output
              </Typography>

              {result !== null && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3,
                    background: 'rgba(80, 250, 123, 0.1)',
                    border: '1px solid rgba(80, 250, 123, 0.3)',
                    color: '#50fa7b',
                  }}
                >
                  <Typography variant="h4" fontWeight={700}>
                    {result.toFixed(1)} seconds
                  </Typography>
                  <Typography variant="body2">
                    Recommended green signal duration
                  </Typography>
                </Alert>
              )}

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  How it works:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                  The fuzzy logic controller uses three input variables:
                </Typography>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li><strong>Traffic Density:</strong> Number of vehicles waiting in lane</li>
                  <li><strong>Wait Time:</strong> Average waiting time per vehicle</li>
                  <li><strong>Priority Level:</strong> Special vehicle priority (emergency, public transport)</li>
                </ul>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  These inputs are processed through fuzzy membership functions and inference rules
                  to determine the optimal green signal duration that balances traffic flow,
                  minimizes waiting times, and prioritizes emergency vehicles.
                </Typography>
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FuzzyTester;
