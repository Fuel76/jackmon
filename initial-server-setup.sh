#!/bin/bash

# Обновление системы
echo "Обновляем систему..."
apt update && apt upgrade -y

# Установка необходимых пакетов
echo "Устанавливаем необходимые пакеты..."
apt install -y \
    docker.io \
    docker-compose \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw

# Настройка firewall
echo "Настраиваем firewall..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Создание рабочей директории
echo "Создаем рабочую директорию..."
mkdir -p /var/www/monastyr
cd /var/www/monastyr

# Настройка Docker
echo "Настраиваем Docker..."
systemctl enable docker
systemctl start docker

# Создание сети Docker
echo "Создаем сеть Docker..."
docker network create monastyr-network

# Создание необходимых директорий
echo "Создаем необходимые директории..."
mkdir -p config/nginx
mkdir -p ssl
mkdir -p data/postgres
mkdir -p uploads

# Настройка прав
echo "Настраиваем права доступа..."
chown -R $USER:$USER /var/www/monastyr
chmod -R 755 /var/www/monastyr

echo "Начальная настройка сервера завершена!"