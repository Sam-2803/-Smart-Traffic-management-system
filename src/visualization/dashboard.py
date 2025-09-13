"""
Interactive Streamlit Dashboard for Smart Traffic Management System
Run with: streamlit run src/visualization/dashboard.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import time
import sys
import os

# Add parent directory to path for imports
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

try:
    from src.simulation.environment import TrafficIntersection
    from src.fuzzy_logic.controller import FuzzyTrafficController
    from src.ai_agent.hybrid_controller import HybridFuzzyAIController, FixedTimeController
    from src.utils.evaluation import TrafficEvaluator
except ImportError:
    st.error("Could not import required modules. Please ensure you're running from the project root directory.")
    st.stop()


# Page configuration
st.set_page_config(
    page_title="Smart Traffic Management Dashboard",
    page_icon="🚦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'simulation_running' not in st.session_state:
    st.session_state.simulation_running = False
if 'intersection' not in st.session_state:
    st.session_state.intersection = None
if 'controller' not in st.session_state:
    st.session_state.controller = None
if 'simulation_data' not in st.session_state:
    st.session_state.simulation_data = []


def create_intersection_visualization(lane_states, signal_timing):
    """Create a visual representation of the intersection."""
    
    # Create subplot for intersection layout
    fig = make_subplots(
        rows=3, cols=3,
        subplot_titles=("", "North", "", "West", "Intersection", "East", "", "South", ""),
        specs=[[{"type": "bar"}, {"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "scatter"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "bar"}, {"type": "bar"}]]
    )
    
    # Direction mapping
    directions = ['North', 'East', 'South', 'West']
    positions = [(1, 2), (2, 3), (3, 2), (2, 1)]  # (row, col) for each direction
    
    # Plot queue lengths for each direction
    num_lanes_per_direction = len(lane_states['density']) // 4
    
    for i, (direction, pos) in enumerate(zip(directions, positions)):
        start_lane = i * num_lanes_per_direction
        end_lane = start_lane + num_lanes_per_direction
        
        avg_density = np.mean(lane_states['density'][start_lane:end_lane])
        avg_wait = np.mean(lane_states['wait_time'][start_lane:end_lane])
        green_time = signal_timing.get(i, 0)
        
        # Color based on signal state
        color = 'green' if green_time > 0 else 'red'
        
        fig.add_trace(
            go.Bar(
                x=[direction],
                y=[avg_density],
                name=f'{direction} Queue',
                marker_color=color,
                text=f'Wait: {avg_wait:.1f}s<br>Green: {green_time:.1f}s',
                textposition='outside',
                showlegend=False
            ),
            row=pos[0], col=pos[1]
        )
    
    # Central intersection status
    total_queue = np.sum(lane_states['density'])
    avg_wait_all = np.mean(lane_states['wait_time'])
    
    fig.add_trace(
        go.Scatter(
            x=[0.5],
            y=[0.5],
            mode='markers+text',
            marker=dict(size=100, color='yellow'),
            text=f'Total Queue: {total_queue}<br>Avg Wait: {avg_wait_all:.1f}s',
            textposition='middle center',
            showlegend=False
        ),
        row=2, col=2
    )
    
    fig.update_layout(
        title="Real-time Intersection Status",
        height=600,
        showlegend=False
    )
    
    return fig


def main():
    """Main dashboard function."""
    
    # Title and header
    st.title("🚦 Smart Traffic Management Dashboard")
    st.markdown("---")
    
    # Sidebar for controls
    with st.sidebar:
        st.header("Simulation Controls")
        
        # Controller selection
        controller_type = st.selectbox(
            "Select Controller Type",
            ["Fixed-Time", "Pure Fuzzy Logic", "Hybrid Fuzzy-AI"]
        )
        
        # Traffic parameters
        st.subheader("Traffic Parameters")
        arrival_rate = st.slider("Arrival Rate (vehicles/sec/lane)", 0.1, 1.0, 0.4, 0.1)
        emergency_prob = st.slider("Emergency Vehicle Probability", 0.0, 0.1, 0.02, 0.01)
        public_transport_prob = st.slider("Public Transport Probability", 0.0, 0.2, 0.05, 0.01)
        
        # Simulation controls
        if st.button("Initialize Simulation"):
            # Create intersection
            st.session_state.intersection = TrafficIntersection(
                num_lanes_per_direction=2,
                base_arrival_rate=arrival_rate,
                emergency_prob=emergency_prob,
                public_transport_prob=public_transport_prob
            )
            
            # Create controller
            if controller_type == "Fixed-Time":
                st.session_state.controller = FixedTimeController(cycle_time=120)
            elif controller_type == "Pure Fuzzy Logic":
                st.session_state.controller = HybridFuzzyAIController(enable_ai=False)
            else:
                st.session_state.controller = HybridFuzzyAIController(enable_ai=True)
            
            st.session_state.simulation_data = []
            st.success(f"Initialized {controller_type} controller!")
        
        # Real-time simulation toggle
        if st.session_state.intersection is not None:
            if st.button("Start/Stop Real-time Simulation"):
                st.session_state.simulation_running = not st.session_state.simulation_running
            
            if st.session_state.simulation_running:
                st.success("🟢 Simulation Running")
            else:
                st.info("🔴 Simulation Stopped")
    
    # Main dashboard area
    if st.session_state.intersection is None:
        st.info("👈 Please initialize a simulation from the sidebar to begin.")
        
        # Show fuzzy logic demonstration
        st.subheader("Fuzzy Logic Controller Demo")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            density = st.slider("Traffic Density", 0, 50, 25)
        with col2:
            wait_time = st.slider("Average Wait Time", 0, 180, 60)
        with col3:
            priority = st.selectbox("Priority Level", [0, 1, 2], format_func=lambda x: ["None", "Public", "Emergency"][x])
        
        if st.button("Test Fuzzy Controller"):
            fuzzy_controller = FuzzyTrafficController()
            green_time = fuzzy_controller.suggest_green_time(density, wait_time, priority)
            st.success(f"Suggested Green Time: {green_time:.1f} seconds")
        
    else:
        # Real-time simulation display
        if st.session_state.simulation_running:
            # Run one simulation step
            lane_states = st.session_state.intersection.get_lane_states()
            signal_timing = st.session_state.controller.get_signal_timing(lane_states, training=False)
            step_metrics = st.session_state.intersection.step(signal_timing, 1.0)
            
            # Store data
            current_data = {
                'time': len(st.session_state.simulation_data),
                'avg_wait_time': step_metrics['avg_wait_time'],
                'total_queued': step_metrics['total_queued'],
                'vehicles_processed': step_metrics['vehicles_processed'],
                'emissions': step_metrics['emissions_rate']
            }
            st.session_state.simulation_data.append(current_data)
            
            # Keep only last 100 data points
            if len(st.session_state.simulation_data) > 100:
                st.session_state.simulation_data = st.session_state.simulation_data[-100:]
        
        # Display current metrics
        if st.session_state.simulation_data:
            latest = st.session_state.simulation_data[-1]
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Average Wait Time", f"{latest['avg_wait_time']:.1f}s")
            with col2:
                st.metric("Total Queued", latest['total_queued'])
            with col3:
                st.metric("Vehicles Processed", latest['vehicles_processed'])
            with col4:
                st.metric("CO2 Emissions", f"{latest['emissions']:.3f}kg")
        
        # Intersection visualization
        if st.session_state.intersection:
            lane_states = st.session_state.intersection.get_lane_states()
            signal_timing = st.session_state.controller.get_signal_timing(lane_states, training=False)
            
            intersection_fig = create_intersection_visualization(lane_states, signal_timing)
            st.plotly_chart(intersection_fig, use_container_width=True)
        
        # Performance charts
        if len(st.session_state.simulation_data) > 1:
            df = pd.DataFrame(st.session_state.simulation_data)
            
            # Time series plots
            col1, col2 = st.columns(2)
            
            with col1:
                fig_wait = px.line(df, x='time', y='avg_wait_time', 
                                  title='Average Wait Time Over Time')
                st.plotly_chart(fig_wait, use_container_width=True)
                
                fig_queue = px.line(df, x='time', y='total_queued',
                                   title='Total Queue Length Over Time')
                st.plotly_chart(fig_queue, use_container_width=True)
            
            with col2:
                fig_throughput = px.line(df, x='time', y='vehicles_processed',
                                        title='Vehicles Processed Over Time')
                st.plotly_chart(fig_throughput, use_container_width=True)
                
                fig_emissions = px.line(df, x='time', y='emissions',
                                       title='CO2 Emissions Over Time')
                st.plotly_chart(fig_emissions, use_container_width=True)
    
    # Comparison section
    st.markdown("---")
    st.subheader("Controller Comparison")
    
    if st.button("Run Performance Comparison"):
        with st.spinner("Running comparison simulation..."):
            # Create fresh intersection for comparison
            comparison_intersection = TrafficIntersection(
                num_lanes_per_direction=2,
                base_arrival_rate=0.4,
                emergency_prob=0.02,
                public_transport_prob=0.05
            )
            
            # Create controllers
            controllers = [
                (FixedTimeController(cycle_time=120), "Fixed-Time"),
                (HybridFuzzyAIController(enable_ai=False), "Pure Fuzzy"),
                (HybridFuzzyAIController(enable_ai=True), "Hybrid AI"),
            ]
            
            # Run comparison
            evaluator = TrafficEvaluator()
            comparison_results = evaluator.compare_controllers(
                controllers, 
                comparison_intersection, 
                simulation_duration=300.0  # 5 minutes for dashboard
            )
            
            st.success("Comparison complete!")
            st.dataframe(comparison_results)
            
            # Performance comparison charts
            metrics = ['Avg Wait Time (s)', 'Throughput/min', 'CO2 Emissions (kg)', 'Avg Queue Length']
            
            for i, metric in enumerate(metrics):
                fig = px.bar(comparison_results, x='Controller', y=metric, 
                            title=f'{metric} Comparison')
                st.plotly_chart(fig, use_container_width=True)
    
    # Auto-refresh for real-time simulation
    if st.session_state.simulation_running:
        time.sleep(1)
        st.experimental_rerun()


if __name__ == "__main__":
    main()
