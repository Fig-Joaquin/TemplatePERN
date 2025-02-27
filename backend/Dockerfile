# Imagen base con Node.js
FROM node:22.12.0

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos del proyecto
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Instalar dependencias
RUN npm install

# Compilar TypeScript
RUN npm run build

# Exponer el puerto en el que corre el backend
EXPOSE 4000

# Comando para iniciar el backend
CMD ["node", "dist/index.js"]
