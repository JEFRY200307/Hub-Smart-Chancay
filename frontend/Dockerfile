# ==========================================
# Fase 1: Instalación de Dependencias
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ==========================================
# Fase: Development
# ==========================================
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ==========================================
# Fase 2: Construcción (Build)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Construimos la aplicación usando 'standalone' mode
RUN npm run build

# ==========================================
# Fase 3: Producción (Runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Ocultar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Creamos un usuario sin privilegios por seguridad extrema (Práctica DevOps Enterprise)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos solo los assets optimizados de la carpeta standalone (.next/standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiamos al usuario sin privilegios
USER nextjs

EXPOSE 3000
ENV PORT 3000

# Next.js standalone ejecuta el servidor node de forma directa (Sin NPM)
CMD ["node", "server.js"]
