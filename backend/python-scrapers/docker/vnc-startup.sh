#!/bin/bash
set -e

echo "=========================================="
echo "  B3 AI Analysis Platform - VNC Startup"
echo "=========================================="

# Display configuration
export DISPLAY=:99
export DISPLAY_WIDTH=${DISPLAY_WIDTH:-1920}
export DISPLAY_HEIGHT=${DISPLAY_HEIGHT:-1080}
export VNC_PORT=${VNC_PORT:-5900}
export NOVNC_PORT=${NOVNC_PORT:-6080}

echo "Display: $DISPLAY"
echo "Resolution: ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}"
echo "VNC Port: $VNC_PORT"
echo "noVNC Port: $NOVNC_PORT"
echo "=========================================="

# Start Xvfb (X Virtual Framebuffer)
echo "Starting Xvfb..."
Xvfb :99 -screen 0 ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
sleep 2

# Verify Xvfb is running
if ! ps -p $XVFB_PID > /dev/null; then
    echo "ERROR: Xvfb failed to start"
    exit 1
fi
echo "✓ Xvfb started (PID: $XVFB_PID)"

# Start Fluxbox window manager (optional, helps with some apps)
echo "Starting Fluxbox..."
fluxbox -display :99 &
FLUXBOX_PID=$!
sleep 1
echo "✓ Fluxbox started (PID: $FLUXBOX_PID)"

# Start x11vnc (VNC server)
echo "Starting x11vnc..."
x11vnc -display :99 \
    -forever \
    -shared \
    -rfbport $VNC_PORT \
    -nopw \
    -xkb \
    -ncache 10 \
    -ncache_cr \
    -quiet &
X11VNC_PID=$!
sleep 2

# Verify x11vnc is running
if ! ps -p $X11VNC_PID > /dev/null; then
    echo "ERROR: x11vnc failed to start"
    kill $XVFB_PID $FLUXBOX_PID 2>/dev/null || true
    exit 1
fi
echo "✓ x11vnc started (PID: $X11VNC_PID)"

# Start noVNC (Web VNC client)
echo "Starting noVNC..."
websockify --web=/usr/share/novnc $NOVNC_PORT localhost:$VNC_PORT &
NOVNC_PID=$!
sleep 2

# Verify noVNC is running
if ! ps -p $NOVNC_PID > /dev/null; then
    echo "ERROR: noVNC failed to start"
    kill $XVFB_PID $FLUXBOX_PID $X11VNC_PID 2>/dev/null || true
    exit 1
fi
echo "✓ noVNC started (PID: $NOVNC_PID)"

echo "=========================================="
echo "  VNC Services Ready!"
echo "=========================================="
echo "VNC Direct: vnc://localhost:$VNC_PORT"
echo "noVNC Web: http://localhost:$NOVNC_PORT/vnc.html"
echo "=========================================="

# Start Python scraper service
echo "Starting Python scraper service..."
exec python main.py
