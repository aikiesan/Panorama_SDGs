# Dev stage — used by docker-compose (volume-mounted, runs Vite dev server)
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Production stage — used for standalone deployments
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
ARG CACHEBUST=2
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
