"""
Quick test script to verify the Smart Traffic Management System works correctly.
Run this before the full demonstration to ensure all components are working.
"""

import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def test_fuzzy_controller():
    """Test the fuzzy logic controller."""
    print("Testing Fuzzy Logic Controller...")
    
    try:
        from fuzzy_logic.controller import FuzzyTrafficController
        
        controller = FuzzyTrafficController()
        
        # Test basic functionality
        green_time = controller.suggest_green_time(25, 60, 0)
        assert 10 <= green_time <= 120, "Green time out of range"
        
        # Test emergency priority
        emergency_time = controller.suggest_green_time(25, 60, 2)
        regular_time = controller.suggest_green_time(25, 60, 0)
        assert emergency_time >= regular_time, "Emergency vehicles should get longer green time"
        
        print("✅ Fuzzy Logic Controller: PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Fuzzy Logic Controller: FAILED - {e}")
        return False

def test_traffic_simulation():
    """Test the traffic simulation environment."""
    print("Testing Traffic Simulation...")
    
    try:
        from simulation.environment import TrafficIntersection
        
        intersection = TrafficIntersection()
        
        # Test basic simulation step
        signal_timing = {0: 60, 1: 0, 2: 60, 3: 0}
        step_result = intersection.step(signal_timing, 1.0)
        
        assert 'vehicles_processed' in step_result
        assert 'total_queued' in step_result
        assert 'avg_wait_time' in step_result
        
        # Test lane states
        lane_states = intersection.get_lane_states()
        assert 'density' in lane_states
        assert 'wait_time' in lane_states
        assert 'priority' in lane_states
        
        print("✅ Traffic Simulation: PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Traffic Simulation: FAILED - {e}")
        return False

def test_hybrid_controller():
    """Test the hybrid fuzzy-AI controller."""
    print("Testing Hybrid Controller...")
    
    try:
        from ai_agent.hybrid_controller import HybridFuzzyAIController
        from simulation.environment import TrafficIntersection
        
        # Test pure fuzzy mode first (simpler)
        controller = HybridFuzzyAIController(enable_ai=False)
        intersection = TrafficIntersection()
        
        lane_states = intersection.get_lane_states()
        signal_timing = controller.get_signal_timing(lane_states)
        
        assert isinstance(signal_timing, dict)
        assert len(signal_timing) == 4  # 4 directions
        
        print("✅ Hybrid Controller: PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Hybrid Controller: FAILED - {e}")
        return False

def test_evaluation_system():
    """Test the evaluation and metrics system."""
    print("Testing Evaluation System...")
    
    try:
        from utils.evaluation import TrafficEvaluator, EvaluationMetrics
        
        evaluator = TrafficEvaluator()
        
        # Test metrics creation
        metrics = EvaluationMetrics(
            average_wait_time=30.5,
            max_wait_time=120.0,
            total_throughput=450,
            queue_length_mean=12.3,
            queue_length_max=25,
            fuel_consumption_liters=15.6,
            co2_emissions_kg=2.1,
            throughput_per_minute=7.5,
            emergency_response_time=45.2,
            public_transport_delay=12.1,
            controller_response_time=0.001,
            signal_change_frequency=12
        )
        
        assert metrics.average_wait_time == 30.5
        
        print("✅ Evaluation System: PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Evaluation System: FAILED - {e}")
        return False

def main():
    """Run all tests."""
    print("🚦 SMART TRAFFIC MANAGEMENT SYSTEM - QUICK TEST")
    print("=" * 60)
    
    tests = [
        test_fuzzy_controller,
        test_traffic_simulation,
        test_hybrid_controller,
        test_evaluation_system
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"TEST SUMMARY: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is ready.")
        print("\nNext steps:")
        print("1. Run full demonstration: python main.py")
        print("2. Start dashboard: streamlit run src/visualization/dashboard.py")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the error messages above.")
        print("\nTroubleshooting:")
        print("- Ensure all dependencies are installed: pip install -r requirements.txt")
        print("- Check that Python 3.8+ is being used")
        return 1

if __name__ == "__main__":
    exit(main())
