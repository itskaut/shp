#!/bin/bash

echo "========================================"
echo "     Инициализация Docker Swarm"
echo "========================================"

echo "1. Инициализация Docker Swarm..."
docker swarm init --advertise-addr 127.0.0.1 2>/dev/null || echo "Swarm уже инициализирован"

echo "2. Создание overlay сети..."
docker network create --driver overlay shop-network 2>/dev/null || echo "Сеть уже существует"

echo "3. Развертывание стека..."
docker stack deploy -c docker-compose.swarm.yml shop

echo ""
echo "4. Ожидаем запуск сервисов..."
sleep 10

echo ""
echo "========================================"
echo "          ГОТОВО!"
echo "========================================"
echo ""
echo "Ваш магазин доступен по адресам:"
echo "  🛒 Frontend (магазин):   http://localhost"
echo "  ⚙️  API:                  http://localhost:4000"
echo "  📊 Adminer (база данных): http://localhost:8080"
echo ""
echo "Для проверки состояния выполните:"
echo "  docker service ls"
echo ""
echo "Для просмотра логов:"
echo "  docker service logs shop_api -f"
echo ""
echo "Для остановки:"
echo "  ./swarm-remove.sh"
echo "========================================"
