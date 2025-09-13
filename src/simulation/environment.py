import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class VehicleType(Enum):
    REGULAR = 0
    PUBLIC_TRANSPORT = 1
    EMERGENCY = 2


@dataclass
class Vehicle:
    id: int
    type: VehicleType
    arrival_time: float
    lane: int
    wait_time: float = 0.0
    has_passed: bool = False


class TrafficIntersection:
    """
    Simple 4-way intersection simulation environment for traffic control testing.
    
    Each direction (North, South, East, West) has multiple lanes.
    Vehicles arrive stochastically and queue up.
    """
    
    def __init__(self, 
                 num_lanes_per_direction: int = 2,
                 intersection_capacity: int = 8,
                 base_arrival_rate: float = 0.3,
                 emergency_prob: float = 0.01,
                 public_transport_prob: float = 0.05):
        """
        Args:
            num_lanes_per_direction: lanes per direction (N,S,E,W)
            intersection_capacity: max vehicles that can pass per green cycle
            base_arrival_rate: average vehicles per second per lane
            emergency_prob: probability of emergency vehicle
            public_transport_prob: probability of public transport
        """
        self.num_lanes = num_lanes_per_direction
        self.intersection_capacity = intersection_capacity
        self.base_arrival_rate = base_arrival_rate
        self.emergency_prob = emergency_prob
        self.public_transport_prob = public_transport_prob
        
        # Simulation state
        self.current_time = 0.0
        self.vehicle_id_counter = 0
        
        # 4 directions × num_lanes each
        self.total_lanes = 4 * self.num_lanes
        self.queues: List[List[Vehicle]] = [[] for _ in range(self.total_lanes)]
        
        # Traffic signal state (which directions are currently green)
        self.current_green_directions = [0, 2]  # Start with North-South green
        self.signal_change_time = 0.0
        
        # Statistics
        self.total_vehicles_served = 0
        self.total_wait_time = 0.0
        self.emissions_kg_co2 = 0.0
        
    def step(self, green_duration: Dict[int, float], time_step: float = 1.0):
        """
        Advance simulation by one time step.
        
        Args:
            green_duration: Dict mapping direction (0,1,2,3) to green time
            time_step: simulation time increment
        """
        self.current_time += time_step
        
        # Generate new vehicle arrivals
        self._generate_arrivals(time_step)
        
        # Update wait times for queued vehicles
        self._update_wait_times(time_step)
        
        # Process vehicles through intersection based on signal
        vehicles_processed = self._process_green_signals(green_duration, time_step)
        
        # Calculate emissions (idle vehicles produce more CO2)
        self._calculate_emissions(time_step)
        
        return {
            'vehicles_processed': vehicles_processed,
            'total_queued': sum(len(queue) for queue in self.queues),
            'avg_wait_time': self._get_average_wait_time(),
            'emissions_rate': self.emissions_kg_co2
        }
    
    def get_lane_states(self) -> Dict[str, np.ndarray]:
        """
        Get current state for each lane (density, avg wait time, priority).
        
        Returns dict with arrays of shape (total_lanes,)
        """
        densities = []
        wait_times = []
        priorities = []
        
        for lane_idx in range(self.total_lanes):
            queue = self.queues[lane_idx]
            
            # Density: number of vehicles in queue
            density = len(queue)
            
            # Average wait time
            if queue:
                avg_wait = np.mean([v.wait_time for v in queue])
            else:
                avg_wait = 0.0
                
            # Priority: max priority vehicle in queue
            priority = 0
            if queue:
                max_priority = max(v.type.value for v in queue)
                priority = max_priority
                
            densities.append(density)
            wait_times.append(avg_wait)
            priorities.append(priority)
            
        return {
            'density': np.array(densities),
            'wait_time': np.array(wait_times),
            'priority': np.array(priorities)
        }
    
    def _generate_arrivals(self, time_step: float):
        """Generate new vehicle arrivals for each lane."""
        for lane_idx in range(self.total_lanes):
            # Poisson arrivals
            num_arrivals = np.random.poisson(self.base_arrival_rate * time_step)
            
            for _ in range(num_arrivals):
                # Determine vehicle type
                rand = np.random.random()
                if rand < self.emergency_prob:
                    v_type = VehicleType.EMERGENCY
                elif rand < self.emergency_prob + self.public_transport_prob:
                    v_type = VehicleType.PUBLIC_TRANSPORT
                else:
                    v_type = VehicleType.REGULAR
                    
                vehicle = Vehicle(
                    id=self.vehicle_id_counter,
                    type=v_type,
                    arrival_time=self.current_time,
                    lane=lane_idx,
                    wait_time=0.0
                )
                
                self.queues[lane_idx].append(vehicle)
                self.vehicle_id_counter += 1
    
    def _update_wait_times(self, time_step: float):
        """Update wait times for all queued vehicles."""
        for queue in self.queues:
            for vehicle in queue:
                if not vehicle.has_passed:
                    vehicle.wait_time += time_step
    
    def _process_green_signals(self, green_duration: Dict[int, float], time_step: float) -> int:
        """
        Process vehicles through intersection during green signals.
        
        Args:
            green_duration: Dict mapping direction to green time
            time_step: current time step
            
        Returns:
            number of vehicles processed
        """
        vehicles_processed = 0
        
        # For simplicity, process directions with positive green_duration
        for direction, green_time in green_duration.items():
            if green_time <= 0:
                continue
                
            # Get lanes for this direction
            start_lane = direction * self.num_lanes
            end_lane = start_lane + self.num_lanes
            
            # Calculate capacity for this direction (proportional to green time)
            direction_capacity = int(self.intersection_capacity * min(green_time / 60.0, 1.0))
            
            # Process vehicles from lanes in this direction
            for lane_idx in range(start_lane, end_lane):
                queue = self.queues[lane_idx]
                
                # Process up to capacity, prioritizing emergency vehicles
                vehicles_to_process = min(len(queue), direction_capacity)
                
                # Sort by priority (emergency first)
                if vehicles_to_process > 0:
                    queue.sort(key=lambda v: (-v.type.value, v.arrival_time))
                    
                    for i in range(vehicles_to_process):
                        vehicle = queue.pop(0)
                        vehicle.has_passed = True
                        
                        # Update statistics
                        self.total_vehicles_served += 1
                        self.total_wait_time += vehicle.wait_time
                        vehicles_processed += 1
                        
        return vehicles_processed
    
    def _calculate_emissions(self, time_step: float):
        """Calculate CO2 emissions from idling vehicles."""
        # Rough estimate: 0.3 kg CO2 per hour of idling per vehicle
        total_idling_vehicles = sum(len(queue) for queue in self.queues)
        emissions_per_hour = 0.3  # kg CO2
        emissions_this_step = (emissions_per_hour / 3600.0) * time_step * total_idling_vehicles
        self.emissions_kg_co2 += emissions_this_step
    
    def _get_average_wait_time(self) -> float:
        """Calculate current average wait time across all queued vehicles."""
        all_vehicles = [v for queue in self.queues for v in queue]
        if not all_vehicles:
            return 0.0
        return np.mean([v.wait_time for v in all_vehicles])
    
    def reset(self):
        """Reset simulation to initial state."""
        self.current_time = 0.0
        self.vehicle_id_counter = 0
        self.queues = [[] for _ in range(self.total_lanes)]
        self.current_green_directions = [0, 2]
        self.total_vehicles_served = 0
        self.total_wait_time = 0.0
        self.emissions_kg_co2 = 0.0
    
    def get_performance_metrics(self) -> Dict[str, float]:
        """Get overall performance metrics."""
        avg_wait = self.total_wait_time / max(self.total_vehicles_served, 1)
        
        return {
            'average_wait_time': avg_wait,
            'total_vehicles_served': self.total_vehicles_served,
            'current_queue_length': sum(len(queue) for queue in self.queues),
            'co2_emissions_kg': self.emissions_kg_co2,
            'throughput_vehicles_per_min': self.total_vehicles_served / max(self.current_time / 60.0, 1.0)
        }
