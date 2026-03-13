#!/bin/sh

# Применяем миграции Prisma
echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Если нужно создать админа (опционально)
# echo "Creating admin user..."
# node create-admin.js

# Запускаем само приложение
echo "Starting application..."
exec node server.js
