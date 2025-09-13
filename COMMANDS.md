# 🚀 Smart Traffic Management - Commands & Setup Guide

This document provides all commands needed to set up, run, test, and troubleshoot the Smart Traffic Management System.

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager

```powershell
# Check installations
python --version
node --version
npm --version
```

## 🔧 Initial Setup

### 1. Python Environment Setup

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. MERN Web App Setup

```powershell
# Install backend dependencies
cd web-app/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ../..
```

## ⚡ Quick Start (All Systems)

### Option 1: Manual Start (Separate Terminals)

```powershell
# Terminal 1 - Test Python System
python test_system.py

# Terminal 2 - MERN Backend
cd web-app/backend
npm run dev

# Terminal 3 - MERN Frontend  
cd web-app/frontend
npm start

# Terminal 4 - Streamlit (Optional)
streamlit run src/visualization/dashboard.py
```

### Option 2: One-Click Batch Script

Create `start_all.bat`:
```batch
@echo off
echo Starting Smart Traffic Management System...

echo 1. Testing Python System...
start cmd /k "python test_system.py && pause"

timeout /t 3

echo 2. Starting Streamlit Dashboard...
start cmd /k "streamlit run src/visualization/dashboard.py"

timeout /t 3

echo 3. Starting MERN Backend...
start cmd /k "cd web-app/backend && npm install && npm run dev"

timeout /t 5

echo 4. Starting MERN Frontend...
start cmd /k "cd web-app/frontend && npm install && npm start"

echo All systems starting...
echo Access points:
echo - MERN App: http://localhost:3000
echo - Streamlit: http://localhost:8501
echo - API: http://localhost:5000
pause
```

Run: `./start_all.bat`

## 🐍 Python System Commands

```powershell
# Install dependencies
pip install -r requirements.txt

# Quick system test
python test_system.py

# Full demonstration
python main.py

# Test individual components
python -c "from src.fuzzy_logic.controller import FuzzyTrafficController; print('Fuzzy OK')"
python -c "from src.simulation.environment import TrafficIntersection; print('Simulation OK')"

# Test the fuzzy logic system separately
python test_fuzzy.py
```

## 📊 Streamlit Dashboard

```powershell
# Install Streamlit (if not installed)
pip install streamlit

# Run dashboard
streamlit run src/visualization/dashboard.py

# Run with custom port
streamlit run src/visualization/dashboard.py --server.port 8502

# Access: http://localhost:8501
```

## 🌐 MERN Web Application

### Backend Commands

```powershell
cd web-app/backend

# Install dependencies
npm install

# Development server (with auto-reload)
npm run dev

# Production server
npm start

# Run tests
npm test

# Access API: http://localhost:5000
```

### Frontend Commands

```powershell
cd web-app/frontend

# Install dependencies
npm install

# Development server
npm start

# Production build
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3000

# Access: http://localhost:3000
```

## 🎯 Access Points

| System | URL | Description |
|--------|-----|-------------|
| **🌟 MERN Web App** | http://localhost:3000 | Main professional UI |
| **Streamlit** | http://localhost:8501 | Original dashboard |
| **API Backend** | http://localhost:5000 | REST API server |
| **API Health** | http://localhost:5000/api/health | Backend status |

## 🔧 Testing Commands

### Python Tests
```powershell
# System health check
python test_system.py

# Run full comparison
python main.py

# Test fuzzy logic
python test_fuzzy.py
```

### API Tests
```powershell
# Health check
curl http://localhost:5000/api/health

# System info
curl http://localhost:5000/api/system-info

# Test fuzzy controller
curl -X POST http://localhost:5000/api/fuzzy/test -H "Content-Type: application/json" -d "{\"density\":25,\"waitTime\":60,\"priority\":0}"
```

### Frontend Tests
```powershell
cd web-app/frontend

# Run tests
npm test

# Build test
npm run build
```

## 🐛 Troubleshooting

### Port Conflicts
```powershell
# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :8501

# Kill processes
taskkill /PID <process_id> /F

# Or use kill-port
npx kill-port 3000
npx kill-port 5000
npx kill-port 8501
```

### Python Issues
```powershell
# Check packages
pip list | findstr tensorflow
pip list | findstr scikit-fuzzy
pip list | findstr streamlit

# Reinstall
pip install --upgrade scikit-fuzzy tensorflow streamlit

# Python module import errors:
# - Ensure virtual environment is activated
# - Make sure you're running commands from the project root directory
# - The src/ directory should be in the Python path
```

### Node.js Issues
```powershell
# Clear cache
npm cache clean --force

# Reinstall backend
cd web-app/backend
rm -rf node_modules package-lock.json
npm install

# Reinstall frontend
cd web-app/frontend
rm -rf node_modules package-lock.json
npm install
```

## 📱 Mobile Access

```powershell
# Get your IP
ipconfig | findstr IPv4

# Access from mobile:
# http://YOUR_IP:3000 (MERN App)
# http://YOUR_IP:8501 (Streamlit)
```

## 🚀 Demo Sequence

```powershell
# 1. Test system
python test_system.py

# 2. Start backend
cd web-app/backend && npm run dev

# 3. Start frontend
cd web-app/frontend && npm start

# 4. Optional: Streamlit
streamlit run src/visualization/dashboard.py

# 5. Open browsers:
# Main: http://localhost:3000
# API: http://localhost:5000/api/health
# Streamlit: http://localhost:8501
```

## 📊 System Monitoring

```powershell
# Monitor processes
Get-Process python
Get-Process node

# Check connections
netstat -an | findstr LISTEN
```

## 🎉 Production Commands

```powershell
# Build frontend for production
cd web-app/frontend
npm run build

# Start production backend
cd web-app/backend
npm start

# Serve static frontend
npm install -g serve
serve -s web-app/frontend/build -l 3000
```

## 📁 Project Structure

```
IS-2/
├── src/                          # Python source code
│   ├── ai_agent/                 # AI agent modules
│   ├── fuzzy_logic/              # Fuzzy logic system
│   ├── simulation/               # Traffic simulation
│   └── utils/                    # Utility functions
├── web-app/                      # MERN web application
│   ├── backend/                  # Express.js backend
│   └── frontend/                 # React frontend
├── main.py                       # Streamlit application entry point
├── test_system.py                # System testing script
├── test_fuzzy.py                 # Fuzzy logic testing script
├── requirements.txt              # Python dependencies
├── README.md                     # Project documentation
├── COMMANDS.md                   # This file
└── UI_CALCULATIONS.md            # UI metrics explanations
```

## 🔍 Development Notes

- The Python backend provides the core simulation and AI logic
- The MERN backend acts as a bridge between React frontend and Python modules
- Both UIs can run simultaneously for different use cases
- Results and cache directories are automatically recreated when needed

## 📱 Mobile Access

**🎯 Main Access Points:**
- **Primary UI**: http://localhost:3000 (MERN Web App)
- **Alternative UI**: http://localhost:8501 (Streamlit)
- **API**: http://localhost:5000 (Backend Server)

**✨ The MERN Web App at port 3000 is your impressive, professional interface!**
