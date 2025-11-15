# Python Technical Analysis Service - Dockerfile
# Descrição: Container para cálculo de indicadores técnicos
# Performance: 10-50x mais rápido que TypeScript

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install system dependencies for ta-lib (optional - comentar se não usar ta-lib)
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     wget \
#     && rm -rf /var/lib/apt/lists/*

# Install TA-Lib C library (opcional - descomente se quiser usar ta-lib)
# RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
#     tar -xzf ta-lib-0.4.0-src.tar.gz && \
#     cd ta-lib/ && \
#     ./configure --prefix=/usr && \
#     make && \
#     make install && \
#     cd .. && \
#     rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
# Remover ta-lib se não instalar a biblioteca C acima
RUN pip install --no-cache-dir -r requirements.txt || \
    (grep -v "ta-lib" requirements.txt > requirements_no_talib.txt && \
     pip install --no-cache-dir -r requirements_no_talib.txt)

# Copy application code
COPY app/ ./app/

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
