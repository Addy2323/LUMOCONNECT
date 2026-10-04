#!/usr/bin/env bash
# ==============================================================================
# LUMO Platform — Automated Contabo VPS Production Deployment Script
# OS: Ubuntu 22.04 LTS / 24.04 LTS on Contabo Cloud VPS
# ==============================================================================

set -e

echo "🚀 Starting LUMO Contabo VPS Production Deployment..."

# 1. System Package Updates & Prerequisites
echo "📦 Updating system packages & installing prerequisites..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# 2. Node.js 22 LTS & pnpm Installation
echo "🟢 Installing Node.js 22 LTS & pnpm..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm install -g pnpm pm2

# 3. PostgreSQL 16 Installation & Database Setup
echo "🐘 Setting up PostgreSQL 16 Database..."
if ! command -v psql &> /dev/null; then
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
fi

# Ensure lumo database and user exist
sudo -u postgres psql -c "CREATE USER lumouser WITH PASSWORD 'LumoSecurePass2026!';" || true
sudo -u postgres psql -c "CREATE DATABASE lumodb OWNER lumouser;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lumodb TO lumouser;" || true

# 4. Install Project Dependencies & Generate Prisma Client
echo "🔧 Installing project dependencies & generating database client..."
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy

# 5. Build Next.js Production Bundle
echo "🏗️ Building Next.js application..."
pnpm build

# 6. PM2 Process Management Setup
echo "⚡ Starting application with PM2 process manager..."
pm2 stop lumo 2>/dev/null || true
pm2 delete lumo 2>/dev/null || true
pm2 start npm --name "lumo" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER || true

# 7. Nginx Configuration
echo "🌐 Configuring Nginx Reverse Proxy..."
DOMAIN=${1:-"lumo.africa"}

cat <<EOF | sudo tee /etc/nginx/sites-available/lumo
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/lumo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Deployment complete! Server is running at http://$DOMAIN (or http://$(hostname -I | awk '{print $1}'))"
echo "🔐 To enable HTTPS SSL, run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
