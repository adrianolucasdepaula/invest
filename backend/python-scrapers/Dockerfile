# Python Scrapers Dockerfile
FROM python:3.11-slim

# Install system dependencies for Playwright, Chrome, and VNC
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    # VNC dependencies
    xvfb \
    x11vnc \
    fluxbox \
    supervisor \
    net-tools \
    novnc \
    websockify \
    xterm \
    # X11 utilities for window management
    xdotool \
    x11-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome (método moderno sem apt-key)
RUN wget -q -O /tmp/google-chrome-stable.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y /tmp/google-chrome-stable.deb \
    && rm /tmp/google-chrome-stable.deb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (use system Chrome installed above)
RUN playwright install --with-deps chromium || true

# Copy application code
COPY . .

# Create directories
RUN mkdir -p /app/logs /app/browser-profiles

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV DISPLAY=:99
ENV DISPLAY_WIDTH=1920
ENV DISPLAY_HEIGHT=1080
ENV VNC_PORT=5900
ENV NOVNC_PORT=6080

# Copy VNC startup scripts (will be overridden by volume mount, kept for non-volume builds)
COPY docker/vnc-startup.sh /app/docker/vnc-startup.sh
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Make startup script executable
RUN chmod +x /app/docker/vnc-startup.sh

# Expose VNC ports
EXPOSE 5900 6080

# Run VNC startup script (volume mount preserves docker/ directory structure)
CMD ["/app/docker/vnc-startup.sh"]
