from typing import Dict, Tuple
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl


class FuzzyTrafficController:
    """
    Fuzzy logic controller for traffic signal green time suggestion.

    Inputs:
      - density: vehicles per lane (0-50)
      - wait_time: average wait per vehicle in seconds (0-180)
      - priority: encoded priority level (0: none, 1: public, 2: emergency)

    Output:
      - green_time: suggested green duration in seconds (10-120)
    """

    def __init__(self):
        # Define fuzzy variables
        self.density = ctrl.Antecedent(np.arange(0, 51, 1), 'density')
        self.wait_time = ctrl.Antecedent(np.arange(0, 181, 1), 'wait_time')
        self.priority = ctrl.Antecedent(np.arange(0, 3, 1), 'priority')
        self.green_time = ctrl.Consequent(np.arange(10, 121, 1), 'green_time')

        # Membership functions for density
        self.density['low'] = fuzz.trimf(self.density.universe, [0, 0, 20])
        self.density['medium'] = fuzz.trimf(self.density.universe, [10, 25, 40])
        self.density['high'] = fuzz.trimf(self.density.universe, [30, 50, 50])

        # Membership functions for wait_time
        self.wait_time['short'] = fuzz.trimf(self.wait_time.universe, [0, 0, 60])
        self.wait_time['medium'] = fuzz.trimf(self.wait_time.universe, [40, 90, 140])
        self.wait_time['long'] = fuzz.trimf(self.wait_time.universe, [120, 180, 180])

        # Membership functions for priority (treated as crisp categories with narrow triangles)
        self.priority['none'] = fuzz.trimf(self.priority.universe, [0, 0, 1])
        self.priority['public'] = fuzz.trimf(self.priority.universe, [0, 1, 2])
        self.priority['emergency'] = fuzz.trimf(self.priority.universe, [1, 2, 2])

        # Membership functions for green_time
        self.green_time['short'] = fuzz.trimf(self.green_time.universe, [10, 10, 40])
        self.green_time['medium'] = fuzz.trimf(self.green_time.universe, [30, 60, 90])
        self.green_time['long'] = fuzz.trimf(self.green_time.universe, [80, 120, 120])

        # Define comprehensive rules to cover all combinations
        rules = []
        
        # Emergency vehicle rules (highest priority)
        rules.append(ctrl.Rule(self.priority['emergency'], self.green_time['long']))
        
        # Public transport rules
        rules.append(ctrl.Rule(self.priority['public'] & self.density['low'], self.green_time['medium']))
        rules.append(ctrl.Rule(self.priority['public'] & self.density['medium'], self.green_time['medium']))
        rules.append(ctrl.Rule(self.priority['public'] & self.density['high'], self.green_time['long']))
        
        # Regular traffic rules - comprehensive coverage
        # Low density scenarios
        rules.append(ctrl.Rule(self.density['low'] & self.wait_time['short'] & self.priority['none'], self.green_time['short']))
        rules.append(ctrl.Rule(self.density['low'] & self.wait_time['medium'] & self.priority['none'], self.green_time['short']))
        rules.append(ctrl.Rule(self.density['low'] & self.wait_time['long'] & self.priority['none'], self.green_time['medium']))
        
        # Medium density scenarios
        rules.append(ctrl.Rule(self.density['medium'] & self.wait_time['short'] & self.priority['none'], self.green_time['short']))
        rules.append(ctrl.Rule(self.density['medium'] & self.wait_time['medium'] & self.priority['none'], self.green_time['medium']))
        rules.append(ctrl.Rule(self.density['medium'] & self.wait_time['long'] & self.priority['none'], self.green_time['long']))
        
        # High density scenarios
        rules.append(ctrl.Rule(self.density['high'] & self.wait_time['short'] & self.priority['none'], self.green_time['medium']))
        rules.append(ctrl.Rule(self.density['high'] & self.wait_time['medium'] & self.priority['none'], self.green_time['medium']))
        rules.append(ctrl.Rule(self.density['high'] & self.wait_time['long'] & self.priority['none'], self.green_time['long']))

        # Build control system
        self.system = ctrl.ControlSystem(rules)
        self.simulator = ctrl.ControlSystemSimulation(self.system)

    def suggest_green_time(self, density: float, wait_time: float, priority: int) -> float:
        try:
            # Ensure inputs are within valid ranges
            density_val = float(np.clip(density, 0, 50))
            wait_time_val = float(np.clip(wait_time, 0, 180))
            priority_val = int(np.clip(priority, 0, 2))
            
            # Set inputs
            self.simulator.input['density'] = density_val
            self.simulator.input['wait_time'] = wait_time_val
            self.simulator.input['priority'] = priority_val

            # Compute fuzzy inference
            self.simulator.compute()
            
            # Get output with error handling
            if 'green_time' in self.simulator.output:
                result = float(self.simulator.output['green_time'])
                # Ensure result is within bounds
                return float(np.clip(result, 10, 120))
            else:
                # Fallback if fuzzy inference fails
                return self._fallback_green_time(density_val, wait_time_val, priority_val)
                
        except Exception as e:
            print(f"Warning: Fuzzy inference failed ({e}). Using fallback calculation.")
            return self._fallback_green_time(float(density), float(wait_time), int(priority))
    
    def _fallback_green_time(self, density: float, wait_time: float, priority: int) -> float:
        """Simple fallback calculation when fuzzy inference fails."""
        base_time = 30.0  # Base green time
        
        # Adjust based on density
        if density > 30:
            base_time += 20
        elif density > 15:
            base_time += 10
            
        # Adjust based on wait time
        if wait_time > 90:
            base_time += 15
        elif wait_time > 45:
            base_time += 10
            
        # Priority adjustments
        if priority == 2:  # Emergency
            base_time += 30
        elif priority == 1:  # Public transport
            base_time += 15
            
        return float(np.clip(base_time, 10, 120))

    def batch_suggest(self, inputs: Dict[str, np.ndarray]) -> np.ndarray:
        densities = inputs['density']
        waits = inputs['wait_time']
        priorities = inputs['priority']
        out = []
        for d, w, p in zip(densities, waits, priorities):
            out.append(self.suggest_green_time(float(d), float(w), int(p)))
        return np.array(out)

