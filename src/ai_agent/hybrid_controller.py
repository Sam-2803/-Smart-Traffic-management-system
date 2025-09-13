import numpy as np
from typing import Dict, Optional, Tuple
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fuzzy_logic.controller import FuzzyTrafficController
from ai_agent.dqn_agent import DQNAgent, TrafficState


class HybridFuzzyAIController:
    """
    Hybrid traffic control system that combines Fuzzy Logic with Deep Reinforcement Learning.
    
    The fuzzy controller provides baseline signal timing based on expert rules,
    and the RL agent learns to make adjustments to optimize performance over time.
    """
    
    def __init__(self, 
                 state_size: int = 16,  # 4 directions * 4 features (density, wait, priority, fuzzy)
                 enable_ai: bool = True,
                 min_green_time: float = 10.0,
                 max_green_time: float = 120.0):
        """
        Args:
            state_size: Size of state vector for RL agent
            enable_ai: Whether to use AI optimization (False = pure fuzzy)
            min_green_time: Minimum allowed green signal duration
            max_green_time: Maximum allowed green signal duration
        """
        self.fuzzy_controller = FuzzyTrafficController()
        self.enable_ai = enable_ai
        self.min_green_time = min_green_time
        self.max_green_time = max_green_time
        
        # Initialize RL agent if enabled
        if self.enable_ai:
            self.rl_agent = DQNAgent(state_size=state_size, action_size=4)
        else:
            self.rl_agent = None
            
        # State management
        self.prev_state = None
        self.prev_action = None
        self.prev_metrics = {}
        
        # Performance tracking
        self.episode_rewards = []
        self.training_step = 0
        
    def get_signal_timing(self, 
                         lane_states: Dict[str, np.ndarray],
                         training: bool = True) -> Dict[int, float]:
        """
        Get optimized signal timing for all directions.
        
        Args:
            lane_states: Current traffic state with density, wait_time, priority per lane
            training: Whether to use exploration in RL agent
            
        Returns:
            Dictionary mapping direction (0-3) to green time in seconds
        """
        # Step 1: Get baseline timing from fuzzy logic
        fuzzy_green_times = self._get_fuzzy_baseline(lane_states)
        
        if not self.enable_ai:
            # Pure fuzzy logic mode
            return fuzzy_green_times
            
        # Step 2: Create state representation for RL agent
        current_state = TrafficState.create_state(
            lane_states, 
            np.array(list(fuzzy_green_times.values())),
            None  # Don't include prev_action to keep state size at 16
        )
        
        # Step 3: Get AI adjustments
        ai_adjustments = self.rl_agent.act(current_state, training=training)
        
        # Step 4: Apply adjustments to fuzzy baseline
        optimized_timing = self._apply_adjustments(fuzzy_green_times, ai_adjustments)
        
        # Store state and action for next training step
        if training:
            self.prev_state = current_state
            self.prev_action = ai_adjustments
            
        return optimized_timing
    
    def update_performance(self, 
                          current_metrics: Dict[str, float],
                          emergency_handled: bool = False):
        """
        Update the RL agent based on performance feedback.
        
        Args:
            current_metrics: Current traffic performance metrics
            emergency_handled: Whether emergency vehicles were processed
        """
        if not self.enable_ai or self.prev_state is None:
            return
            
        # Calculate reward based on performance improvement
        reward = TrafficState.calculate_reward(
            self.prev_metrics, 
            current_metrics, 
            emergency_handled
        )
        
        # Note: For proper RL training, we would need the next state here
        # This is a simplified version - in practice, you'd call this after
        # getting the next state observation
        
        self.prev_metrics = current_metrics.copy()
        
        # Store reward for analysis
        self.episode_rewards.append(reward)
        
        return reward
    
    def train_step(self, 
                   next_lane_states: Dict[str, np.ndarray],
                   reward: float,
                   done: bool = False):
        """
        Perform one training step for the RL agent.
        
        Args:
            next_lane_states: Traffic state at next time step
            reward: Reward received from the environment
            done: Whether episode is finished
        """
        if not self.enable_ai or self.prev_state is None:
            return
            
        # Get fuzzy baseline for next state (needed for state representation)
        next_fuzzy_times = self._get_fuzzy_baseline(next_lane_states)
        
        # Create next state representation
        next_state = TrafficState.create_state(
            next_lane_states,
            np.array(list(next_fuzzy_times.values())),
            None  # Don't include prev_action to keep state size at 16
        )
        
        # Store experience in replay buffer
        self.rl_agent.remember(
            self.prev_state,
            self.prev_action,
            reward,
            next_state,
            done
        )
        
        # Train the agent
        self.rl_agent.replay()
        
        # Update target network periodically
        self.training_step += 1
        if self.training_step % 100 == 0:
            self.rl_agent.update_target_network()
    
    def _get_fuzzy_baseline(self, lane_states: Dict[str, np.ndarray]) -> Dict[int, float]:
        """Get baseline signal timing from fuzzy logic controller."""
        # Aggregate lane states by direction
        num_directions = 4
        num_lanes_per_direction = len(lane_states['density']) // num_directions
        
        direction_timing = {}
        
        for dir_idx in range(num_directions):
            start_lane = dir_idx * num_lanes_per_direction
            end_lane = start_lane + num_lanes_per_direction
            
            # Get average metrics for this direction
            avg_density = np.mean(lane_states['density'][start_lane:end_lane])
            avg_wait = np.mean(lane_states['wait_time'][start_lane:end_lane])
            max_priority = np.max(lane_states['priority'][start_lane:end_lane])
            
            # Get fuzzy controller suggestion
            green_time = self.fuzzy_controller.suggest_green_time(
                density=float(avg_density),
                wait_time=float(avg_wait),
                priority=int(max_priority)
            )
            
            direction_timing[dir_idx] = green_time
            
        return direction_timing
    
    def _apply_adjustments(self, 
                          fuzzy_timing: Dict[int, float],
                          ai_adjustments: np.ndarray) -> Dict[int, float]:
        """
        Apply AI adjustments to fuzzy baseline timing.
        
        Args:
            fuzzy_timing: Baseline timing from fuzzy controller
            ai_adjustments: Adjustment factors from RL agent (-1 to 1)
            
        Returns:
            Optimized signal timing
        """
        optimized_timing = {}
        
        for direction, base_time in fuzzy_timing.items():
            # Apply adjustment (adjustment of -1 = 50% reduction, +1 = 50% increase)
            adjustment_factor = 1.0 + (ai_adjustments[direction] * 0.5)
            adjusted_time = base_time * adjustment_factor
            
            # Clamp to valid range
            optimized_timing[direction] = np.clip(
                adjusted_time, 
                self.min_green_time, 
                self.max_green_time
            )
            
        return optimized_timing
    
    def set_training_mode(self, training: bool):
        """Enable or disable training mode."""
        self.enable_ai = training
        
    def save_model(self, filepath: str):
        """Save the trained RL model."""
        if self.rl_agent:
            self.rl_agent.save_model(filepath)
            
    def load_model(self, filepath: str):
        """Load a pre-trained RL model."""
        if self.rl_agent:
            self.rl_agent.load_model(filepath)
            
    def get_training_stats(self) -> Dict[str, float]:
        """Get training statistics."""
        if not self.episode_rewards:
            return {}
            
        return {
            'mean_reward': np.mean(self.episode_rewards[-100:]),  # Last 100 episodes
            'total_episodes': len(self.episode_rewards),
            'training_steps': self.training_step,
            'epsilon': self.rl_agent.epsilon if self.rl_agent else 0.0
        }
    
    def reset_episode(self):
        """Reset episode-specific state."""
        self.prev_state = None
        self.prev_action = None
        self.prev_metrics = {}


class FixedTimeController:
    """Traditional fixed-time traffic controller for comparison."""
    
    def __init__(self, cycle_time: float = 120.0):
        """
        Args:
            cycle_time: Total cycle time in seconds
        """
        self.cycle_time = cycle_time
        self.current_time = 0.0
        
        # Simple two-phase operation: NS green, then EW green
        self.phase_duration = cycle_time / 2
        
    def get_signal_timing(self, 
                         lane_states: Dict[str, np.ndarray],
                         training: bool = True,
                         time_step: float = 1.0) -> Dict[int, float]:
        """
        Get fixed-time signal timing.
        
        Args:
            lane_states: Current lane states (ignored for fixed-time)
            training: Training mode (ignored for fixed-time)
            time_step: Time step increment
        
        Returns:
            Dictionary mapping direction to green time
        """
        self.current_time += time_step
        phase_time = self.current_time % self.cycle_time
        
        if phase_time < self.phase_duration:
            # North-South green
            return {0: self.phase_duration, 1: 0, 2: self.phase_duration, 3: 0}
        else:
            # East-West green  
            return {0: 0, 1: self.phase_duration, 2: 0, 3: self.phase_duration}
    
    def reset(self):
        """Reset controller state."""
        self.current_time = 0.0
