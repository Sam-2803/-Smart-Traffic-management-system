import numpy as np
import tensorflow as tf
from tensorflow import keras
from typing import Tuple, List, Dict, Optional
from collections import deque
import random


class DQNAgent:
    """
    Deep Q-Network agent for traffic signal optimization.
    
    The agent learns to adjust fuzzy logic outputs to optimize traffic flow.
    State: [lane_densities, lane_wait_times, lane_priorities, fuzzy_outputs]
    Action: Adjustment factors for each direction's green time (-1.0 to 1.0)
    """
    
    def __init__(self,
                 state_size: int,
                 action_size: int = 4,  # 4 directions
                 learning_rate: float = 0.001,
                 gamma: float = 0.95,
                 epsilon: float = 1.0,
                 epsilon_min: float = 0.01,
                 epsilon_decay: float = 0.995,
                 memory_size: int = 10000,
                 batch_size: int = 32):
        """
        Args:
            state_size: Dimension of state vector
            action_size: Number of actions (direction adjustments)
            learning_rate: Learning rate for neural network
            gamma: Discount factor for future rewards
            epsilon: Initial exploration rate
            epsilon_min: Minimum exploration rate
            epsilon_decay: Decay rate for exploration
            memory_size: Size of experience replay buffer
            batch_size: Mini-batch size for training
        """
        self.state_size = state_size
        self.action_size = action_size
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay
        self.batch_size = batch_size
        
        # Experience replay buffer
        self.memory = deque(maxlen=memory_size)
        
        # Neural networks
        self.q_network = self._build_model()
        self.target_network = self._build_model()
        
        # Update target network initially
        self.update_target_network()
        
    def _build_model(self) -> keras.Model:
        """Build the Deep Q-Network."""
        model = keras.Sequential([
            keras.layers.Dense(128, input_dim=self.state_size, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            # Output layer: adjustment factors for each direction
            keras.layers.Dense(self.action_size, activation='tanh')  # -1 to 1 range
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
            loss='mse'
        )
        
        return model
    
    def remember(self, state: np.ndarray, action: int, reward: float, 
                 next_state: np.ndarray, done: bool):
        """Store experience in replay buffer."""
        self.memory.append((state, action, reward, next_state, done))
    
    def act(self, state: np.ndarray, training: bool = True) -> np.ndarray:
        """
        Choose action based on epsilon-greedy policy.
        
        Returns:
            adjustment_factors: Array of shape (action_size,) with values in [-1, 1]
        """
        if training and np.random.random() <= self.epsilon:
            # Random exploration: generate random adjustment factors
            return np.random.uniform(-1, 1, self.action_size)
        
        # Exploit: use Q-network to predict best adjustments
        state_batch = np.expand_dims(state, axis=0)
        q_values = self.q_network.predict(state_batch, verbose=0)
        return q_values[0]  # Return adjustment factors
    
    def replay(self):
        """Train the model on a batch of experiences."""
        if len(self.memory) < self.batch_size:
            return
            
        # Sample random minibatch
        batch = random.sample(self.memory, self.batch_size)
        
        states = np.array([e[0] for e in batch])
        actions = np.array([e[1] for e in batch])
        rewards = np.array([e[2] for e in batch])
        next_states = np.array([e[3] for e in batch])
        dones = np.array([e[4] for e in batch])
        
        # Predict Q-values for current states
        current_q_values = self.q_network.predict(states, verbose=0)
        
        # Predict Q-values for next states using target network
        next_q_values = self.target_network.predict(next_states, verbose=0)
        
        # Calculate target Q-values using Bellman equation
        for i in range(self.batch_size):
            if dones[i]:
                target = rewards[i]
            else:
                target = rewards[i] + self.gamma * np.max(next_q_values[i])
            
            # For continuous actions, we update all action values proportionally
            # This is a simplified approach - more sophisticated methods exist
            current_q_values[i] = target * actions[i]
        
        # Train the network
        self.q_network.fit(states, current_q_values, epochs=1, verbose=0)
        
        # Decay exploration rate
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
    
    def update_target_network(self):
        """Update target network with current Q-network weights."""
        self.target_network.set_weights(self.q_network.get_weights())
    
    def save_model(self, filepath: str):
        """Save the trained model."""
        self.q_network.save(filepath)
    
    def load_model(self, filepath: str):
        """Load a pre-trained model."""
        self.q_network = keras.models.load_model(filepath)
        self.target_network = keras.models.load_model(filepath)


class TrafficState:
    """Helper class to manage state representation for RL agent."""
    
    @staticmethod
    def create_state(lane_states: Dict[str, np.ndarray], 
                    fuzzy_outputs: np.ndarray,
                    prev_actions: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Create state vector from traffic data and fuzzy outputs.
        
        Args:
            lane_states: Dict with 'density', 'wait_time', 'priority' arrays
            fuzzy_outputs: Fuzzy controller green time suggestions per direction
            prev_actions: Previous RL adjustments (optional)
            
        Returns:
            State vector for RL agent
        """
        # Aggregate lane states by direction (4 directions, multiple lanes each)
        num_directions = 4
        num_lanes_per_direction = len(lane_states['density']) // num_directions
        
        direction_densities = []
        direction_wait_times = []
        direction_priorities = []
        
        for dir_idx in range(num_directions):
            start_lane = dir_idx * num_lanes_per_direction
            end_lane = start_lane + num_lanes_per_direction
            
            # Aggregate metrics for this direction
            dir_density = np.mean(lane_states['density'][start_lane:end_lane])
            dir_wait = np.mean(lane_states['wait_time'][start_lane:end_lane])
            dir_priority = np.max(lane_states['priority'][start_lane:end_lane])
            
            direction_densities.append(dir_density)
            direction_wait_times.append(dir_wait)
            direction_priorities.append(dir_priority)
        
        # Combine into state vector
        state_components = [
            np.array(direction_densities),      # 4 values
            np.array(direction_wait_times),     # 4 values  
            np.array(direction_priorities),     # 4 values
            fuzzy_outputs                       # 4 values
        ]
        
        if prev_actions is not None:
            state_components.append(prev_actions)  # 4 values
            
        return np.concatenate(state_components)
    
    @staticmethod
    def calculate_reward(prev_metrics: Dict[str, float], 
                        current_metrics: Dict[str, float],
                        emergency_handled: bool = False) -> float:
        """
        Calculate reward based on traffic performance improvement.
        
        Args:
            prev_metrics: Previous step performance metrics
            current_metrics: Current step performance metrics
            emergency_handled: Whether emergency vehicles were processed
            
        Returns:
            Reward value (higher is better)
        """
        # Weight factors for different objectives
        wait_weight = -1.0      # Negative because we want to minimize wait time
        throughput_weight = 0.5  # Positive because we want to maximize throughput
        emission_weight = -0.3   # Negative because we want to minimize emissions
        emergency_bonus = 10.0   # Bonus for handling emergency vehicles
        
        # Calculate changes in metrics
        wait_change = current_metrics['avg_wait_time'] - prev_metrics.get('avg_wait_time', 0)
        throughput_change = current_metrics['vehicles_processed'] - prev_metrics.get('vehicles_processed', 0)
        emission_change = current_metrics['emissions_rate'] - prev_metrics.get('emissions_rate', 0)
        
        # Calculate reward
        reward = (wait_weight * wait_change + 
                 throughput_weight * throughput_change + 
                 emission_weight * emission_change)
        
        # Add emergency handling bonus
        if emergency_handled:
            reward += emergency_bonus
            
        # Add penalty for excessive queue buildup
        queue_penalty = -0.1 * max(0, current_metrics.get('total_queued', 0) - 20)
        reward += queue_penalty
        
        return float(reward)
