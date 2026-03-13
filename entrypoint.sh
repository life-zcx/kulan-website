#!/bin/sh

# Применяем миграции Prisma
echo "Running prisma migrate deploy..."
npx prisma migrate deploy

# Если нужно создать админа (опционально)
# echo "Creating admin user..."
# node create-admin.js

# Запуск приложения
echo "Starting application..."
node server.js
