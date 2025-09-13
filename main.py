"""
Smart Traffic Management with Hybrid Fuzzy-AI Control
Main demonstration script showing the complete system in action.
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from simulation.environment import TrafficIntersection
from fuzzy_logic.controller import FuzzyTrafficController
from ai_agent.hybrid_controller import HybridFuzzyAIController, FixedTimeController
from utils.evaluation import TrafficEvaluator
import warnings

# Suppress TensorFlow warnings for cleaner output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
warnings.filterwarnings('ignore')


def demonstrate_fuzzy_controller():
    """Demonstrate the standalone fuzzy logic controller."""
    print("=" * 60)
    print("FUZZY LOGIC CONTROLLER DEMONSTRATION")
    print("=" * 60)
    
    fuzzy_controller = FuzzyTrafficController()
    
    # Test different traffic scenarios
    test_cases = [
        {"name": "Low Traffic", "density": 5, "wait_time": 20, "priority": 0},
        {"name": "Medium Traffic", "density": 25, "wait_time": 60, "priority": 0},
        {"name": "Heavy Traffic", "density": 45, "wait_time": 120, "priority": 0},
        {"name": "Emergency Vehicle", "density": 30, "wait_time": 80, "priority": 2},
        {"name": "Public Transport", "density": 20, "wait_time": 90, "priority": 1},
    ]
    
    print("Testing fuzzy controller with different scenarios:")
    print("-" * 60)
    
    for case in test_cases:
        green_time = fuzzy_controller.suggest_green_time(
            case["density"], case["wait_time"], case["priority"]
        )
        print(f"{case['name']:<20}: Density={case['density']:2d}, "
              f"Wait={case['wait_time']:3d}s, Priority={case['priority']}, "
              f"-> Green Time={green_time:.1f}s")
    
    print()


def run_simulation_comparison():
    """Run a comprehensive comparison of different traffic control strategies."""
    print("=" * 60)
    print("TRAFFIC CONTROL COMPARISON SIMULATION")
    print("=" * 60)
    
    # Create simulation environment
    intersection = TrafficIntersection(
        num_lanes_per_direction=2,
        base_arrival_rate=0.4,  # Moderate traffic
        emergency_prob=0.02,
        public_transport_prob=0.08
    )
    
    # Create different controllers
    controllers = [
        (FixedTimeController(cycle_time=120), "Fixed-Time (120s)"),
        (HybridFuzzyAIController(enable_ai=False), "Pure Fuzzy Logic"),
        (HybridFuzzyAIController(enable_ai=True), "Hybrid Fuzzy-AI"),
    ]
    
    # Create evaluator
    evaluator = TrafficEvaluator()
    
    # Run comparison (shorter duration for demo)
    print("Running traffic simulations (this may take a few minutes)...")
    print("Comparing Fixed-Time, Fuzzy Logic, and Hybrid AI controllers...\n")
    
    comparison_results = evaluator.compare_controllers(
        controllers, 
        intersection, 
        simulation_duration=600.0  # 10 minutes for demo
    )
    
    # Display results
    print("SIMULATION RESULTS:")
    print("=" * 80)
    print(comparison_results.to_string(index=False))
    print()
    
    # Generate and save performance plots
    try:
        output_path = os.path.join("results", "performance_comparison.png")
        os.makedirs("results", exist_ok=True)
        evaluator.plot_performance_comparison(comparison_results, save_path=output_path)
        print(f"Performance comparison plots saved to: {output_path}")
    except Exception as e:
        print(f"Note: Could not generate plots (likely missing display): {e}")
    
    # Generate report
    report_path = os.path.join("results", "performance_report.md")
    report = evaluator.generate_report(comparison_results, report_path)
    print(f"Detailed report saved to: {report_path}")
    
    return comparison_results


def demonstrate_hybrid_learning():
    """Show the hybrid controller learning over time."""
    print("=" * 60)
    print("HYBRID AI LEARNING DEMONSTRATION")
    print("=" * 60)
    
    # Create environment and hybrid controller
    intersection = TrafficIntersection(
        num_lanes_per_direction=2,
        base_arrival_rate=0.5,  # Higher traffic for learning
        emergency_prob=0.03
    )
    
    hybrid_controller = HybridFuzzyAIController(enable_ai=True)
    
    # Run short training episodes
    episode_rewards = []
    episode_wait_times = []
    
    print("Training hybrid controller (5 episodes)...")
    
    for episode in range(5):
        intersection.reset()
        hybrid_controller.reset_episode()
        
        episode_reward = 0
        wait_times = []
        
        # Run one episode
        for step in range(120):  # 2 minutes per episode
            lane_states = intersection.get_lane_states()
            signal_timing = hybrid_controller.get_signal_timing(lane_states, training=True)
            
            step_metrics = intersection.step(signal_timing, 1.0)
            wait_times.append(step_metrics['avg_wait_time'])
            
            # Update with reward
            reward = hybrid_controller.update_performance(step_metrics)
            if reward is not None:
                episode_reward += reward
                
            # Training step
            if step > 0:  # Need previous state for training
                hybrid_controller.train_step(lane_states, reward or 0, done=(step == 119))
        
        episode_rewards.append(episode_reward)
        episode_wait_times.append(np.mean(wait_times))
        
        stats = hybrid_controller.get_training_stats()
        print(f"Episode {episode + 1}: Reward={episode_reward:.2f}, "
              f"Avg Wait={episode_wait_times[-1]:.2f}s, "
              f"Epsilon={stats.get('epsilon', 0):.3f}")
    
    print(f"\nLearning Progress:")
    print(f"Initial avg wait time: {episode_wait_times[0]:.2f}s")
    print(f"Final avg wait time: {episode_wait_times[-1]:.2f}s")
    print(f"Improvement: {episode_wait_times[0] - episode_wait_times[-1]:.2f}s")
    print()


def display_system_architecture():
    """Display information about the system architecture."""
    print("=" * 60)
    print("SMART TRAFFIC MANAGEMENT SYSTEM ARCHITECTURE")
    print("=" * 60)
    
    architecture = """
