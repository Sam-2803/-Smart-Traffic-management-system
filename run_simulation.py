#!/usr/bin/env python3
"""
Simulation runner for web interface
Outputs JSON data for real-time updates
"""

import sys
import os
import json
import time
import signal
import threading

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from simulation.environment import TrafficIntersection
from ai_agent.hybrid_controller import HybridFuzzyAIController, FixedTimeController

class WebSimulationRunner:
    def __init__(self, controller_type, parameters):
        self.controller_type = controller_type
        self.parameters = parameters
        self.running = True
        
        # Create intersection
        self.intersection = TrafficIntersection(
            num_lanes_per_direction=parameters.get('lanes_per_direction', 2),
            base_arrival_rate=parameters.get('arrival_rate', 0.4),
            emergency_prob=parameters.get('emergency_prob', 0.02),
            public_transport_prob=parameters.get('public_transport_prob', 0.05)
        )
        
        # Create controller
        if controller_type == 'fixed-time':
            self.controller = FixedTimeController(
                cycle_time=parameters.get('cycle_time', 120)
            )
        elif controller_type == 'fuzzy':
            self.controller = HybridFuzzyAIController(enable_ai=False)
        elif controller_type == 'hybrid-ai':
            self.controller = HybridFuzzyAIController(enable_ai=True)
        else:
            raise ValueError(f"Unknown controller type: {controller_type}")
    
    def run_simulation(self, duration=300):
        """Run simulation and emit real-time data"""
        start_time = time.time()
        step_count = 0
        
        # Setup signal handler for graceful shutdown
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        while self.running and (time.time() - start_time) < duration:
            try:
                # Get current state
                lane_states = self.intersection.get_lane_states()
                signal_timing = self.controller.get_signal_timing(lane_states, training=False)
                
                # Step simulation
                step_metrics = self.intersection.step(signal_timing, 1.0)
                
                # Prepare output data
                output_data = {
                    'step': step_count,
                    'time': time.time() - start_time,
                    'controller_type': self.controller_type,
                    'metrics': {
                        'avg_wait_time': step_metrics['avg_wait_time'],
                        'total_queued': step_metrics['total_queued'],
                        'vehicles_processed': step_metrics['vehicles_processed'],
                        'emissions_rate': step_metrics['emissions_rate']
                    },
                    'lane_states': {
                        'densities': lane_states['density'].tolist(),
                        'wait_times': lane_states['wait_time'].tolist(),
                        'priorities': lane_states['priority'].tolist()
                    },
                    'signal_timing': signal_timing,
                    'performance': self.intersection.get_performance_metrics()
                }
                
                # Output JSON (Node.js will parse this)
                print(json.dumps(output_data), flush=True)
                
                # Update controller if it supports learning
                if hasattr(self.controller, 'update_performance'):
                    self.controller.update_performance(step_metrics)
                
                step_count += 1
                time.sleep(0.1)  # Control update rate
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                error_data = {
                    'error': str(e),
                    'step': step_count,
                    'time': time.time() - start_time
                }
                print(json.dumps(error_data), flush=True)
                break
        
        # Final summary
        final_metrics = self.intersection.get_performance_metrics()
        summary_data = {
            'summary': True,
            'total_steps': step_count,
            'duration': time.time() - start_time,
            'final_metrics': final_metrics,
            'controller_type': self.controller_type
        }
        print(json.dumps(summary_data), flush=True)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.running = False


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python run_simulation.py <controller_type> <parameters_json>'}))
        sys.exit(1)
    
    try:
        controller_type = sys.argv[1]
        parameters = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        duration = parameters.get('duration', 300)
        
        runner = WebSimulationRunner(controller_type, parameters)
        runner.run_simulation(duration)
        
    except Exception as e:
        error_output = {
            'error': f'Simulation failed: {str(e)}',
            'controller_type': sys.argv[1] if len(sys.argv) > 1 else 'unknown'
        }
        print(json.dumps(error_output), flush=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
