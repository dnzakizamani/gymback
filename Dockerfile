FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client only (no db push at build time)
RUN npx prisma generate

# Expose port
EXPOSE 8050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8050/health || exit 1

# Start application (prisma db push at runtime)
# CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/app.js"]