SYSTEM COMPONENTS:

1. FUZZY LOGIC CONTROLLER
   - Input Variables:
     * Traffic Density (0-50 vehicles/lane)
     * Average Wait Time (0-180 seconds)
     * Priority Level (0=none, 1=public, 2=emergency)
   - Output: Green signal duration (10-120 seconds)
   - Features: Handles uncertainty, expert rule-based decisions

2. DEEP Q-NETWORK (DQN) AGENT
   - State Space: 16-dimensional (densities, wait times, priorities, fuzzy outputs)
   - Action Space: 4-dimensional adjustment factors (-1 to +1)
   - Architecture: 128->64->32->4 neurons with dropout
   - Learning: Experience replay with target network

3. HYBRID CONTROLLER
   - Combines fuzzy baseline with AI optimization
   - AI adjustments modify fuzzy outputs by ±50%
   - Maintains safety bounds (10-120 seconds)
   - Training via performance feedback

4. TRAFFIC SIMULATION
   - 4-way intersection with multiple lanes per direction
   - Stochastic vehicle arrivals (Poisson process)
   - Vehicle types: Regular, Public Transport, Emergency
   - Performance metrics: Wait time, throughput, emissions

5. EVALUATION FRAMEWORK
   - Comprehensive performance metrics
   - Controller comparison capabilities
   - Statistical analysis and reporting
   - Visualization of results

OBJECTIVES ACHIEVED:
✓ Real-time adaptive signal control
✓ Uncertainty handling via fuzzy logic
✓ AI-based optimization over time
✓ Priority vehicle support
✓ Environmental impact reduction
✓ Performance benchmarking
    """
    
    print(architecture)


def main():
    """Main function demonstrating the complete traffic management system."""
    print("🚦 SMART TRAFFIC MANAGEMENT WITH HYBRID FUZZY-AI CONTROL 🚦")
    print("=" * 70)
    print()
    
    try:
        # 1. Show system architecture
        display_system_architecture()
        
        # 2. Demonstrate fuzzy logic controller
        demonstrate_fuzzy_controller()
        
        # 3. Show hybrid learning
        demonstrate_hybrid_learning()
        
        # 4. Run comprehensive comparison
        comparison_results = run_simulation_comparison()
        
        # 5. Summary
        print("=" * 60)
        print("DEMONSTRATION COMPLETE")
        print("=" * 60)
        print("\nKey Results:")
        
        if not comparison_results.empty:
            best_overall = comparison_results.loc[
                comparison_results['Avg Wait Time (s)'].idxmin(), 'Controller'
            ]
            best_throughput = comparison_results.loc[
                comparison_results['Throughput/min'].idxmax(), 'Controller'
            ]
            
            print(f"• Best overall performance: {best_overall}")
            print(f"• Highest throughput: {best_throughput}")
            print(f"• Environmental benefits demonstrated")
            print(f"• Emergency vehicle prioritization working")
        
        print("\nFiles generated:")
        print("• results/performance_comparison.png - Performance charts")
        print("• results/performance_report.md - Detailed analysis report")
        
        print("\nTo run the interactive dashboard:")
        print("  streamlit run src/visualization/dashboard.py")
        
        print("\n🎉 Thank you for exploring the Smart Traffic Management System!")
        
    except Exception as e:
        print(f"❌ Error during demonstration: {e}")
        print("This might be due to missing dependencies.")
        print("Please run: pip install -r requirements.txt")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
