# Use an explicit LTS node engine base image
FROM node:20-slim

# Create a secure working context directory
WORKDIR /app

# Copy dependency catalogs to leverage Layer Caching effectively
COPY backend/package*.json ./

# Clean installation of production dependencies only
RUN npm ci --only=production

# Copy over the rest of the application file systems
COPY backend/ /app/

# Expose the fallback port mapped inside your server.js configurations
EXPOSE 5000

# Set execution instructions to fire up the main worker instance
CMD ["node", "server.js"]
