#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Начинаем проверку конфигурации...${NC}"

# Проверяем наличие необходимых переменных окружения
if [ -z "$DATABASE_URL" ] || [ -z "$JWT_SECRET" ] || [ -z "$ADMIN_REGISTRATION_KEY" ]; then
    echo -e "${RED}Ошибка: Не все необходимые переменные окружения установлены${NC}"
    echo "Требуются: DATABASE_URL, JWT_SECRET, ADMIN_REGISTRATION_KEY"
    exit 1
fi

echo -e "${GREEN}Конфигурация проверена успешно${NC}"
echo -e "${GREEN}Теперь вы можете использовать интерфейс Timeweb Cloud для деплоя приложения${NC}"
echo "1. Откройте https://timeweb.cloud/apps"
echo "2. Создайте новое приложение для бэкенда (Node.js)"
echo "3. Создайте новое приложение для фронтенда (React)"
echo "4. Настройте переменные окружения в интерфейсе Timeweb Cloud"
echo "5. Подключите GitHub репозиторий к обоим приложениям"

echo "Деплой фронтенда на Timeweb Cloud..."
tw deploy

echo -e "${GREEN}Деплой завершен!${NC}"
echo -e "${GREEN}Следующие шаги:${NC}"
echo "1. Настройте переменные окружения в панели управления Timeweb Cloud"
echo "2. Запустите миграции базы данных: npx prisma migrate deploy"
echo "3. Зарегистрируйте администратора через API"
