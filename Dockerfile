# Multi-stage optimized build for LibreChat with custom UI
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files for better caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY api/package*.json ./api/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY api/package*.json ./api/

# Copy source files needed for build
COPY client ./client
COPY api ./api
COPY packages ./packages
COPY tsconfig*.json ./
# COPY .env.example ./.env.example

# Force cache invalidation for frontend build
ARG CACHEBUST=2

# Build frontend with cache mount for better performance
RUN \
    npm run frontend

# Runtime stage - use official LibreChat image
FROM ghcr.io/danny-avila/librechat:latest

# Install darkjk-mcp locally for the node user
USER root
COPY darkjk-mcp-1.0.0.tgz /tmp/
RUN npm install -g /tmp/darkjk-mcp-1.0.0.tgz && rm /tmp/darkjk-mcp-1.0.0.tgz
USER node

# Copy the built frontend and assets
COPY --from=build /app/client/dist /app/client/dist
COPY client/public/assets/transparent_sovereign.png /app/client/public/assets/transparent_sovereign.png

# Copy SoloOS logos
COPY client/public/assets/soloOS-white.png /app/client/public/assets/
COPY client/public/assets/soloOSblack.png /app/client/public/assets/
COPY client/public/assets/soloos_icon_transparent.png /app/client/public/assets/

# Copy startup script
USER root
COPY startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh
USER node

# Copy missing backend files
COPY api/server/routes/feedback-simple.js /app/api/server/routes/feedback-simple.js
COPY api/server/services/Tools/loadUserIntegrations.js /app/api/server/services/Tools/loadUserIntegrations.js

# Copy our modified backend files
COPY api/server/controllers/assistants/chatV2.js /app/api/server/controllers/assistants/chatV2.js
COPY api/server/routes/assistants/chatV2.js /app/api/server/routes/assistants/chatV2.js
COPY api/models/index.js /app/api/models/index.js

# Copy integration files
COPY api/server/routes/integrations.js /app/api/server/routes/integrations.js
COPY api/models/UserIntegrations.js /app/api/models/UserIntegrations.js
COPY api/server/services/Tools/loadUserIntegrations.js /app/api/server/services/Tools/loadUserIntegrations.js
COPY api/server/routes/index.js /app/api/server/routes/index.js
COPY api/server/routes/feedback.js /app/api/server/routes/feedback.js
COPY api/server/index.js /app/api/server/index.js

# Expose port and start backend
EXPOSE 3090
CMD ["/app/startup.sh"]