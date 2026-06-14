FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client and push schema
RUN npx prisma generate
RUN npx prisma db push --skip-generate

# Expose port
EXPOSE 8050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8050/health || exit 1

# Start application
CMD ["node", "src/app.js"]
