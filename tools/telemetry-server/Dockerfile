FROM node:22-alpine

WORKDIR /app

# 服务端采用 Node 原生 node:sqlite 与 node:http，无外部 npm 依赖
COPY server.mjs ./

ENV PORT=3333
ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/telemetry.db

# 数据持久化目录
VOLUME ["/app/data"]

EXPOSE 3333

CMD ["node", "server.mjs"]
