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

## 3. Contabo VPS Deployment (Automated Setup)

### Option A: One-Command Automated Setup (Recommended)
On your Contabo VPS, clone the repo and run the automated deployment script:
```bash
git clone https://github.com/Addy2323/LUMOCONNECT.git
cd LUMOCONNECT
cp .env.example .env
# Edit .env with production database credentials & secrets
nano .env

chmod +x scripts/deploy-contabo.sh
./scripts/deploy-contabo.sh yourdomain.com
```

### Option B: Step-by-Step Manual Deployment on Contabo
1. **Connect to Contabo VPS via SSH**:
   ```bash
   ssh root@<YOUR_CONTABO_IP>
   ```
2. **Install Node.js 22 LTS, pnpm, and PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql nginx certbot python3-certbot-nginx
   sudo npm install -g pnpm pm2
   ```
3. **Configure Database**:
   ```bash
   sudo -u postgres psql -c "CREATE USER lumouser WITH PASSWORD 'YourSecurePassword!';"
   sudo -u postgres psql -c "CREATE DATABASE lumodb OWNER lumouser;"
   ```
4. **Deploy App**:
   ```bash
   git clone https://github.com/Addy2323/LUMOCONNECT.git
   cd LUMOCONNECT
   pnpm install --frozen-lockfile
   pnpm prisma migrate deploy
   pnpm build
   pm2 start npm --name "lumo" -- start
   pm2 save
   ```
5. **Enable SSL Certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

