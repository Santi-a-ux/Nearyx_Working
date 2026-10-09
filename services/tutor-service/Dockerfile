FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY app/ ./

# The embedding model (~470 MB, downloaded on first start) is cached here; mount a volume to keep it.
RUN mkdir -p /app/.cache && chown -R node:node /app/.cache

ENV NODE_ENV=production
ENV PORT=8003
ENV MODEL_CACHE_DIR=/app/.cache/models
EXPOSE 8003

USER node

CMD ["node", "src/server.js"]
