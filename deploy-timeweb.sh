#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Начинаем деплой на Timeweb Cloud...${NC}"

# Проверяем, установлен ли Timeweb CLI
if ! command -v tw &> /dev/null; then
    echo -e "${RED}Timeweb CLI не установлен. Устанавливаем...${NC}"
    npm install -g @timeweb-cloud/cli
fi

# Проверяем авторизацию
if ! tw whoami &> /dev/null; then
    echo -e "${RED}Необходима авторизация в Timeweb CLI...${NC}"
    tw login
fi

# Деплой бэкенда
echo -e "${GREEN}Деплой бэкенда...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo -e "${RED}Файл .env не найден. Создаем из примера...${NC}"
    cp .env.example .env
fi

echo "Установка зависимостей..."
npm install

echo "Генерация Prisma клиента..."
npx prisma generate

echo "Сборка бэкенда..."
npm run build

echo "Деплой бэкенда на Timeweb Cloud..."
tw deploy

# Деплой фронтенда
echo -e "${GREEN}Деплой фронтенда...${NC}"
cd ../webapp

echo "Установка зависимостей..."
npm install

echo "Сборка фронтенда..."
npm run build

echo "Деплой фронтенда на Timeweb Cloud..."
tw deploy

echo -e "${GREEN}Деплой завершен!${NC}"
echo -e "${GREEN}Следующие шаги:${NC}"
echo "1. Настройте переменные окружения в панели управления Timeweb Cloud"
echo "2. Запустите миграции базы данных: npx prisma migrate deploy"
echo "3. Зарегистрируйте администратора через API"
