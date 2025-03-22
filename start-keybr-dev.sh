#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}KeyBr Mobile Development Script${NC}"
echo "================================="

# Check if ports 3000 and 3001 are in use and kill the processes
check_and_kill_port() {
    local port=$1
    echo -e "Checking port ${port}..."
    
    # Get the PID using the port (works on both Linux and macOS)
    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS
        PID=$(lsof -ti :$port)
    else
        # Linux
        PID=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
    fi
    
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Process with PID $PID is using port $port. Killing it...${NC}"
        kill -9 $PID
        echo -e "${GREEN}Process killed.${NC}"
    else
        echo -e "No process is using port $port."
    fi
}

# Kill any existing watch process
kill_watch_process() {
    echo -e "Checking for existing webpack watch process..."
    
    # Find and kill any existing watch processes
    WATCH_PID=$(ps aux | grep "webpack --watch" | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$WATCH_PID" ]; then
        echo -e "${YELLOW}Watch process with PID $WATCH_PID found. Killing it...${NC}"
        kill -9 $WATCH_PID
        echo -e "${GREEN}Watch process killed.${NC}"
    else
        echo -e "No watch process found."
    fi
}

# Check for and kill processes on ports 3000 and 3001
check_and_kill_port 3000
check_and_kill_port 3001

# Kill any existing watch process
kill_watch_process

# Compile the code
echo -e "${GREEN}Running npm run compile...${NC}"
npm run compile

# Build development version
echo -e "${GREEN}Running npm run build-dev...${NC}"
npm run build-dev

# Start the watch process in the background
echo -e "${GREEN}Starting webpack watch process in the background...${NC}"
npm run watch &
WATCH_PID=$!

# Record the watch process PID
echo $WATCH_PID > .watch_pid

# Start the application
echo -e "${GREEN}Starting KeyBr application...${NC}"
echo -e "${YELLOW}Note: Press Ctrl+C to stop both the server and watch processes${NC}"

# Trap Ctrl+C to also kill the watch process
trap "kill -9 $WATCH_PID 2>/dev/null; echo -e '${GREEN}Stopped watch process.${NC}'; exit" INT

# Start the server
npm start

# If we get here, also make sure to clean up
kill -9 $WATCH_PID 2>/dev/null
echo -e "${GREEN}Stopped watch process.${NC}" 