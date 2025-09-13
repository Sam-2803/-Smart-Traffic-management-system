#!/usr/bin/env python3
"""
Test fuzzy controller for web interface
"""

import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from fuzzy_logic.controller import FuzzyTrafficController

def main():
    if len(sys.argv) < 4:
        print("Error: Missing parameters")
        sys.exit(1)
    
    try:
        density = float(sys.argv[1])
        wait_time = float(sys.argv[2])
        priority = int(sys.argv[3])
        
        controller = FuzzyTrafficController()
        green_time = controller.suggest_green_time(density, wait_time, priority)
        
        print(green_time)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
