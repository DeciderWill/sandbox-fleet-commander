FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY src/server ./src/server
COPY tsconfig.json ./
EXPOSE 4000
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/server/index.ts"]
