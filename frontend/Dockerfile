# ── Dev stage ────────────────────────────────────────────────────────────────
# Local hot-reload (Vite dev server). Not used by the default docker-compose.yml;
# opt in for local development (see frontend/README.md).
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ── Build stage ──────────────────────────────────────────────────────────────
# Compiles the static production bundle. VITE_API_URL is baked in here.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
ARG CACHEBUST=2
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Nginx stage ──────────────────────────────────────────────────────────────
# Static production server used by docker-compose / the VM deployment.
FROM nginx:alpine AS nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Serve stage ──────────────────────────────────────────────────────────────
# Kept LAST so Railway (railway.toml builds the final stage) keeps using it.
FROM node:20-alpine AS prod
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
