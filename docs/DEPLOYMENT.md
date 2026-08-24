# LUMO Production Deployment & Operations Guide

## 1. Local Development Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start local PostgreSQL 16, Redis 7, MinIO, and Mailpit using Docker Compose:
   ```bash
   docker compose up -d
   ```
3. Generate Prisma client:
   ```bash
   pnpm prisma generate
   ```
4. Run migrations:
   ```bash
   pnpm prisma migrate dev --name init
   ```
5. Start development server:
   ```bash
   pnpm dev
   ```

---

## 2. Production Deployment (Ubuntu Server + Nginx + PM2)

1. Provision an Ubuntu 24.04 LTS server with Node.js 22 LTS, pnpm, and PostgreSQL 16.
2. Clone repository and install dependencies with frozen lockfile:
   ```bash
   pnpm install --frozen-lockfile
   ```
3. Run database migrations:
   ```bash
   pnpm prisma migrate deploy
   ```
4. Build Next.js application:
   ```bash
   pnpm build
   ```
5. Start web app with PM2:
   ```bash
   pm2 start npm --name "lumo-web" -- start
   ```
6. Configure Nginx reverse proxy with TLS certificate (Let's Encrypt / Certbot).
