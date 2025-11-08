FROM node:20-alpine AS base

# Install dependencies for Puppeteer and curl for healthcheck
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Development stage
FROM base AS development

WORKDIR /app

# Copy package files (for cache layer)
COPY package*.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports (3101 for API, 3102 for debugging)
EXPOSE 3101 3102

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist

# Expose ports (3101 for API, 3102 for debugging)
EXPOSE 3101 3102

CMD ["node", "dist/main"]
