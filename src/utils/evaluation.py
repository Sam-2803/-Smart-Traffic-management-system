import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns


@dataclass
class EvaluationMetrics:
    """Container for traffic control performance metrics."""
    
    # Primary metrics
    average_wait_time: float
    max_wait_time: float
    total_throughput: int
    queue_length_mean: float
    queue_length_max: int
    
    # Efficiency metrics
    fuel_consumption_liters: float
    co2_emissions_kg: float
    throughput_per_minute: float
    
    # Priority handling
    emergency_response_time: float
    public_transport_delay: float
    
    # System performance
    controller_response_time: float
    signal_change_frequency: int


class TrafficEvaluator:
    """
    Comprehensive evaluation system for traffic control strategies.
    
    Compares different controllers and provides detailed performance analysis.
    """
    
    def __init__(self):
        self.evaluation_history: List[Dict[str, Any]] = []
        self.controller_names = []
        
    def evaluate_controller(self,
                           controller,
                           simulation_env,
                           controller_name: str,
                           simulation_duration: float = 3600.0,  # 1 hour
                           time_step: float = 1.0,
                           traffic_scenarios: Optional[List[Dict]] = None) -> EvaluationMetrics:
        """
        Evaluate a traffic controller's performance.
        
        Args:
            controller: Traffic controller instance
            simulation_env: Traffic simulation environment
            controller_name: Name identifier for the controller
            simulation_duration: Total simulation time in seconds
            time_step: Simulation time step
            traffic_scenarios: List of traffic scenario configurations
            
        Returns:
            EvaluationMetrics object with performance results
        """
        print(f"Evaluating {controller_name}...")
        
        # Reset environment and controller
        simulation_env.reset()
        if hasattr(controller, 'reset'):
            controller.reset()
        if hasattr(controller, 'reset_episode'):
            controller.reset_episode()
            
        # Tracking variables
        total_steps = int(simulation_duration / time_step)
        wait_times = []
        queue_lengths = []
        throughputs = []
        emergency_response_times = []
        public_transport_delays = []
        signal_changes = 0
        prev_signals = None
        
        # Apply traffic scenarios if provided
        if traffic_scenarios:
            self._apply_traffic_scenarios(simulation_env, traffic_scenarios, simulation_duration)
        
        # Run simulation
        for step in range(total_steps):
            # Get current traffic state
            lane_states = simulation_env.get_lane_states()
            
            # Get controller decisions
            start_time = datetime.now()
            signal_timing = controller.get_signal_timing(lane_states, training=False)
            controller_time = (datetime.now() - start_time).total_seconds()
            
            # Count signal changes
            if prev_signals is not None:
                if not self._signals_equal(prev_signals, signal_timing):
                    signal_changes += 1
            prev_signals = signal_timing.copy()
            
            # Step simulation
            step_metrics = simulation_env.step(signal_timing, time_step)
            
            # Collect metrics
            wait_times.append(step_metrics['avg_wait_time'])
            queue_lengths.append(step_metrics['total_queued'])
            throughputs.append(step_metrics['vehicles_processed'])
            
            # Update controller if it supports learning
            if hasattr(controller, 'update_performance'):
                controller.update_performance(step_metrics)
            
            # Check for emergency/public transport handling
            emergency_time, pt_delay = self._check_priority_handling(simulation_env)
            if emergency_time > 0:
                emergency_response_times.append(emergency_time)
            if pt_delay > 0:
                public_transport_delays.append(pt_delay)
        
        # Calculate final metrics
        final_performance = simulation_env.get_performance_metrics()
        
        metrics = EvaluationMetrics(
            average_wait_time=np.mean(wait_times),
            max_wait_time=np.max(wait_times) if wait_times else 0.0,
            total_throughput=final_performance['total_vehicles_served'],
            queue_length_mean=np.mean(queue_lengths),
            queue_length_max=int(np.max(queue_lengths)) if queue_lengths else 0,
            fuel_consumption_liters=self._estimate_fuel_consumption(wait_times, queue_lengths),
            co2_emissions_kg=final_performance['co2_emissions_kg'],
            throughput_per_minute=final_performance['throughput_vehicles_per_min'],
            emergency_response_time=np.mean(emergency_response_times) if emergency_response_times else 0.0,
            public_transport_delay=np.mean(public_transport_delays) if public_transport_delays else 0.0,
            controller_response_time=controller_time,
            signal_change_frequency=signal_changes
        )
        
        # Store evaluation results
        evaluation_record = {
            'controller_name': controller_name,
            'timestamp': datetime.now(),
            'metrics': metrics,
            'simulation_duration': simulation_duration,
            'final_performance': final_performance
        }
        
        self.evaluation_history.append(evaluation_record)
        
        print(f"Completed evaluation of {controller_name}")
        return metrics
    
    def compare_controllers(self, 
                           controllers_and_names: List[tuple],
                           simulation_env,
                           simulation_duration: float = 3600.0) -> pd.DataFrame:
        """
        Compare multiple controllers side by side.
        
        Args:
            controllers_and_names: List of (controller, name) tuples
            simulation_env: Traffic simulation environment
            simulation_duration: Simulation time in seconds
            
        Returns:
            DataFrame with comparison results
        """
        results = []
        
        for controller, name in controllers_and_names:
            metrics = self.evaluate_controller(
                controller, 
                simulation_env, 
                name, 
                simulation_duration
            )
            
            results.append({
                'Controller': name,
                'Avg Wait Time (s)': round(metrics.average_wait_time, 2),
                'Max Wait Time (s)': round(metrics.max_wait_time, 2),
                'Total Throughput': metrics.total_throughput,
                'Throughput/min': round(metrics.throughput_per_minute, 2),
                'Avg Queue Length': round(metrics.queue_length_mean, 2),
                'Max Queue Length': metrics.queue_length_max,
                'CO2 Emissions (kg)': round(metrics.co2_emissions_kg, 3),
                'Fuel Consumption (L)': round(metrics.fuel_consumption_liters, 2),
                'Emergency Response (s)': round(metrics.emergency_response_time, 2),
                'Signal Changes': metrics.signal_change_frequency
            })
        
        return pd.DataFrame(results)
    
    def plot_performance_comparison(self, 
                                   comparison_df: pd.DataFrame,
                                   save_path: Optional[str] = None):
        """Create visualizations comparing controller performance."""
        
        # Set up the plotting style
        plt.style.use('default')
        sns.set_palette("husl")
        
        # Create subplots
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('Traffic Controller Performance Comparison', fontsize=16, fontweight='bold')
        
        # Plot 1: Average Wait Time
        axes[0, 0].bar(comparison_df['Controller'], comparison_df['Avg Wait Time (s)'])
        axes[0, 0].set_title('Average Wait Time')
        axes[0, 0].set_ylabel('Seconds')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Plot 2: Throughput per minute
        axes[0, 1].bar(comparison_df['Controller'], comparison_df['Throughput/min'])
        axes[0, 1].set_title('Throughput per Minute')
        axes[0, 1].set_ylabel('Vehicles/min')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Plot 3: CO2 Emissions
        axes[0, 2].bar(comparison_df['Controller'], comparison_df['CO2 Emissions (kg)'])
        axes[0, 2].set_title('CO2 Emissions')
        axes[0, 2].set_ylabel('kg CO2')
        axes[0, 2].tick_params(axis='x', rotation=45)
        
        # Plot 4: Average Queue Length
        axes[1, 0].bar(comparison_df['Controller'], comparison_df['Avg Queue Length'])
        axes[1, 0].set_title('Average Queue Length')
        axes[1, 0].set_ylabel('Vehicles')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Plot 5: Emergency Response Time
        axes[1, 1].bar(comparison_df['Controller'], comparison_df['Emergency Response (s)'])
        axes[1, 1].set_title('Emergency Response Time')
        axes[1, 1].set_ylabel('Seconds')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        # Plot 6: Signal Change Frequency
        axes[1, 2].bar(comparison_df['Controller'], comparison_df['Signal Changes'])
        axes[1, 2].set_title('Signal Change Frequency')
        axes[1, 2].set_ylabel('Changes per hour')
        axes[1, 2].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
        
    def generate_report(self, 
                       comparison_df: pd.DataFrame,
                       report_path: Optional[str] = None) -> str:
        """Generate a comprehensive performance report."""
        
        report = f"""
# Traffic Management System Performance Report
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary

This report compares the performance of different traffic control strategies
on a simulated 4-way intersection under varying traffic conditions.

## Controller Comparison

{comparison_df.to_string(index=False)}

## Key Findings

"""
        
        # Find best performers in each category
        best_wait_time = comparison_df.loc[comparison_df['Avg Wait Time (s)'].idxmin(), 'Controller']
        best_throughput = comparison_df.loc[comparison_df['Throughput/min'].idxmax(), 'Controller']
        best_emissions = comparison_df.loc[comparison_df['CO2 Emissions (kg)'].idxmin(), 'Controller']
        best_emergency = comparison_df.loc[comparison_df['Emergency Response (s)'].idxmin(), 'Controller']
        
        report += f"""
### Best Performers by Category:
- **Lowest Average Wait Time**: {best_wait_time} ({comparison_df.loc[comparison_df['Controller']==best_wait_time, 'Avg Wait Time (s)'].iloc[0]:.2f}s)
- **Highest Throughput**: {best_throughput} ({comparison_df.loc[comparison_df['Controller']==best_throughput, 'Throughput/min'].iloc[0]:.2f} vehicles/min)
- **Lowest CO2 Emissions**: {best_emissions} ({comparison_df.loc[comparison_df['Controller']==best_emissions, 'CO2 Emissions (kg)'].iloc[0]:.3f} kg)
- **Fastest Emergency Response**: {best_emergency} ({comparison_df.loc[comparison_df['Controller']==best_emergency, 'Emergency Response (s)'].iloc[0]:.2f}s)

### Performance Analysis:

"""
        
        # Add analysis for each controller
        for _, row in comparison_df.iterrows():
            controller = row['Controller']
            report += f"""
#### {controller}
- Average wait time: {row['Avg Wait Time (s)']}s
- Throughput: {row['Throughput/min']} vehicles/minute
- Environmental impact: {row['CO2 Emissions (kg)']} kg CO2
- Queue management: Average {row['Avg Queue Length']} vehicles
- Adaptability: {row['Signal Changes']} signal changes per hour

"""
        
        report += """
## Recommendations

Based on the evaluation results, consider the following:

1. **For Heavy Traffic**: Choose the controller with highest throughput
2. **For Environmental Concerns**: Select the controller with lowest emissions
3. **For Emergency Response**: Prioritize controllers with fastest emergency handling
4. **For Fuel Economy**: Consider controllers that minimize wait times and queue lengths

## Technical Notes

- Simulation duration: 1 hour
- Traffic patterns: Mixed regular, public transport, and emergency vehicles
- Evaluation includes fuel consumption estimation based on idle time
- Emergency response time measures average time to clear emergency vehicles

"""
        
        if report_path:
            with open(report_path, 'w') as f:
                f.write(report)
        
        return report
    
    def _apply_traffic_scenarios(self, env, scenarios, duration):
        """Apply different traffic load scenarios during simulation."""
        # This is a placeholder - in a full implementation, you would
        # modify the environment's arrival rates based on time periods
        pass
    
    def _check_priority_handling(self, env) -> tuple:
        """Check emergency and public transport handling performance."""
        # Placeholder for priority vehicle tracking
        emergency_time = 0.0
        pt_delay = 0.0
        
        # In a full implementation, you would track specific vehicles
        # and measure their service times
        
        return emergency_time, pt_delay
    
    def _signals_equal(self, signals1, signals2) -> bool:
        """Check if two signal timing dictionaries are equal."""
        if set(signals1.keys()) != set(signals2.keys()):
            return False
        
        for key in signals1:
            if abs(signals1[key] - signals2[key]) > 1.0:  # 1 second tolerance
                return False
        
        return True
    
    def _estimate_fuel_consumption(self, wait_times, queue_lengths) -> float:
        """Estimate fuel consumption based on wait times and queue lengths."""
        # Rough estimation: idling vehicles consume ~0.6L/hour
        total_idle_time_hours = sum(wt * ql for wt, ql in zip(wait_times, queue_lengths)) / 3600.0
        fuel_per_hour_idle = 0.6  # Liters per hour per vehicle
        return total_idle_time_hours * fuel_per_hour_idle
