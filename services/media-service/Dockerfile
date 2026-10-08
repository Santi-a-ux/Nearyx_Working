FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY app/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY app/ ./

ENV NODE_ENV=production
ENV PORT=8006
EXPOSE 8006

USER node

CMD ["node", "src/server.js"]
