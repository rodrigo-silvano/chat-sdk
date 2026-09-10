# Use Node.js LTS Alpine image
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile --production

# Copy source files
COPY . .

# Build TypeScript and Vite
RUN pnpm build

# Switch to non-root user
USER nodejs

# Expose port (default Vite port)
EXPOSE 5174

# Start the application
CMD ["pnpm", "preview"]
