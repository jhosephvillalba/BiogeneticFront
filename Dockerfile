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

# Declarar los argumentos de construcción (build-args) que pasa Easypanel / CI
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_APP_ENV
ARG VITE_APP_VERSION

# Convertirlos en variables de entorno para que Vite las detecte al compilar
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Instalar dependencias limpias
RUN yarn install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Compilar la aplicación.
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
