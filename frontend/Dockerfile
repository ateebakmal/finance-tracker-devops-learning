
# # syntax=docker/dockerfile:1

# # ===================== stage 1: build =====================
# FROM node:22-alpine AS build

# WORKDIR /app

# COPY package.json package-lock.json ./
# RUN npm ci

# COPY . .

# # No VITE_API_URL. api.js falls back to the relative "/api", which nginx
# # proxies. That single fact is what makes this image portable: nothing
# # environment-specific is compiled into the bundle.
# RUN npm run build

# # ===================== stage 2: serve =====================
# FROM nginx:1.27-alpine

# COPY --from=build /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80
