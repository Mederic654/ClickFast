FROM node:22.14.0-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./server.js

USER node
EXPOSE 4000

CMD ["node", "server.js"]
