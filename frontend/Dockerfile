# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_CHATGPT_API_KEY
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_NODE_ENV

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CHATGPT_API_KEY=$VITE_CHATGPT_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_NODE_ENV=$VITE_NODE_ENV

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
# FIXED: Changed to --quiet flag for consistency
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
