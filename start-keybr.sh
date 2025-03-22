#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}KeyBr Mobile Startup Script${NC}"
echo "============================="

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

# Check git for changes to determine if compilation is needed
check_for_code_changes() {
    # Store the current git hash
    if [ -f ".last_commit_hash" ]; then
        LAST_HASH=$(cat .last_commit_hash)
    else
        LAST_HASH=""
    fi
    
    # Get the current hash
    CURRENT_HASH=$(git rev-parse HEAD)
    
    # Check if package.json has been modified since last run
    PACKAGE_MODIFIED=false
    if [ -f ".last_package_mtime" ]; then
        LAST_PACKAGE_MTIME=$(cat .last_package_mtime)
        CURRENT_PACKAGE_MTIME=$(stat -f "%m" package.json 2>/dev/null || stat -c "%Y" package.json 2>/dev/null)
        
        if [ "$LAST_PACKAGE_MTIME" != "$CURRENT_PACKAGE_MTIME" ]; then
            PACKAGE_MODIFIED=true
        fi
    else
        PACKAGE_MODIFIED=true
    fi
    
    # Update the last package modification time
    stat -f "%m" package.json 2>/dev/null || stat -c "%Y" package.json 2>/dev/null > .last_package_mtime
    
    # Check for changes in source files
    SRC_CHANGED=false
    if find packages -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -newer .last_compile 2>/dev/null | grep -q .; then
        SRC_CHANGED=true
    fi
    
    # Return true (0) if we need to compile, false (1) otherwise
    if [ "$LAST_HASH" != "$CURRENT_HASH" ] || [ "$PACKAGE_MODIFIED" = true ] || [ "$SRC_CHANGED" = true ] || [ ! -f ".last_compile" ]; then
        # Save the current hash
        echo $CURRENT_HASH > .last_commit_hash
        return 0
    else
        return 1
    fi
}

# Kill processes on ports 3000 and 3001
check_and_kill_port 3000
check_and_kill_port 3001

# Check if we need to compile
if check_for_code_changes; then
    echo -e "${YELLOW}Code changes detected. Compiling...${NC}"
    
    # Compile the code
    echo -e "${GREEN}Running npm run compile...${NC}"
    npm run compile
    
    # Build development version
    echo -e "${GREEN}Running npm run build-dev...${NC}"
    npm run build-dev
    
    # Update the last compile timestamp
    touch .last_compile
    
    echo -e "${GREEN}Compilation complete.${NC}"
else
    echo -e "${GREEN}No code changes detected. Skipping compilation.${NC}"
fi

# Start the application
echo -e "${GREEN}Starting KeyBr application...${NC}"
npm start 