# ==============================================================================
# PortGrid: Multi-Stage Production Container Image
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Dashboard
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend Control Plane
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install docker-cli for DooD interaction and curl for health probes
RUN apk add --no-cache docker-cli curl ca-certificates tzdata

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV FRONTEND_DIR=/app/frontend/dist

# Install production dependencies for NestJS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend artifacts
COPY --from=backend-builder /app/backend/dist ./dist

# Copy compiled frontend assets
WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Prepare data storage directory
RUN mkdir -p /app/data

# Volume for cryptographic keys, audit trail, and service states
VOLUME ["/app/data"]

# Expose unified dashboard and API port
EXPOSE 3000

# Periodic container healthcheck probe
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/services || exit 1

# Start the unified PortGrid control plane
WORKDIR /app/backend
CMD ["node", "dist/main.js"]
