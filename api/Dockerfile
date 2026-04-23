# Build context: project root (.)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (gcc for compiling some packages, curl for healthcheck)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer cache)
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY api/ .

# Copy and make entrypoint executable
COPY api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create non-root user
RUN useradd -m -u 1000 appuser \
    && chown -R appuser:appuser /app \
    && chown appuser:appuser /entrypoint.sh
USER appuser

EXPOSE 8000

# Health check using curl (start-period gives migrations time to run)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
