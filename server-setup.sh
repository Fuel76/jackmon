#!/bin/bash

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
    echo "Этот скрипт должен быть запущен с правами root"
    exit 1
fi

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
    python3-certbot-nginx

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
mkdir -p {config/nginx,ssl,data/postgres,uploads}

# Настройка SSL (если есть домен)
read -p "Укажите домен (или нажмите Enter для пропуска): " DOMAIN
if [ ! -z "$DOMAIN" ]; then
    echo "Настраиваем SSL для домена $DOMAIN..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Настройка .env
echo "Настраиваем .env файл..."
if [ -f .env.example ]; then
    cp .env.example .env
    # Генерация случайных паролей
    DB_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your_secure_password/$DB_PASSWORD/" .env
    sed -i "s/your_secure_jwt_secret/$JWT_SECRET/" .env
    if [ ! -z "$DOMAIN" ]; then
        sed -i "s/your-domain.com/$DOMAIN/" .env
    fi
fi

# Запуск контейнеров
echo "Запускаем контейнеры..."
docker-compose up -d

echo "Установка завершена!"
echo "База данных создана с паролем: $DB_PASSWORD"
echo "JWT секрет: $JWT_SECRET"
echo "Пожалуйста, сохраните эти данные в надежном месте"
