# Build context: project root (.)
# Stage 1: Build the React Admin SPA
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files first for layer cache
COPY admin/package.json admin/package-lock.json ./

# Install dependencies (ci = deterministic, faster than install)
RUN npm ci

# Copy the rest of the admin source
COPY admin/ .

# Build arg: passed from docker-compose build args
# Empty string enables same-origin requests (nginx proxies /api/)
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

# Build the production bundle
RUN npm run build


# Stage 2: Nginx runtime
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built SPA from stage 1
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
