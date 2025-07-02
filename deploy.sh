#!/bin/bash

# Установка необходимых пакетов
echo "Установка необходимых пакетов..."
apt update
apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Установка Node.js и PM2
echo "Установка Node.js и PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2 pnpm

# Создание рабочей директории
echo "Создание рабочей директории..."
mkdir -p /var/www/monastyr
chown -R $USER:$USER /var/www/monastyr

# Настройка PostgreSQL
echo "Настройка PostgreSQL..."
sudo -u postgres psql -c "CREATE USER monastyr WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "CREATE DATABASE monastyr OWNER monastyr;"

# Настройка Nginx
echo "Настройка Nginx..."
cp backend/config/nginx.conf /etc/nginx/sites-available/monastyr
ln -s /etc/nginx/sites-available/monastyr /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Сборка и запуск приложения
echo "Сборка и запуск приложения..."
cd webapp
pnpm install
pnpm build
cd ../backend
pnpm install
pnpm build
pm2 start ecosystem.config.json

# Настройка автозапуска PM2
pm2 startup
pm2 save

echo "Деплой завершен!"
echo "Не забудьте:"
echo "1. Изменить пароли в ecosystem.config.json"
echo "2. Настроить SSL через certbot"
echo "3. Настроить бэкапы базы данных"
