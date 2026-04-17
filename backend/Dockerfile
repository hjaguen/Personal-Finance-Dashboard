FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --production

# Copy source
COPY backend/src ./src
COPY backend/package*.json ./

# Expose port
EXPOSE 3001

# Start
CMD ["node", "src/index.js"]