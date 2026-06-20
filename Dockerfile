# =========================================================
# Etapa 1: Base de Node.js
# =========================================================
FROM node:20-alpine AS base

# Directorio de trabajo
WORKDIR /app

# Copiar descriptores de dependencias
COPY package.json yarn.lock ./

# =========================================================
# Etapa 2: Entorno de Desarrollo (Development)
# =========================================================
FROM base AS development

# Instalar dependencias de desarrollo y de producción
RUN yarn install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Exponer el puerto por defecto de Vite
EXPOSE 5173

# Ejecutar Vite y enlazar a todas las interfaces de red del contenedor
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# =========================================================
# Etapa 3: Construcción (Builder) para Producción
# =========================================================
FROM base AS builder

# Instalar dependencias limpias
RUN yarn install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Compilar la aplicación. Vite cargará las variables de entorno de .env durante este proceso.
RUN yarn build

# =========================================================
# Etapa 4: Servidor Nginx de Producción
# =========================================================
FROM nginx:alpine AS production

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el bundle estático generado al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto web por defecto
EXPOSE 80

# Ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
