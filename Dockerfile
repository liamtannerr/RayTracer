FROM node:22-bookworm-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY inc ./inc
COPY src/web_render.cc ./src/web_render.cc
COPY scripts ./scripts
COPY package.json ./
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=builder /app/build ./build
COPY server ./server
COPY web ./web
ENV HOST=0.0.0.0 PORT=5173 NODE_ENV=production SERVE_FRONTEND=false
USER node
EXPOSE 5173
CMD ["node", "server/index.mjs"]
