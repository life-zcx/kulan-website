#!/bin/bash

# Проверьте, что DNS уже настроен на IP 78.140.246.192
DOMAIN="adkulan.shop"
EMAIL="admin@adkulan.kz" # Замените на ваш email

echo "### Starting SSL setup for $DOMAIN..."

# 1. Запускаем только nginx (пока без SSL конфига, нужно будет временно изменить его или создать базовый)
# Но проще использовать временный контейнер certbot для получения сертификата standalone

docker run -it --rm \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -p 80:80 \
    certbot/certbot certonly --standalone \
    -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --no-eff-email

echo "### SSL Certificate generated. Now you can start the whole stack with 'docker-compose up -d'"
