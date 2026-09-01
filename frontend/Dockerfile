# Stage 1: Build the Vite production assets
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

# Install npm dependencies bypass peer conflicts
RUN npm install --legacy-peer-deps

COPY . .

# Inject production environment API points
ENV VITE_API_URL=""
ENV VITE_WS_URL=""

RUN npm run build

# Stage 2: Serve built static files using Nginx
FROM nginx:alpine

# Copy Nginx server configuration for React routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
