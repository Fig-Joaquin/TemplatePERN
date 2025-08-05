# Etapa de dependencias
FROM node:22.12.0 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Etapa de build
FROM deps AS builder
COPY . .
RUN npm run build

# Etapa de producción con nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
