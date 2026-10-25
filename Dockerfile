# syntax=docker/dockerfile:1

# ---- Dependencies -----------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Tests (optional target: docker build --target test .) -----------------
FROM deps AS test
COPY . .
RUN npm run lint && npm run test:coverage

# ---- Production build -------------------------------------------------------
FROM deps AS build
COPY . .
RUN npm run build

# ---- Runtime ----------------------------------------------------------------
FROM nginx:stable-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/RIU-Frontend-Daniel-Alfonzo/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
